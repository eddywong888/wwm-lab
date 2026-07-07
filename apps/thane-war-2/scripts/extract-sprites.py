import os
import sys
import numpy as np
from PIL import Image, ImageEnhance, ImageFilter
import base64
from io import BytesIO

def get_connected_components(mask):
    H, W = mask.shape
    visited = np.zeros((H, W), dtype=bool)
    components = []
    
    for y in range(H):
        for x in range(W):
            if mask[y, x] and not visited[y, x]:
                comp = []
                queue = [(y, x)]
                visited[y, x] = True
                
                head = 0
                while head < len(queue):
                    cy, cx = queue[head]
                    head += 1
                    comp.append((cy, cx))
                    
                    for dy, dx in [(-1,0), (1,0), (0,-1), (0,1)]:
                        ny, nx = cy + dy, cx + dx
                        if 0 <= ny < H and 0 <= nx < W:
                            if mask[ny, nx] and not visited[ny, nx]:
                                visited[ny, nx] = True
                                queue.append((ny, nx))
                components.append(comp)
    return components

def fill_holes(mask):
    H, W = mask.shape
    visited = np.zeros((H, W), dtype=bool)
    queue = []
    
    for y in range(H):
        if not mask[y, 0]: queue.append((y, 0)); visited[y, 0] = True
        if not mask[y, W-1]: queue.append((y, W-1)); visited[y, W-1] = True
    for x in range(W):
        if not mask[0, x]: queue.append((0, x)); visited[0, x] = True
        if not mask[H-1, x]: queue.append((H-1, x)); visited[H-1, x] = True
            
    head = 0
    while head < len(queue):
        cy, cx = queue[head]
        head += 1
        
        for dy, dx in [(-1,0), (1,0), (0,-1), (0,1)]:
            ny, nx = cy + dy, cx + dx
            if 0 <= ny < H and 0 <= nx < W:
                if not mask[ny, nx] and not visited[ny, nx]:
                    visited[ny, nx] = True
                    queue.append((ny, nx))
    return ~visited

def rgb_to_hsv(rgb):
    # rgb is [..., 3] with values 0-255
    r, g, b = rgb[..., 0]/255.0, rgb[..., 1]/255.0, rgb[..., 2]/255.0
    cmax = np.max(rgb[..., :3], axis=-1)/255.0
    cmin = np.min(rgb[..., :3], axis=-1)/255.0
    delta = cmax - cmin
    
    h = np.zeros_like(cmax)
    s = np.zeros_like(cmax)
    v = cmax
    
    mask = delta != 0
    s[mask] = delta[mask] / cmax[mask]
    
    idx = (cmax == r) & mask
    h[idx] = (60 * ((g[idx] - b[idx]) / delta[idx]) + 360) % 360
    
    idx = (cmax == g) & mask
    h[idx] = (60 * ((b[idx] - r[idx]) / delta[idx]) + 120) % 360
    
    idx = (cmax == b) & mask
    h[idx] = (60 * ((r[idx] - g[idx]) / delta[idx]) + 240) % 360
    
    return np.stack([h, s, v], axis=-1)

def apply_tier1(img_arr):
    # steel blue shading, brighter weapons
    # img_arr is RGBA 48x48
    out = img_arr.copy()
    alpha = out[..., 3]
    rgb = out[..., :3]
    hsv = rgb_to_hsv(rgb)
    
    s = hsv[..., 1]
    v = hsv[..., 2]
    
    # Identify armor (low saturation, medium-high brightness)
    armor_mask = (s < 0.4) & (v > 0.3) & (alpha > 0)
    
    # Shift toward steel blue (add blue/cyan, reduce red)
    out[armor_mask, 0] = np.clip(out[armor_mask, 0] * 0.7, 0, 255)
    out[armor_mask, 1] = np.clip(out[armor_mask, 1] * 1.1 + 20, 0, 255)
    out[armor_mask, 2] = np.clip(out[armor_mask, 2] * 1.3 + 40, 0, 255)
    
    # Identify weapons/highlights (high brightness)
    weapon_mask = (v > 0.8) & (alpha > 0)
    out[weapon_mask, :3] = np.clip(out[weapon_mask, :3] * 1.3, 0, 255)
    
    return out

def apply_tier2(img_arr):
    # gold accents, glowing weapons, royal-gold outline
    out = img_arr.copy()
    alpha = out[..., 3]
    rgb = out[..., :3]
    hsv = rgb_to_hsv(rgb)
    
    s = hsv[..., 1]
    v = hsv[..., 2]
    
    # Identify armor (low saturation, medium brightness)
    armor_mask = (s < 0.4) & (v > 0.3) & (alpha > 0)
    
    # Shift toward gold (high red/green, lower blue)
    out[armor_mask, 0] = np.clip(out[armor_mask, 0] * 1.4 + 40, 0, 255) # R
    out[armor_mask, 1] = np.clip(out[armor_mask, 1] * 1.2 + 20, 0, 255) # G
    out[armor_mask, 2] = np.clip(out[armor_mask, 2] * 0.5, 0, 255)      # B
    
    # Brightest pixels near white with warm halo
    weapon_mask = (v > 0.85) & (alpha > 0)
    out[weapon_mask, :3] = np.array([255, 255, 220])
    
    # Royal-gold outline (dilate alpha)
    outline = np.zeros_like(alpha)
    H, W = alpha.shape
    for y in range(H):
        for x in range(W):
            if alpha[y, x] == 0:
                has_neighbor = False
                for dy, dx in [(-1,0), (1,0), (0,-1), (0,1)]:
                    ny, nx = y + dy, x + dx
                    if 0 <= ny < H and 0 <= nx < W and alpha[ny, nx] > 0:
                        has_neighbor = True
                        break
                if has_neighbor:
                    outline[y, x] = 255
                    
    out[outline > 0] = np.array([255, 215, 0, 255])
    return out

def extract():
    img_path = "/private/tmp/claude-501/-Users-eddywong-Documents-Codex-wwm-lab/e347e1a5-d17f-4460-ac41-326f64563ffd/scratchpad/sprite-sheet.png"
    img = Image.open(img_path).convert("RGB")
    data = np.array(img)
    
    # Background = any near-neutral gray in the checker luminance range. This
    # removes both checker tones AND their anti-aliased blends while keeping
    # tinted grays (e.g. the Footman's blue-gray armor has channel spread >= 14).
    r_ch = data[..., 0].astype(int)
    g_ch = data[..., 1].astype(int)
    b_ch = data[..., 2].astype(int)
    mx = np.maximum(np.maximum(r_ch, g_ch), b_ch)
    mn = np.minimum(np.minimum(r_ch, g_ch), b_ch)
    lum = (r_ch + g_ch + b_ch) / 3
    bg_mask = (mx - mn < 14) & (lum > 100) & (lum < 205)
    fg_mask = ~bg_mask

    # Character bands measured on the sheet: they exclude the title bar and
    # the caption text under each figure.
    ROW_BANDS = [(62, 230), (246, 406), (422, 582), (598, 750)]
    COL_BANDS = [(0, 352), (352, 704), (704, 1056), (1056, 1408)]
    
    out_dir = "/private/tmp/claude-501/-Users-eddywong-Documents-Codex-wwm-lab/e347e1a5-d17f-4460-ac41-326f64563ffd/scratchpad/sprite-previews"
    os.makedirs(out_dir, exist_ok=True)
    
    # Mappings
    # player_0 (Aldermark):
    # laborer: 12, spearman: 0, archer: 1, cleric: 4
    # player_1 (Gharok Horde):
    # laborer: 14, spearman: 8, archer: 9, cleric: 11
    
    mapping = {
        'laborer_0': 12, 'spearman_0': 0, 'archer_0': 1, 'cleric_0': 4,
        'laborer_1': 14, 'spearman_1': 8, 'archer_1': 9, 'cleric_1': 11
    }
    
    extracted_bitmaps = {}
    
    for key, idx in mapping.items():
        r = idx // 4
        c = idx % 4
        y0, y1 = ROW_BANDS[r]
        x0, x1 = COL_BANDS[c]

        cell_fg = fg_mask[y0:y1, x0:x1].copy()

        comps = get_connected_components(cell_fg)
        if not comps:
            print(f"No component for {key}")
            continue
            
        largest_comp = max(comps, key=len)
        clean_fg = np.zeros_like(cell_fg)
        for cy, cx in largest_comp:
            clean_fg[cy, cx] = True
            
        clean_fg = fill_holes(clean_fg)
        
        y_indices, x_indices = np.where(clean_fg)
        min_y, max_y = np.min(y_indices), np.max(y_indices)
        min_x, max_x = np.min(x_indices), np.max(x_indices)
        
        cell_data = data[y0:y1, x0:x1]
        
        crop_h = max_y - min_y + 1
        crop_w = max_x - min_x + 1
        
        cropped_rgba = np.zeros((crop_h, crop_w, 4), dtype=np.uint8)
        cropped_fg = clean_fg[min_y:max_y+1, min_x:max_x+1]
        cropped_rgba[cropped_fg, :3] = cell_data[min_y:max_y+1, min_x:max_x+1][cropped_fg]
        cropped_rgba[cropped_fg, 3] = 255
        
        # Scale to fit 48x48
        # "height 48"
        scale = 48.0 / crop_h
        new_w = int(crop_w * scale)
        if new_w > 48:
            scale = 48.0 / crop_w
            new_w = 48
        new_h = int(crop_h * scale)
        
        pil_img = Image.fromarray(cropped_rgba).resize((new_w, new_h), resample=Image.NEAREST)
        resized_rgba = np.array(pil_img)
        
        # Place on 48x48 canvas, feet at BOTTOM row, horizontally centered
        canvas48 = np.zeros((48, 48, 4), dtype=np.uint8)
        start_x = (48 - new_w) // 2
        start_y = 48 - new_h # feet at bottom
        
        canvas48[start_y:start_y+new_h, start_x:start_x+new_w] = resized_rgba
        
        for tier in range(3):
            if tier == 0:
                tier_arr = canvas48
            elif tier == 1:
                tier_arr = apply_tier1(canvas48)
            else:
                tier_arr = apply_tier2(canvas48)
                
            # Save 4x upscaled preview
            preview = Image.fromarray(tier_arr).resize((192, 192), resample=Image.NEAREST)
            preview_filename = f"{key}_t{tier}.png"
            preview.save(os.path.join(out_dir, preview_filename))
            
            # Encode raw RGBA bytes as base64
            raw_bytes = tier_arr.tobytes()
            b64 = base64.b64encode(raw_bytes).decode('utf-8')
            extracted_bitmaps[f"{key}_t{tier}"] = b64

    # Generate units48.ts
    ts_path = "/Users/eddywong/Documents/Codex/wwm-lab/apps/thane-war-2/src/assets/units48.ts"
    
    ts_code = "export const UNIT_BITMAPS: Record<string, string> = {\n"
    for k, v in extracted_bitmaps.items():
        ts_code += f"  '{k}': '{v}',\n"
    ts_code += "};\n\n"
    ts_code += """export function bitmapToCanvas(b64: string): HTMLCanvasElement {
  const binary = atob(b64);
  const len = binary.length;
  const bytes = new Uint8ClampedArray(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  const c = document.createElement('canvas');
  c.width = 48;
  c.height = 48;
  const ctx = c.getContext('2d')!;
  const imgData = new ImageData(bytes, 48, 48);
  ctx.putImageData(imgData, 0, 0);
  return c;
}
"""
    with open(ts_path, 'w') as f:
        f.write(ts_code)

if __name__ == '__main__':
    extract()

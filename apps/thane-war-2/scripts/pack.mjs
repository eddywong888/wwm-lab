/**
 * Packs the Thane War build for publishing without its source code:
 *  1. copies dist/apps/thane-war-2 → apps/thane-war-2/prebuilt/web  (served live on the site)
 *  2. inlines the JS + CSS into a single self-contained HTML file at
 *     apps/thane-war-2/prebuilt/downloads/thane-war-2.html  (works offline from file://)
 *
 * Run after building the game: npm run pack:thane-war-2  (from the repo root)
 * The prebuilt/ folder is committed; apps/thane-war-2/src/ is gitignored.
 */
import { cpSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('../../..', import.meta.url).pathname;
const appDir = new URL('..', import.meta.url).pathname;
const built = join(root, 'dist/apps/thane-war-2');
const prebuiltApp = join(appDir, 'prebuilt/web');
const downloadDir = join(appDir, 'prebuilt/downloads');

// 1. Refresh the prebuilt live bundle.
rmSync(prebuiltApp, { recursive: true, force: true });
mkdirSync(prebuiltApp, { recursive: true });
cpSync(built, prebuiltApp, { recursive: true });

// 2. Build the single-file download.
const assetsDir = join(built, 'assets');
const assets = readdirSync(assetsDir);
const jsFile = assets.find((f) => f.endsWith('.js'));
const cssFile = assets.find((f) => f.endsWith('.css'));
if (!jsFile || !cssFile) throw new Error('Expected one JS and one CSS asset in ' + assetsDir);

let html = readFileSync(join(built, 'index.html'), 'utf8');
const js = readFileSync(join(assetsDir, jsFile), 'utf8').replace(/<\/script>/g, '<\\/script>');
const css = readFileSync(join(assetsDir, cssFile), 'utf8');

html = html.replace(/<script type="module"[^>]*><\/script>/, () => `<script type="module">${js}</script>`);
html = html.replace(/<link rel="stylesheet"[^>]*>/, () => `<style>${css}</style>`);
if (html.includes('src="/apps/thane-war-2/') || html.includes('href="/apps/thane-war-2/assets')) {
  throw new Error('Inlining failed: external asset references remain');
}

mkdirSync(downloadDir, { recursive: true });
writeFileSync(join(downloadDir, 'thane-war-2.html'), html);

const size = (Buffer.byteLength(html) / 1024).toFixed(0);
console.log(`✓ apps/thane-war-2/prebuilt/web refreshed`);
console.log(`✓ apps/thane-war-2/prebuilt/downloads/thane-war-2.html written (${size} kB, self-contained)`);

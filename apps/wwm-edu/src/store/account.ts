// Phase 3 lightweight accounts: nickname + PIN, no email/PII. userKey is a
// one-way hex-SHA-256 derived client-side; the PIN is never transmitted or
// stored anywhere as plaintext, and there is no server-side "create
// account" step — signing in with the same nickname+PIN on a new device
// just re-derives the same userKey and pulls whatever progress is stored
// under it. A wrong PIN silently behaves like a brand-new (empty) profile;
// there is no way to detect or prevent that, and given the low stakes
// (a kids' practice app, no PII) that's an acceptable tradeoff.
import { loadState, saveState, updateState, type EduState } from './local';
import { pullAndMergeProgress, pushProgress } from './sync';

const NICKNAME_RE = /^[\p{L}\p{N} ]{2,16}$/u;
const PIN_RE = /^\d{4,6}$/;

export function validateNickname(nickname: string): boolean {
  return NICKNAME_RE.test(nickname.trim());
}

export function validatePin(pin: string): boolean {
  return PIN_RE.test(pin);
}

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function deriveUserKey(nickname: string, pin: string): Promise<string> {
  return sha256Hex(`wwm-edu:${nickname.toLowerCase().trim()}:${pin}`);
}

/** Create-or-restore: derive the userKey from nickname+PIN, save it
 * locally, then pull+merge whatever progress the server has for that key
 * (empty if this is genuinely new, or a wrong PIN). Always resolves. */
export async function signIn(nickname: string, pin: string): Promise<EduState> {
  const cleanNickname = nickname.trim();
  const userKey = await deriveUserKey(cleanNickname, pin);
  updateState({ account: { nickname: cleanNickname, userKey } });
  const merged = await pullAndMergeProgress(userKey);
  void pushProgress(userKey);
  return merged;
}

/** Log out: drop the local {nickname,userKey}, keep all local progress. */
export function signOut(): EduState {
  const state = loadState();
  const next: EduState = { ...state, account: undefined };
  saveState(next);
  return next;
}

export function getAccount(): EduState['account'] {
  return loadState().account;
}

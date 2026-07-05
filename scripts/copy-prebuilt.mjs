/**
 * Copies committed prebuilt bundles (games shipped without source) into dist/.
 * Runs as the last step of the root build, so deploys work on machines that
 * don't have the private game sources (e.g. Cloudflare Pages CI).
 *
 * Each entry maps a committed folder inside the app to its place in dist/.
 */
import { cpSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const dist = join(root, 'dist');

const BUNDLES = [
  ['apps/thane-war/prebuilt/web', 'apps/thane-war'],
  ['apps/thane-war/prebuilt/downloads', 'downloads'],
];

for (const [from, to] of BUNDLES) {
  const src = join(root, from);
  if (existsSync(src)) {
    cpSync(src, join(dist, to), { recursive: true });
    console.log(`✓ ${from} → dist/${to}`);
  } else {
    console.log(`(missing ${from}, skipping)`);
  }
}

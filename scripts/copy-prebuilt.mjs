/**
 * Copies committed prebuilt bundles (games shipped without source) into dist/.
 * Runs as the last step of the root build, so deploys work on machines that
 * don't have the private game sources (e.g. Cloudflare Pages CI).
 */
import { cpSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const prebuilt = join(root, 'prebuilt');
const dist = join(root, 'dist');

if (existsSync(prebuilt)) {
  cpSync(prebuilt, dist, { recursive: true });
  console.log('✓ prebuilt/ copied into dist/');
} else {
  console.log('(no prebuilt/ folder, skipping)');
}

// Checks the built site: every route page exists and every asset it links to was emitted.
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { routes } from './postbuild.mjs';

const dist = fileURLToPath(new URL('../dist/', import.meta.url));
for (const page of ['index.html', '404.html', ...routes.map((r) => `${r}/index.html`)]) {
  const file = join(dist, page);
  assert.ok(existsSync(file), `missing ${page}`);
  const html = readFileSync(file, 'utf8');
  for (const [, src] of html.matchAll(/(?:src|href)="\/([^"]+)"/g)) assert.ok(existsSync(join(dist, src)), `${page} links missing /${src}`);
}
console.log(`selftest: ${routes.length + 2} pages OK`);

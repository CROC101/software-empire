// Static hosting: copy the SPA shell to every route folder so deep links load directly.
import { copyFileSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const dist = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist');
const shell = join(dist, 'index.html');

// Title ids are String(81000 + i * 37) for every entry in SEEDS (see src/data/catalog.ts).
const catalog = readFileSync(join(dist, '..', 'src', 'data', 'catalog.ts'), 'utf8');
const seeds = catalog.slice(catalog.indexOf('const SEEDS'), catalog.indexOf('];', catalog.indexOf('const SEEDS')));
const count = (seeds.match(/^\s*\['/gm) || []).length;
if (count < 25) throw new Error(`postbuild: expected 25+ titles in SEEDS, found ${count}`);

const routes = [
  'th', 'th/login', 'login', 'youraccount', 'redeem', 'gift-cards', 'profiles',
  'browse', 'browse/tv', 'browse/movies', 'browse/my-list', 'latest', 'search',
  ...Array.from({ length: count }, (_, i) => `watch/${81000 + i * 37}`),
];
for (const r of routes) {
  mkdirSync(join(dist, r), { recursive: true });
  copyFileSync(shell, join(dist, r, 'index.html'));
}
copyFileSync(shell, join(dist, '404.html'));
console.log(`postbuild: ${routes.length} route pages + 404.html (${count} titles)`);

// Static hosting: give every known route its own index.html, and a 404.html fallback for dynamic ones.
import { copyFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const routes = [
  'accounts/password/reset', 'accounts/emailsignup', 'accounts/edit', 'legal/privacy', 'legal/terms',
  'explore', 'reels', 'direct/inbox',
];

const dist = fileURLToPath(new URL('../dist/', import.meta.url));
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  for (const r of routes) {
    mkdirSync(join(dist, r), { recursive: true });
    copyFileSync(join(dist, 'index.html'), join(dist, r, 'index.html'));
  }
  copyFileSync(join(dist, 'index.html'), join(dist, '404.html'));
  console.log(`postbuild: wrote ${routes.length} route pages + 404.html`);
}

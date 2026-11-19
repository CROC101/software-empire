// Copy dist/index.html to every route so each page works as a static file.
import { copyFileSync, mkdirSync } from 'node:fs';
import { apps, simplePages } from '../src/brand.js';
const routes = ['/apps', '/studio', '/pricing', '/support', ...Object.keys(simplePages), ...apps.map((a) => '/apps/' + a.slug)];
for (const r of routes) {
  mkdirSync('dist' + r, { recursive: true });
  copyFileSync('dist/index.html', 'dist' + r + '/index.html');
}
copyFileSync('dist/index.html', 'dist/404.html');
console.log('routes written:', routes.length);

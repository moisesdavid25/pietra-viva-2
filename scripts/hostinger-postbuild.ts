/**
 * Post-build para Hostinger (leomenu.it).
 * Sobreescribe dist/index.html y dist/lancio/index.html
 * con los archivos standalone de public/ que NO usan el bundle de React.
 *
 * Uso: npm run build:hostinger
 * (NO ejecutar para deploys de Vercel — Vercel usa npm run build)
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const OVERWRITES: { src: string; dest: string }[] = [
  { src: 'public/leomenu-landing.html', dest: 'dist/index.html'        },
  { src: 'public/lancio.html',          dest: 'dist/lancio/index.html' },
];

console.log('\n🏠 Preparando build Hostinger...\n');

for (const { src, dest } of OVERWRITES) {
  const srcPath  = path.resolve(root, src);
  const destPath = path.resolve(root, dest);

  if (!fs.existsSync(srcPath)) {
    console.warn(`  ⚠  ${src} non trovato, skip`);
    continue;
  }

  fs.mkdirSync(path.dirname(destPath), { recursive: true });
  fs.copyFileSync(srcPath, destPath);
  console.log(`  ✓  ${src}  →  ${dest}`);
}

console.log('\n✅ dist/ pronto per Hostinger. Carica dist/ su public_html/\n');

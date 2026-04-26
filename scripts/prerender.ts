/**
 * Static prerender script — runs after `vite build`.
 * Generates pre-rendered HTML for each marketing route so Google can index them.
 * Usage: tsx scripts/prerender.ts
 */
import 'dotenv/config'; // must be first — loads .env before Supabase client initializes
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { render } from '../src/entry-server.tsx';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.resolve(__dirname, '../dist');

const ROUTES: { routePath: string; file: string; title: string; description: string }[] = [
  {
    routePath: '/',
    file: 'index.html',
    title: 'Leomenu - Il menù digitale per il tuo ristorante',
    description: 'Crea il menù QR del tuo ristorante in 15 minuti. Aggiornamenti in tempo reale, fidelizzazione clienti e zero costi di stampa.',
  },
  {
    routePath: '/funzionalita',
    file: 'funzionalita/index.html',
    title: 'Funzionalità - Leomenu',
    description: 'QR code, NFC, aggiornamenti in tempo reale, fidelizzazione clienti e analisi avanzate per il tuo ristorante.',
  },
  {
    routePath: '/prezzi',
    file: 'prezzi/index.html',
    title: 'Prezzi - Leomenu',
    description: 'Piani semplici e trasparenti per il tuo menù digitale. Inizia gratis, senza carta di credito.',
  },
  {
    routePath: '/sicurezza',
    file: 'sicurezza/index.html',
    title: 'Sicurezza - Leomenu',
    description: 'I tuoi dati e quelli dei tuoi clienti sono protetti con i massimi standard di sicurezza.',
  },
  {
    routePath: '/come-funziona',
    file: 'come-funziona/index.html',
    title: 'Come Funziona - Leomenu',
    description: 'Scopri come creare il tuo menù digitale in pochi minuti con Leomenu.',
  },
  {
    routePath: '/contatti',
    file: 'contatti/index.html',
    title: 'Contatti - Leomenu',
    description: 'Hai domande? Contatta il team di Leomenu.',
  },
  {
    routePath: '/privacy-policy',
    file: 'privacy-policy/index.html',
    title: 'Privacy Policy - Leomenu',
    description: 'Informativa sulla privacy di Leomenu.',
  },
  {
    routePath: '/termini-condizioni',
    file: 'termini-condizioni/index.html',
    title: 'Termini e Condizioni - Leomenu',
    description: 'Termini e condizioni di utilizzo di Leomenu.',
  },
  {
    routePath: '/cookie-policy',
    file: 'cookie-policy/index.html',
    title: 'Cookie Policy - Leomenu',
    description: 'Informativa sull\'utilizzo dei cookie su Leomenu.',
  },
  {
    routePath: '/lancio',
    file: 'lancio/index.html',
    title: 'Offerta Fondatori — Il tuo menù online in 48 ore | Leomenu',
    description: 'Piano annuale €204/anno. Carichiamo noi il tuo menù in 48h. 14 giorni gratis, garanzia soddisfatti o rimborsati. Solo 30 posti disponibili.',
  },
];

function injectSSR(template: string, appHtml: string, title: string, description: string): string {
  return template
    .replace(/<title>.*?<\/title>/, `<title>${title}</title>`)
    .replace(/(<meta name="description" content=")[^"]*(")/,`$1${description}$2`)
    .replace('<!--ssr-outlet-->', appHtml)
    .replace('<div id="root">', '<div id="root" data-ssr="true">');
}

const template = fs.readFileSync(path.resolve(distDir, 'index.html'), 'utf-8');

console.log('\n📄 Prerendering marketing routes...\n');

for (const route of ROUTES) {
  try {
    const appHtml = render(route.routePath);
    const html = injectSSR(template, appHtml, route.title, route.description);
    const outFile = path.resolve(distDir, route.file);
    fs.mkdirSync(path.dirname(outFile), { recursive: true });
    fs.writeFileSync(outFile, html);
    console.log(`  ✓  ${route.routePath}  →  dist/${route.file}`);
  } catch (e) {
    console.error(`  ✗  ${route.routePath} failed:`, e);
  }
}

console.log('\n✅ Prerender complete.\n');

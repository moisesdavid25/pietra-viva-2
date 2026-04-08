import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import db from './src/db.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const MARKETING_ROUTES = [
  '/',
  '/funzionalita',
  '/prezzi',
  '/sicurezza',
  '/come-funziona',
  '/contatti',
  '/privacy-policy',
  '/privacy',
  '/termini-condizioni',
  '/terms',
];

const PAGE_META: Record<string, { title: string; description: string }> = {
  '/': {
    title: 'Leomenu - Il menù digitale per il tuo ristorante',
    description: 'Crea il menù QR del tuo ristorante in 15 minuti. Aggiornamenti in tempo reale, fidelizzazione clienti e zero costi di stampa.',
  },
  '/funzionalita': {
    title: 'Funzionalità - Leomenu',
    description: 'QR code, NFC, aggiornamenti in tempo reale, fidelizzazione clienti e analisi avanzate per il tuo ristorante.',
  },
  '/prezzi': {
    title: 'Prezzi - Leomenu',
    description: 'Piani semplici e trasparenti per il tuo menù digitale. Inizia gratis, senza carta di credito.',
  },
  '/sicurezza': {
    title: 'Sicurezza - Leomenu',
    description: 'I tuoi dati e quelli dei tuoi clienti sono protetti con i massimi standard di sicurezza.',
  },
  '/come-funziona': {
    title: 'Come Funziona - Leomenu',
    description: 'Scopri come creare il tuo menù digitale in pochi minuti con Leomenu.',
  },
  '/contatti': {
    title: 'Contatti - Leomenu',
    description: 'Hai domande? Contatta il team di Leomenu.',
  },
  '/privacy-policy': {
    title: 'Privacy Policy - Leomenu',
    description: 'Informativa sulla privacy di Leomenu.',
  },
  '/privacy': {
    title: 'Privacy Policy - Leomenu',
    description: 'Informativa sulla privacy di Leomenu.',
  },
  '/termini-condizioni': {
    title: 'Termini e Condizioni - Leomenu',
    description: 'Termini e condizioni di utilizzo di Leomenu.',
  },
  '/terms': {
    title: 'Termini e Condizioni - Leomenu',
    description: 'Termini e condizioni di utilizzo di Leomenu.',
  },
};

function injectSSR(template: string, appHtml: string, routePath: string): string {
  const meta = PAGE_META[routePath] ?? PAGE_META['/'];
  return template
    .replace(/<title>.*?<\/title>/, `<title>${meta.title}</title>`)
    .replace(/(<meta name="description" content=")[^"]*(")/,`$1${meta.description}$2`)
    .replace('<!--ssr-outlet-->', appHtml)
    .replace('<div id="root">', '<div id="root" data-ssr="true">');
}

async function startServer() {
  const app = express();
  const PORT = 3000;
  const isProd = process.env.NODE_ENV === 'production';

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // ── Robots & Sitemap ────────────────────────────────────────────────────────

  app.get('/robots.txt', (_req, res) => {
    res.set('Content-Type', 'text/plain').send(
      `User-agent: *\nAllow: /\n\nSitemap: https://leomenu.it/sitemap.xml`
    );
  });

  app.get('/sitemap.xml', (_req, res) => {
    const base = 'https://leomenu.it';
    const pages = [
      { url: '/', priority: '1.0' },
      { url: '/funzionalita', priority: '0.8' },
      { url: '/prezzi', priority: '0.8' },
      { url: '/come-funziona', priority: '0.8' },
      { url: '/sicurezza', priority: '0.7' },
      { url: '/contatti', priority: '0.6' },
    ];
    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${pages
      .map(
        (p) =>
          `  <url>\n    <loc>${base}${p.url}</loc>\n    <priority>${p.priority}</priority>\n    <changefreq>monthly</changefreq>\n  </url>`
      )
      .join('\n')}\n</urlset>`;
    res.set('Content-Type', 'application/xml').send(xml);
  });

  // ── API Routes ──────────────────────────────────────────────────────────────

  app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    const { data: user, error } = await db.from('admin_users').select('*').eq('email', email).eq('password', password).single();
    if (error || !user) {
      return res.status(401).json({ error: 'Credenziali non valide' });
    }
    res.json({ success: true, email: user.email });
  });

  app.get('/api/settings', async (req, res) => {
    const { data: settings, error } = await db.from('settings').select('*');
    if (error) return res.status(500).json({ error: error.message });
    const settingsObj = (settings || []).reduce((acc: any, curr: any) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {});
    res.json(settingsObj);
  });

  app.put('/api/settings', async (req, res) => {
    const settings = req.body;
    for (const [key, value] of Object.entries(settings)) {
      await db.from('settings').upsert({ key, value });
    }
    res.json({ success: true });
  });

  app.get('/api/menu/:section', async (req, res) => {
    const section = req.params.section;
    const { data: categories, error: catError } = await db.from('categories').select('*').eq('section', section).order('id');
    if (catError) return res.status(500).json({ error: catError.message });

    const menu = [];
    for (const cat of (categories || [])) {
      const { data: products } = await db.from('products').select('*').eq('category_id', cat.id).order('sort_order', { ascending: true }).order('id');
      menu.push({ ...cat, products: products || [] });
    }
    res.json(menu);
  });

  app.get('/api/menus', async (req, res) => {
    const { data: menus, error } = await db.from('menus').select('*').order('id');
    if (error) return res.status(500).json({ error: error.message });
    res.json(menus);
  });

  app.put('/api/menus/:id', async (req, res) => {
    const { id } = req.params;
    const { entree, primo, secondo, contorno, desert, bevande, price } = req.body;
    const { error } = await db.from('menus').update({ entree, primo, secondo, contorno, desert, bevande, price }).eq('id', id);
    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true });
  });

  app.delete('/api/menus/:id', async (req, res) => {
    const { id } = req.params;
    const { error } = await db.from('menus').delete().eq('id', id);
    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true });
  });

  app.get('/api/categories', async (req, res) => {
    const { data: categories, error } = await db.from('categories').select('*').order('id');
    if (error) return res.status(500).json({ error: error.message });
    res.json(categories);
  });

  app.get('/api/products/:id', async (req, res) => {
    const { id } = req.params;
    const { data: product, error } = await db.from('products').select('*').eq('id', id).single();
    if (error || !product) {
      res.status(404).json({ error: 'Product not found' });
    } else {
      res.json(product);
    }
  });

  app.post('/api/products', async (req, res) => {
    const { category_id, name, description, price, price_unit, image_url, sort_order } = req.body;
    const { data, error } = await db.from('products').insert({ category_id, name, description, price, price_unit, image_url, sort_order: sort_order || 0 }).select().single();
    if (error) return res.status(500).json({ error: error.message });
    res.json({ id: data.id });
  });

  app.put('/api/products/:id', async (req, res) => {
    const { id } = req.params;
    const { category_id, name, description, price, price_unit, image_url, sort_order } = req.body;
    const { error } = await db.from('products').update({ category_id, name, description, price, price_unit, image_url, sort_order }).eq('id', id);
    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true });
  });

  app.delete('/api/products/:id', async (req, res) => {
    const { id } = req.params;
    const { error } = await db.from('products').delete().eq('id', id);
    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true });
  });

  // ── SSR + Static Serving ────────────────────────────────────────────────────

  if (!isProd) {
    // Dev mode: Vite handles client-side assets; SSR uses direct tsx import
    // (avoids Vite module runner isolation that breaks react-router context)
    const { render } = await import('./src/entry-server.tsx');

    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: process.env.DISABLE_HMR !== 'true' },
      appType: 'custom',
    });

    // SSR for marketing routes
    app.get(MARKETING_ROUTES, async (req, res, next) => {
      try {
        const rawTemplate = fs.readFileSync(path.resolve(__dirname, 'index.html'), 'utf-8');
        const template = await vite.transformIndexHtml(req.originalUrl, rawTemplate);
        const appHtml = render(req.path);
        const html = injectSSR(template, appHtml, req.path);
        res.status(200).set('Content-Type', 'text/html').end(html);
      } catch (e) {
        next(e);
      }
    });

    app.use(vite.middlewares);

    // SPA fallback for all other routes
    app.get('*', async (req, res) => {
      const rawTemplate = fs.readFileSync(path.resolve(__dirname, 'index.html'), 'utf-8');
      const template = await vite.transformIndexHtml(req.originalUrl, rawTemplate);
      res.status(200).set('Content-Type', 'text/html').end(template);
    });
  } else {
    // Production: serve pre-built static files (prerendered by scripts/prerender.ts)
    app.use(express.static(path.resolve(__dirname, 'dist')));

    // SPA fallback for all other routes
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist/index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

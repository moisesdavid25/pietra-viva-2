import 'dotenv/config';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import db from './src/db.ts';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

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
      menu.push({
        ...cat,
        products: products || []
      });
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

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

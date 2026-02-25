import express from 'express';
import { createServer as createViteServer } from 'vite';
import db from './src/db.ts';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  app.get('/api/settings', (req, res) => {
    const settings = db.prepare('SELECT * FROM settings').all() as any[];
    const settingsObj = settings.reduce((acc: any, curr: any) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {});
    res.json(settingsObj);
  });

  app.put('/api/settings', (req, res) => {
    const settings = req.body;
    const stmt = db.prepare('UPDATE settings SET value = ? WHERE key = ?');
    const insertStmt = db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)');
    
    db.transaction(() => {
      for (const [key, value] of Object.entries(settings)) {
        const info = stmt.run(value, key);
        if (info.changes === 0) {
          insertStmt.run(key, value);
        }
      }
    })();
    res.json({ success: true });
  });

  app.get('/api/menu/:section', (req, res) => {
    const section = req.params.section;
    const categories = db.prepare('SELECT * FROM categories WHERE section = ?').all(section);
    
    const menu = categories.map((cat: any) => {
      const products = db.prepare('SELECT * FROM products WHERE category_id = ?').all(cat.id);
      return {
        ...cat,
        products
      };
    });

    res.json(menu);
  });

  app.get('/api/menus', (req, res) => {
    const menus = db.prepare('SELECT * FROM menus').all();
    res.json(menus);
  });

  app.put('/api/menus/:id', (req, res) => {
    const { id } = req.params;
    const { entree, primo, secondo, contorno, desert, bevande, price } = req.body;
    const stmt = db.prepare('UPDATE menus SET entree = ?, primo = ?, secondo = ?, contorno = ?, desert = ?, bevande = ?, price = ? WHERE id = ?');
    stmt.run(entree, primo, secondo, contorno, desert, bevande, price, id);
    res.json({ success: true });
  });

  app.get('/api/categories', (req, res) => {
    const categories = db.prepare('SELECT * FROM categories').all();
    res.json(categories);
  });

  app.get('/api/products/:id', (req, res) => {
    const { id } = req.params;
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
    if (product) {
      res.json(product);
    } else {
      res.status(404).json({ error: 'Product not found' });
    }
  });

  app.post('/api/products', (req, res) => {
    const { category_id, name, description, price, price_unit, image_url } = req.body;
    const stmt = db.prepare('INSERT INTO products (category_id, name, description, price, price_unit, image_url) VALUES (?, ?, ?, ?, ?, ?)');
    const info = stmt.run(category_id, name, description, price, price_unit, image_url);
    res.json({ id: info.lastInsertRowid });
  });

  app.put('/api/products/:id', (req, res) => {
    const { id } = req.params;
    const { category_id, name, description, price, price_unit, image_url } = req.body;
    const stmt = db.prepare('UPDATE products SET category_id = ?, name = ?, description = ?, price = ?, price_unit = ?, image_url = ? WHERE id = ?');
    stmt.run(category_id, name, description, price, price_unit, image_url, id);
    res.json({ success: true });
  });

  app.delete('/api/products/:id', (req, res) => {
    const { id } = req.params;
    const stmt = db.prepare('DELETE FROM products WHERE id = ?');
    stmt.run(id);
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

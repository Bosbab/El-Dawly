require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'eldawly-luxury-footwear-secret-key-2026';
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'AL DAWLY';
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH
  ? process.env.ADMIN_PASSWORD_HASH
  : bcrypt.hashSync(process.env.ADMIN_PASSWORD || '143500', 10);

const DATA_DIR = path.join(__dirname, 'data');
const PRODUCTS_FILE = path.join(DATA_DIR, 'products.json');

// ------------------------------------------------------------------
// Supabase client for persistent product storage.
// On Vercel the filesystem is read-only/ephemeral, so products must be
// stored in an external database that all serverless instances share.
// ------------------------------------------------------------------
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://djhtwpckoeiscjcstupo.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRqaHR3cGNrb2Vpc2NqY3N0dXBvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYyMDQ5NjEsImV4cCI6MjEwMTc4MDk2MX0.tFucp7xIrMysokxJ_yt7XGzV8BzWczyOMuSu4j_bGIs';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'client')));

try {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
} catch (err) {
  // Vercel serverless filesystem is read-only; products live in Supabase.
  console.warn('Could not create data dir:', err.message);
}

const DEFAULT_PRODUCTS = [
  {
    id: 1,
    name: 'Heritage Oxford Classic',
    category: 'Formal',
    price: 3499,
    description: 'Hand-stitched premium leather Oxford shoes. Crafted from full-grain Italian leather with a leather sole and Goodyear welt construction. A timeless design for distinguished gentlemen.',
    stock: 12,
    sizes: ['39', '40', '41', '42', '43', '44', '45'],
    image: null,
    emoji: '👞',
    createdAt: new Date().toISOString()
  },
  {
    id: 2,
    name: 'Velvet Sovereign Loafers',
    category: 'Formal',
    price: 2899,
    description: 'Luxurious velvet loafers with gold-tone horsebit detail. Plush velvet upper, leather lining, and cushioned insole for unmatched comfort at galas and special events.',
    stock: 8,
    sizes: ['39', '40', '41', '42', '43', '44'],
    image: null,
    emoji: '👞',
    createdAt: new Date().toISOString()
  },
  {
    id: 3,
    name: 'Apex Predator Running Elite',
    category: 'Running',
    price: 2199,
    description: 'Carbon-plate performance running shoes engineered for champions. Responsive foam midsole, breathable engineered mesh, and aggressive rubber outsole for race-day performance.',
    stock: 18,
    sizes: ['38', '39', '40', '41', '42', '43', '44', '45'],
    image: null,
    emoji: '👟',
    createdAt: new Date().toISOString()
  },
  {
    id: 4,
    name: 'Midnight Gold Street Sneakers',
    category: 'Sneakers',
    price: 2599,
    description: 'Limited edition street sneakers featuring genuine leather panels with 24k gold accent stitching. Premium EVA cushioning for all-day urban comfort with head-turning style.',
    stock: 15,
    sizes: ['38', '39', '40', '41', '42', '43', '44', '45'],
    image: null,
    emoji: '👟',
    createdAt: new Date().toISOString()
  },
  {
    id: 5,
    name: 'Summit Conqueror Hiking Boots',
    category: 'Boots',
    price: 4299,
    description: 'Expedition-grade waterproof hiking boots crafted from tough full-grain leather. Vibram outsole for unbeatable traction, reinforced ankle support, and breathable membrane.',
    stock: 6,
    sizes: ['40', '41', '42', '43', '44', '45', '46'],
    image: null,
    emoji: '🥾',
    createdAt: new Date().toISOString()
  },
  {
    id: 6,
    name: 'Royal Sandal Collection',
    category: 'Sandals',
    price: 799,
    description: 'Handcrafted leather sandals combining traditional craftsmanship with modern comfort. Plush padded footbed and non-slip rubber sole — perfect for warm-weather elegance.',
    stock: 25,
    sizes: ['36', '37', '38', '39', '40', '41', '42', '43'],
    image: null,
    emoji: '🩴',
    createdAt: new Date().toISOString()
  }
];

// Ensure data directory and files always exist so writes never fail
const ensureDataFile = (filePath, fallback = '[]') => {
  if (!fs.existsSync(filePath)) {
    try {
      fs.writeFileSync(filePath, JSON.stringify(fallback, null, 2));
    } catch (err) {
      console.error(`Could not create ${filePath}:`, err.message);
    }
  }
};

const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');
const MESSAGES_FILE = path.join(DATA_DIR, 'messages.json');
ensureDataFile(ORDERS_FILE, []);
ensureDataFile(MESSAGES_FILE, []);
ensureDataFile(PRODUCTS_FILE, DEFAULT_PRODUCTS);

function readProducts() {
  // Try Supabase first (persistent, works on Vercel).
  // Fall back to the local file only if Supabase is unavailable.
  return new Promise((resolve, reject) => {
    supabase
      .from('products')
      .select('*')
      .order('id', { ascending: true })
      .then(({ data, error }) => {
        if (error) {
          console.error('Supabase read error:', error.message);
          // Fall back to local file
          try {
            if (!fs.existsSync(PRODUCTS_FILE)) {
              fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(DEFAULT_PRODUCTS, null, 2));
              return resolve(DEFAULT_PRODUCTS);
            }
            const raw = fs.readFileSync(PRODUCTS_FILE, 'utf-8');
            return resolve(JSON.parse(raw));
          } catch (err) {
            console.error('Error reading products from file:', err);
            return resolve(DEFAULT_PRODUCTS);
          }
        }
        // Normalize Supabase rows (sizes stored as JSONB array)
        const products = (data || []).map(p => ({
          ...p,
          sizes: Array.isArray(p.sizes) ? p.sizes.map(String) :
                 (p.sizes && typeof p.sizes === 'object') ? Object.values(p.sizes).map(String) : []
        }));
        resolve(products);
      })
      .catch(err => {
        console.error('Supabase query error:', err.message);
        // Fall back to local file
        try {
          if (fs.existsSync(PRODUCTS_FILE)) {
            const raw = fs.readFileSync(PRODUCTS_FILE, 'utf-8');
            return resolve(JSON.parse(raw));
          }
        } catch (e) {}
        resolve(DEFAULT_PRODUCTS);
      });
  });
}

async function writeProducts(products) {
  // Persist to Supabase. We upsert the whole array.
  try {
    const rows = products.map(p => ({
      id: p.id,
      name: p.name,
      category: p.category,
      price: p.price,
      description: p.description,
      stock: p.stock,
      sizes: p.sizes || [],
      image: p.image || null,
      emoji: p.emoji || '👟',
      createdAt: p.createdAt || new Date().toISOString(),
      updatedAt: p.updatedAt || new Date().toISOString()
    }));

    const { error } = await supabase
      .from('products')
      .upsert(rows, { onConflict: 'id', ignoreDuplicates: false });

    if (error) {
      console.error('Supabase write error:', error.message);
      // Fall back to local file write (works in local dev)
      try {
        fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(products, null, 2));
        return true;
      } catch (e) {
        console.error('Local file fallback write failed:', e.message);
        return false;
      }
    }
    return true;
  } catch (err) {
    console.error('writeProducts error:', err.message);
    return false;
  }
}

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
}

app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const usernameValid = username === ADMIN_USERNAME;
    const passwordValid = await bcrypt.compare(password, ADMIN_PASSWORD_HASH);

    if (!usernameValid || !passwordValid) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const token = jwt.sign(
      { username, role: 'admin' },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      token,
      user: { username, role: 'admin' }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/auth/verify', authenticateToken, (req, res) => {
  res.json({ valid: true, user: req.user });
});

app.get('/api/products', async (req, res) => {
  try {
    const products = await readProducts();
    res.json(products);
  } catch (err) {
    console.error('Get products error:', err);
    res.status(500).json({ error: 'Failed to load products' });
  }
});

app.get('/api/products/:id', async (req, res) => {
  try {
    const products = await readProducts();
    const product = products.find(p => p.id === parseInt(req.params.id));
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    res.json(product);
  } catch (err) {
    console.error('Get product error:', err);
    res.status(500).json({ error: 'Failed to load product' });
  }
});

app.post('/api/products', authenticateToken, async (req, res) => {
  try {
    const { name, category, price, description, stock, sizes, image, emoji } = req.body;

    if (!name || !category || price == null || stock == null || !description || !sizes || sizes.length === 0) {
      return res.status(400).json({ error: 'All required fields must be filled' });
    }

    const products = await readProducts();
    const newId = products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1;

    const newProduct = {
      id: newId,
      name: String(name).trim(),
      category: String(category),
      price: parseFloat(price),
      stock: parseInt(stock),
      description: String(description).trim(),
      sizes: Array.isArray(sizes) ? sizes.map(String) : [],
      image: image || null,
      emoji: emoji || '👟',
      createdAt: new Date().toISOString()
    };

    products.push(newProduct);
    
    if (await writeProducts(products)) {
      res.status(201).json({ success: true, product: newProduct });
    } else {
      res.status(500).json({ error: 'Failed to save product' });
    }
  } catch (err) {
    console.error('Create product error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/products/:id', authenticateToken, async (req, res) => {
  try {
    const productId = parseInt(req.params.id);
    const { name, category, price, description, stock, sizes, image, emoji } = req.body;

    const products = await readProducts();
    const index = products.findIndex(p => p.id === productId);

    if (index === -1) {
      return res.status(404).json({ error: 'Product not found' });
    }

    if (name !== undefined) products[index].name = String(name).trim();
    if (category !== undefined) products[index].category = String(category);
    if (price !== undefined) products[index].price = parseFloat(price);
    if (stock !== undefined) products[index].stock = parseInt(stock);
    if (description !== undefined) products[index].description = String(description).trim();
    if (sizes !== undefined) products[index].sizes = Array.isArray(sizes) ? sizes.map(String) : products[index].sizes;
    if (image !== undefined) products[index].image = image;
    if (emoji !== undefined) products[index].emoji = emoji;
    products[index].updatedAt = new Date().toISOString();

    if (await writeProducts(products)) {
      res.json({ success: true, product: products[index] });
    } else {
      res.status(500).json({ error: 'Failed to update product. The database could not be written. Please try again.' });
    }
  } catch (err) {
    console.error('Update product error:', err);
    res.status(500).json({ error: 'Update failed: ' + (err.message || 'Internal server error') });
  }
});

app.delete('/api/products/:id', authenticateToken, async (req, res) => {
  try {
    const productId = parseInt(req.params.id);
    const products = await readProducts();
    const filtered = products.filter(p => p.id !== productId);

    if (filtered.length === products.length) {
      return res.status(404).json({ error: 'Product not found' });
    }

    if (await writeProducts(filtered)) {
      res.json({ success: true, message: 'Product deleted successfully' });
    } else {
      res.status(500).json({ error: 'Failed to delete product' });
    }
  } catch (err) {
    console.error('Delete product error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/contact', (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;
    
    if (!name || !email || !subject || !message) {
      return res.status(400).json({ error: 'Please fill in all required fields' });
    }

    let messages = [];
    if (fs.existsSync(MESSAGES_FILE)) {
      messages = JSON.parse(fs.readFileSync(MESSAGES_FILE, 'utf-8'));
    }
    messages.push({
      id: Date.now(),
      name,
      email,
      phone: phone || '',
      subject,
      message,
      submittedAt: new Date().toISOString()
    });
    fs.writeFileSync(MESSAGES_FILE, JSON.stringify(messages, null, 2));

    res.json({ success: true, message: 'Thank you for contacting us. We will get back to you shortly!' });
  } catch (err) {
    console.error('Contact form error:', err);
    res.status(500).json({ error: 'Failed to send message. Please try again.' });
  }
});

app.post('/api/orders', (req, res) => {
  try {
    const orderData = req.body;
    
    if (!orderData || !orderData.items || orderData.items.length === 0) {
      return res.status(400).json({ error: 'Cart cannot be empty' });
    }

    const { shipping, paymentMethod } = orderData;
    if (!shipping || !shipping.name || !shipping.phone || !shipping.governorate || !shipping.city || !shipping.address) {
      return res.status(400).json({ error: 'Please fill in all required shipping fields' });
    }

    if (shipping.governorate !== 'Suez') {
      return res.status(400).json({ error: 'We currently deliver only within Suez governorate' });
    }

    if (paymentMethod !== 'cod') {
      return res.status(400).json({ error: 'Only Cash on Delivery is currently accepted' });
    }

    let orders = [];
    if (fs.existsSync(ORDERS_FILE)) {
      try {
        orders = JSON.parse(fs.readFileSync(ORDERS_FILE, 'utf-8'));
      } catch (e) {
        orders = [];
      }
    }

    const order = {
      ...orderData,
      id: Date.now(),
      savedAt: new Date().toISOString()
    };

    orders.push(order);
    fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2));

    res.status(201).json({ 
      success: true, 
      message: 'Order placed successfully',
      orderNumber: order.orderNumber
    });
  } catch (err) {
    console.error('Order creation error:', err);
    res.status(500).json({ error: 'Failed to place order. Please try again.' });
  }
});

app.get('/api/orders', authenticateToken, (req, res) => {
  try {
    if (!fs.existsSync(ORDERS_FILE)) {
      return res.json([]);
    }
    const orders = JSON.parse(fs.readFileSync(ORDERS_FILE, 'utf-8'));
    orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json(orders);
  } catch (err) {
    console.error('Get orders error:', err);
    res.status(500).json({ error: 'Failed to load orders' });
  }
});

// JSON 404 for any unknown /api/* request (so API calls never fall through to the SPA)
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

// SPA catch-all: only serve index.html for non-API GET requests
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client', 'index.html'));
});

async function seedSupabaseIfEmpty() {
  // Seed Supabase with default products if the table is empty.
  // This ensures the store always has data on a fresh database.
  try {
    const { count, error } = await supabase
      .from('products')
      .select('id', { count: 'exact', head: true });
    if (!error && count === 0) {
      console.log('Seeding Supabase products table with defaults...');
      await writeProducts(DEFAULT_PRODUCTS);
      console.log('Supabase seeded successfully.');
    } else if (error) {
      console.warn('Supabase seed check failed:', error.message);
    }
  } catch (e) {
    console.warn('Supabase seed error:', e.message);
  }
}

// Export for Vercel serverless. Only bind a port in local/dev.
module.exports = app;

if (!process.env.VERCEL) {
  app.listen(PORT, async () => {
    console.log('╔═══════════════════════════════════════════════════════╗');
    console.log('║           ✨  EL DAWLY LUXURY SHOES  ✨               ║');
    console.log('╠═══════════════════════════════════════════════════════╣');
    console.log(`║  🖥️  Server running: http://localhost:${PORT}            ║`);
    console.log(`║  📦  Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log('║  🔐  Admin login configured via env                    ║');
    console.log('║                                                       ║');
    console.log('╚═══════════════════════════════════════════════════════╝');
    await seedSupabaseIfEmpty();
  });
} else {
  // Fire-and-forget seed on cold start in serverless.
  seedSupabaseIfEmpty();
}
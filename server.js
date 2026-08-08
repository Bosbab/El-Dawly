require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'eldawly-luxury-footwear-secret-key-2026';
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH
  ? process.env.ADMIN_PASSWORD_HASH
  : bcrypt.hashSync(process.env.ADMIN_PASSWORD || 'admin123', 10);

const DATA_DIR = path.join(__dirname, 'data');
const PRODUCTS_FILE = path.join(DATA_DIR, 'products.json');

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'client')));

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
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
  try {
    if (!fs.existsSync(PRODUCTS_FILE)) {
      fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(DEFAULT_PRODUCTS, null, 2));
      return DEFAULT_PRODUCTS;
    }
    const data = fs.readFileSync(PRODUCTS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading products:', err);
    return DEFAULT_PRODUCTS;
  }
}

function writeProducts(products) {
  const json = JSON.stringify(products, null, 2);
  const tmpFile = PRODUCTS_FILE + '.tmp';
  const attempts = [1, 2, 3];
  for (const n of attempts) {
    try {
      // Atomic write: write to a temp file then rename over the target.
      // This avoids corrupting the file on OneDrive / synced folders and
      // prevents partial writes from leaving the JSON broken.
      fs.writeFileSync(tmpFile, json, 'utf-8');
      fs.renameSync(tmpFile, PRODUCTS_FILE);
      return true;
    } catch (err) {
      console.error(`Error writing products (attempt ${n}):`, err.message);
      // Small delay before retrying (OneDrive/indexing locks can be transient).
      if (n < attempts.length) {
        const until = Date.now() + 120;
        while (Date.now() < until) {}
      }
    }
  }
  return false;
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

app.get('/api/products', (req, res) => {
  try {
    const products = readProducts();
    res.json(products);
  } catch (err) {
    console.error('Get products error:', err);
    res.status(500).json({ error: 'Failed to load products' });
  }
});

app.get('/api/products/:id', (req, res) => {
  try {
    const products = readProducts();
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

app.post('/api/products', authenticateToken, (req, res) => {
  try {
    const { name, category, price, description, stock, sizes, image, emoji } = req.body;

    if (!name || !category || price == null || stock == null || !description || !sizes || sizes.length === 0) {
      return res.status(400).json({ error: 'All required fields must be filled' });
    }

    const products = readProducts();
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
    
    if (writeProducts(products)) {
      res.status(201).json({ success: true, product: newProduct });
    } else {
      res.status(500).json({ error: 'Failed to save product' });
    }
  } catch (err) {
    console.error('Create product error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/products/:id', authenticateToken, (req, res) => {
  try {
    const productId = parseInt(req.params.id);
    const { name, category, price, description, stock, sizes, image, emoji } = req.body;

    const products = readProducts();
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

    if (writeProducts(products)) {
      res.json({ success: true, product: products[index] });
    } else {
      res.status(500).json({ error: 'Failed to update product. The data file could not be written (possibly locked by OneDrive). Please try again.' });
    }
  } catch (err) {
    console.error('Update product error:', err);
    res.status(500).json({ error: 'Update failed: ' + (err.message || 'Internal server error') });
  }
});

app.delete('/api/products/:id', authenticateToken, (req, res) => {
  try {
    const productId = parseInt(req.params.id);
    const products = readProducts();
    const filtered = products.filter(p => p.id !== productId);

    if (filtered.length === products.length) {
      return res.status(404).json({ error: 'Product not found' });
    }

    if (writeProducts(filtered)) {
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

app.listen(PORT, () => {
  console.log('╔═══════════════════════════════════════════════════════╗');
  console.log('║           ✨  EL DAWLY LUXURY SHOES  ✨               ║');
  console.log('╠═══════════════════════════════════════════════════════╣');
  console.log(`║  🖥️  Server running: http://localhost:${PORT}            ║`);
  console.log(`║  📦  Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('║  🔐  Admin Username: admin                            ║');
  console.log('║  🔐  Admin Password: admin123                         ║');
  console.log('╚═══════════════════════════════════════════════════════╝');
});

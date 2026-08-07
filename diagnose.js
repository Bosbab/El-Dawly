// Diagnostic script that writes results to a file
const fs = require('fs');
const path = require('path');
const output = [];
const log = (...args) => output.push(args.join(' '));

// 1. Check server.js has the routes
const serverCode = fs.readFileSync(path.join(__dirname, 'server.js'), 'utf-8');
log('POST /api/orders route defined:', serverCode.includes("app.post('/api/orders'"));
log('GET /api/products route defined:', serverCode.includes("app.get('/api/products'"));
log('POST /api/contact route defined:', serverCode.includes("app.post('/api/contact'"));
log('Catch-all GET * defined:', serverCode.includes("app.get('*'"));

// 2. Check data files
const dataDir = path.join(__dirname, 'data');
log('data/ directory exists:', fs.existsSync(dataDir));
if (fs.existsSync(dataDir)) {
  log('  products.json:', fs.existsSync(path.join(dataDir, 'products.json')));
  log('  orders.json:', fs.existsSync(path.join(dataDir, 'orders.json')));
  log('  messages.json:', fs.existsSync(path.join(dataDir, 'messages.json')));
}

// 3. Parse products.json
try {
  if (fs.existsSync(path.join(dataDir, 'products.json'))) {
    const products = JSON.parse(fs.readFileSync(path.join(dataDir, 'products.json'), 'utf-8'));
    log('products.json valid, count:', Array.isArray(products) ? products.length : 'NOT ARRAY');
  }
} catch (e) {
  log('products.json parse ERROR:', e.message);
}

// 4. Check client files
log('client/index.html exists:', fs.existsSync(path.join(__dirname, 'client', 'index.html')));
log('client/script.js exists:', fs.existsSync(path.join(__dirname, 'client', 'script.js')));
log('client/styles.css exists:', fs.existsSync(path.join(__dirname, 'client', 'styles.css')));

// 5. Verify script.js posts to correct endpoint
const scriptCode = fs.readFileSync(path.join(__dirname, 'client', 'script.js'), 'utf-8');
log('script.js API_BASE =', (scriptCode.match(/const API_BASE = '([^']+)'/) || [])[1]);
log("script.js posts to /orders:", scriptCode.includes("apiRequest('/orders'"));

// 6. Check node_modules
log('node_modules exists:', fs.existsSync(path.join(__dirname, 'node_modules')));
if (fs.existsSync(path.join(__dirname, 'node_modules'))) {
  log('  express:', fs.existsSync(path.join(__dirname, 'node_modules', 'express')));
  log('  bcryptjs:', fs.existsSync(path.join(__dirname, 'node_modules', 'bcryptjs')));
  log('  cors:', fs.existsSync(path.join(__dirname, 'node_modules', 'cors')));
  log('  dotenv:', fs.existsSync(path.join(__dirname, 'node_modules', 'dotenv')));
  log('  jsonwebtoken:', fs.existsSync(path.join(__dirname, 'node_modules', 'jsonwebtoken')));
} else {
  log('node_modules MISSING - need to npm install!');
}

fs.writeFileSync(path.join(__dirname, 'diagnose-output.txt'), output.join('\n'));
console.log('done');

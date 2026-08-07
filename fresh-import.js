const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const IMPORT_DIR = path.join(__dirname, 'import-shoes');
const IMAGES_DIR = path.join(__dirname, 'client', 'images');
const DATA_DIR = path.join(__dirname, 'data');
const PRODUCTS_FILE = path.join(DATA_DIR, 'products.json');

const VALID_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];
const DEFAULT_SIZES = ['38', '39', '40', '41', '42', '43', '44'];
const DEFAULT_STOCK = 10;
const DEFAULT_PRICE = 9999;
const DEFAULT_CATEGORY = 'Casual';

function ensureFolders() {
  [IMPORT_DIR, IMAGES_DIR, DATA_DIR].forEach(d => {
    if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
  });
}

function fileHash(filePath) {
  try {
    return crypto.createHash('md5').update(fs.readFileSync(filePath)).digest('hex');
  } catch (e) { return null; }
}

ensureFolders();

const rawFiles = fs.readdirSync(IMPORT_DIR)
  .filter(f => VALID_EXTENSIONS.includes(path.extname(f).toLowerCase()))
  .sort();

console.log('\n╔═════════════════════════════════════════════════════════════╗');
console.log('║   🔄 FRESH RE-IMPORT FROM ORIGINAL 50 PHOTOS (CLEAN!)      ║');
console.log('╚═════════════════════════════════════════════════════════════╝\n');
console.log(`📸 Reading ${rawFiles.length} ORIGINAL photos from import-shoes/ folder\n`);

console.log('🧹 Step 1: Cleaning client/images/ folder (delete ALL old copies)...');
const oldImages = fs.readdirSync(IMAGES_DIR);
for (const f of oldImages) {
  try { fs.unlinkSync(path.join(IMAGES_DIR, f)); } catch (e) {}
}
console.log(`   ✅ Deleted ${oldImages.length} old image copies from client/images/\n`);

console.log('🧹 Step 2: Wiping products.json database to start fresh...');
const products = [];
console.log('   ✅ Database cleared\n');

console.log(`📥 Step 3: Copying ${rawFiles.length} original photos & creating product records...\n`);
console.log('─'.repeat(65));

const seen = new Map();
for (let i = 0; i < rawFiles.length; i++) {
  const origFile = rawFiles[i];
  const src = path.join(IMPORT_DIR, origFile);
  const hash = fileHash(src);
  
  if (seen.has(hash)) {
    console.log(`⚠️  [${String(i+1).padStart(2,'0')}/${rawFiles.length}] SKIP DUPLICATE: ${origFile}`);
    continue;
  }
  seen.set(hash, true);
  
  const num = String(products.length + 1).padStart(2, '0');
  const ext = path.extname(origFile);
  const newFilename = `shoe-${num}-${Date.now()}-${Math.round(Math.random()*9999)}${ext}`;
  const dest = path.join(IMAGES_DIR, newFilename);
  
  fs.copyFileSync(src, dest);
  
  products.push({
    id: products.length + 1,
    name: `Shoe ${num} - Premium Collection`,
    category: DEFAULT_CATEGORY,
    price: DEFAULT_PRICE,
    description: `Premium ${DEFAULT_CATEGORY.toLowerCase()} footwear from EL Dawly Collection. Elegant design with superior comfort. PLEASE EDIT: Update the name, price, description, category, sizes and stock for this shoe via the Admin Panel!`,
    stock: DEFAULT_STOCK,
    sizes: [...DEFAULT_SIZES],
    image: `/images/${newFilename}`,
    emoji: '👟',
    createdAt: new Date().toISOString()
  });
  
  console.log(`✅ [${num}/${rawFiles.length}] Shoe ${num} - photo: ${newFilename}`);
}

fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(products, null, 2));

console.log('\n' + '─'.repeat(65));
console.log('                         🎉 100% CLEAN IMPORT COMPLETE!');
console.log('─'.repeat(65));
console.log(`  📦 TOTAL PRODUCTS NOW: ${products.length} (Shoe 01 → Shoe ${String(products.length).padStart(2,'0')})`);
console.log(`  🖼️  IMAGES IN /images : ${fs.readdirSync(IMAGES_DIR).length} (NO DUPLICATES!)`);
console.log(`  💰 DEFAULT PRICE      : EGP 9,999 ⚠️  EDIT THESE IN ADMIN PANEL!`);
console.log('─'.repeat(65));
console.log('\n✅ ALL SET! NOW DO THIS:');
console.log('');
console.log('  1️⃣   RUN THE WEBSITE (in your ELDawly folder):');
console.log('      npm start');
console.log('');
console.log('  2️⃣   OPEN IN BROWSER:');
console.log('      http://localhost:3000');
console.log('');
console.log('  3️⃣   GO TO ADMIN PANEL TO EDIT EVERYTHING:');
console.log('      Click ADMIN button → Login:');
console.log('         Username: admin');
console.log('         Password: admin123');
console.log('');
console.log('  💡 In Admin Dashboard → For EACH SHOE click ✏️ Edit:');
console.log('     • Change "Shoe 01" → real descriptive name');
console.log('     • Change EGP 9,999 → your actual EGP selling price');
console.log('     • Change Category → Formal/Sneakers/Boots/Running/etc.');
console.log('     • Change Stock → actual quantity');
console.log('     • Uncheck sizes you do NOT physically have in stock');
console.log('     • Rewrite Description → materials, colors, comfort notes, etc.');
console.log('');
console.log('  👀 Customers see ALL edits INSTANTLY! 🚀');
console.log('─'.repeat(65) + '\n');

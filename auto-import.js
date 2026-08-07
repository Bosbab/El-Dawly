const fs = require('fs');
const path = require('path');

const IMPORT_DIR = path.join(__dirname, 'import-shoes');
const IMAGES_DIR = path.join(__dirname, 'client', 'images');
const DATA_DIR = path.join(__dirname, 'data');
const PRODUCTS_FILE = path.join(DATA_DIR, 'products.json');

const VALID_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];
const DEFAULT_SIZES = ['38', '39', '40', '41', '42', '43', '44'];
const DEFAULT_STOCK = 10;
const DEFAULT_PRICE = 9999;
const DEFAULT_CATEGORY = 'Casual';
const DEFAULT_EMOJI = '👟';

function ensureFolders() {
    if (!fs.existsSync(IMPORT_DIR)) fs.mkdirSync(IMPORT_DIR, { recursive: true });
    if (!fs.existsSync(IMAGES_DIR)) fs.mkdirSync(IMAGES_DIR, { recursive: true });
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function loadProducts() {
    if (!fs.existsSync(PRODUCTS_FILE)) return [];
    try {
        return JSON.parse(fs.readFileSync(PRODUCTS_FILE, 'utf-8'));
    } catch (e) {
        console.error('❌ Error reading products:', e.message);
        return [];
    }
}

function saveProducts(products) {
    fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(products, null, 2));
}

function formatPrice(price) {
    return 'EGP ' + price.toLocaleString('en-US', { minimumFractionDigits: 0 });
}

async function main() {
    console.log('\n╔═══════════════════════════════════════════════════════════════╗');
    console.log('║   ✨  EL DAWLY - AUTO IMPORT (No Renaming Needed!) ✨         ║');
    console.log('╚═══════════════════════════════════════════════════════════════╝\n');

    ensureFolders();

    const rawFiles = fs.readdirSync(IMPORT_DIR);
    const files = rawFiles.filter(f => VALID_EXTENSIONS.includes(path.extname(f).toLowerCase()));

    if (files.length === 0) {
        console.log('❌ No images found! Put your shoe photos in "import-shoes" folder first.\n');
        process.exit(0);
    }

    console.log(`📸 Found ${files.length} photos. Processing them all...\n`);
    console.log('─'.repeat(75));

    const products = loadProducts();
    let nextId = products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1;

    let added = 0;
    let failed = 0;

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const ext = path.extname(file);
        const shoeNum = String(i + 1).padStart(2, '0');
        const shoeName = `Shoe ${shoeNum} - Premium Collection`;

        const safeName = `shoe-${shoeNum}-${Date.now()}-${Math.round(Math.random() * 9999)}`;
        const newFilename = `${safeName}${ext}`;
        const srcPath = path.join(IMPORT_DIR, file);
        const destPath = path.join(IMAGES_DIR, newFilename);

        try {
            fs.copyFileSync(srcPath, destPath);
        } catch (e) {
            console.log(`❌ FAILED [${shoeNum}/${files.length}]: ${file} → ${e.message}`);
            failed++;
            continue;
        }

        const imageUrl = `/images/${newFilename}`;
        const category = DEFAULT_CATEGORY;
        const price = DEFAULT_PRICE;
        const emoji = DEFAULT_EMOJI;

        products.push({
            id: nextId++,
            name: shoeName,
            category: category,
            price: price,
            description: `Elegant ${category.toLowerCase()} footwear from the EL Dawly Premium Collection. Crafted with attention to detail for lasting comfort and refined style. NOTE: Update this description and price via Admin Panel!`,
            stock: DEFAULT_STOCK,
            sizes: [...DEFAULT_SIZES],
            image: imageUrl,
            emoji: emoji,
            createdAt: new Date().toISOString()
        });

        console.log(`✅ [${shoeNum}/${files.length}] ADDED: "${shoeName}"`);
        console.log(`      Price    : ${formatPrice(price)} ⚠️ (CHANGE ME IN ADMIN!)`);
        console.log(`      Category : ${category} (change in Admin if needed)`);
        console.log(`      Photo    : ${newFilename}`);
        added++;
    }

    saveProducts(products);

    console.log('─'.repeat(75));
    console.log('\n                          📊 IMPORT COMPLETE!');
    console.log('─'.repeat(75));
    console.log(`  ✅ NEW SHOES ADDED     : ${added}`);
    console.log(`  ❌ FAILED              : ${failed}`);
    console.log(`  📦 TOTAL IN DATABASE   : ${products.length}`);
    console.log('─'.repeat(75));
    console.log('\n🎉 ALL DONE! Now do these 2 steps:');
    console.log('\n  1️⃣   START THE WEBSITE:');
    console.log('      npm start\n');
    console.log('  2️⃣   EDIT PRICES & NAMES (in Admin Panel):');
    console.log('      http://localhost:3000 → click ADMIN → login:');
    console.log('         Username: admin');
    console.log('         Password: admin123\n');
    console.log('  💡 In Admin Dashboard, for EACH SHOE click ✏️ (Edit):');
    console.log('     • Change PRICE to your actual EGP price');
    console.log('     • Change NAME to a nice name (e.g. "Black Oxford Model 1")');
    console.log('     • Change CATEGORY (Formal, Running, Boots, Sandals, etc.)');
    console.log('     • Set real STOCK count');
    console.log('     • Check only the SIZES you actually have in stock\n');
    console.log('  👀 All customers see the changes instantly!');
    console.log('─'.repeat(75) + '\n');
}

main().catch(e => {
    console.error('\n❌ FATAL ERROR:', e.message);
    console.error(e.stack);
    process.exit(1);
});

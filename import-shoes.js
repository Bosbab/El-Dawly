const fs = require('fs');
const path = require('path');

const IMPORT_DIR = path.join(__dirname, 'import-shoes');
const IMAGES_DIR = path.join(__dirname, 'client', 'images');
const DATA_DIR = path.join(__dirname, 'data');
const PRODUCTS_FILE = path.join(DATA_DIR, 'products.json');

const VALID_CATEGORIES = ['Running', 'Casual', 'Formal', 'Sports', 'Sneakers', 'Boots', 'Sandals'];
const VALID_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];
const DEFAULT_SIZES = ['38', '39', '40', '41', '42', '43', '44'];
const DEFAULT_STOCK = 10;

function getEmojiForCategory(category) {
    const map = {
        'Running': '👟',
        'Casual': '👟',
        'Formal': '👞',
        'Sports': '👟',
        'Sneakers': '👟',
        'Boots': '🥾',
        'Sandals': '🩴'
    };
    return map[category] || '👟';
}

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
        console.error('❌ Error reading products database:', e.message);
        return [];
    }
}

function saveProducts(products) {
    fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(products, null, 2));
}

function sanitizeFilename(name) {
    return name.toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
}

function parseFilename(filename) {
    const ext = path.extname(filename);
    const base = path.basename(filename, ext);

    const formats = [
        { regex: /^(.+?)_(\d+(?:\.\d{1,2})?)_?(.+)?$/, sep: 'underscore' },
        { regex: /^(.+?)\s*-\s*(\d+(?:\.\d{1,2})?)\s*-?\s*(.+)?$/, sep: 'dash' },
        { regex: /^(.+?)\s*\(\s*(\d+(?:\.\d{1,2})?)\s*EGP?\s*\)\s*(.+)?$/i, sep: 'parentheses' },
        { regex: /^(.+?)\s*(\d+(?:\.\d{1,2})?)\s*EGP?\s*(.+)?$/i, sep: 'suffix' }
    ];

    for (const fmt of formats) {
        const match = base.match(fmt.regex);
        if (match) {
            let name = match[1].trim();
            const price = parseFloat(match[2]);
            let category = match[3] ? match[3].trim() : null;

            if (category) {
                const catMatch = VALID_CATEGORIES.find(c =>
                    category.toLowerCase() === c.toLowerCase() ||
                    category.toLowerCase().includes(c.toLowerCase())
                );
                if (catMatch) category = catMatch;
            }

            if (!category) category = 'Casual';

            if (!VALID_CATEGORIES.includes(category)) {
                category = 'Casual';
            }

            if (name && !isNaN(price) && price > 0) {
                name = name.replace(/[_-]/g, ' ')
                    .replace(/\s+/g, ' ')
                    .trim()
                    .replace(/\b\w/g, c => c.toUpperCase());

                return { name, price, category, valid: true };
            }
        }
    }

    return { name: base, price: null, category: 'Casual', valid: false };
}

function formatPrice(price) {
    return 'EGP ' + price.toLocaleString('en-US', { minimumFractionDigits: 0 });
}

async function main() {
    console.log('\n╔══════════════════════════════════════════════════════════╗');
    console.log('║         ✨  EL DAWLY - AUTO SHOE IMPORTER  ✨            ║');
    console.log('╚══════════════════════════════════════════════════════════╝\n');

    ensureFolders();

    const files = fs.readdirSync(IMPORT_DIR)
        .filter(f => VALID_EXTENSIONS.includes(path.extname(f).toLowerCase()));

    if (files.length === 0) {
        console.log('⚠️  No shoe photos found in "import-shoes" folder!');
        console.log('\n📋 Instructions:');
        console.log('   1. Copy your shoe photos into: ' + IMPORT_DIR);
        console.log('   2. Rename each photo using this format:');
        console.log('\n      ✅ CORRECT NAMING EXAMPLES:');
        console.log('         ┌───────────────────────────────────────────────────────┐');
        console.log('         │  ShoeName_PRICE_CATEGORY.jpg     (RECOMMENDED)        │');
        console.log('         │  ═══════════════════════════════════════════════       │');
        console.log('         │  Black Leather Oxford_1899_Formal.jpg                 │');
        console.log('         │  White Running Pro_1299_Running.jpg                   │');
        console.log('         │  Gold Summer Sandals_599_Sandals.jpg                  │');
        console.log('         │  Hiking Boots Rugged_3299_Boots.jpg                   │');
        console.log('         │  Urban Street Sneakers_1599_Sneakers.jpg              │');
        console.log('         │  Basketball Pro High_2899_Sports.jpg                  │');
        console.log('         └───────────────────────────────────────────────────────┘');
        console.log('\n   3. Categories available: ' + VALID_CATEGORIES.join(' | '));
        console.log('   4. Run the script again: node import-shoes.js\n');
        process.exit(0);
    }

    console.log(`📸 Found ${files.length} shoe photo(s) in import folder. Processing...\n`);
    console.log('─'.repeat(70));

    const products = loadProducts();
    let nextId = products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1;

    let added = 0;
    let updated = 0;
    let skipped = 0;
    const results = [];

    for (const file of files) {
        const ext = path.extname(file);
        const parsed = parseFilename(file);

        if (!parsed.valid) {
            console.log(`❌ SKIPPED: ${file}`);
            console.log(`      ⚠️  Could not read PRICE from filename.`);
            console.log(`      Expected format: "ShoeName_PRICE_CATEGORY.jpg"`);
            console.log(`      Example: "Black Oxford_1899_Formal.jpg"\n`);
            skipped++;
            results.push({ file, status: 'skipped', reason: 'Invalid filename format' });
            continue;
        }

        const safeName = sanitizeFilename(parsed.name);
        const newFilename = `${safeName}-${parsed.category.toLowerCase()}-${Date.now()}${ext}`;
        const srcPath = path.join(IMPORT_DIR, file);
        const destPath = path.join(IMAGES_DIR, newFilename);

        try {
            fs.copyFileSync(srcPath, destPath);
        } catch (e) {
            console.log(`❌ FAILED to copy: ${file} → ${e.message}\n`);
            skipped++;
            results.push({ file, status: 'error', reason: e.message });
            continue;
        }

        const imageUrl = `/images/${newFilename}`;
        const existingIndex = products.findIndex(p =>
            p.name.toLowerCase() === parsed.name.toLowerCase()
        );

        if (existingIndex !== -1) {
            products[existingIndex] = {
                ...products[existingIndex],
                name: parsed.name,
                price: parsed.price,
                category: parsed.category,
                image: imageUrl,
                emoji: getEmojiForCategory(parsed.category),
                updatedAt: new Date().toISOString()
            };
            updated++;
            console.log(`🔄 UPDATED:  "${parsed.name}"`);
            console.log(`      Price   : ${formatPrice(parsed.price)}`);
            console.log(`      Category: ${parsed.category}`);
            console.log(`      Image   : ${newFilename}\n`);
            results.push({ file, name: parsed.name, status: 'updated', price: parsed.price, category: parsed.category });
        } else {
            products.push({
                id: nextId++,
                name: parsed.name,
                category: parsed.category,
                price: parsed.price,
                description: `Premium ${parsed.category.toLowerCase()} footwear — ${parsed.name}. Crafted with high-quality materials for lasting comfort and elegant style.`,
                stock: DEFAULT_STOCK,
                sizes: [...DEFAULT_SIZES],
                image: imageUrl,
                emoji: getEmojiForCategory(parsed.category),
                createdAt: new Date().toISOString()
            });
            added++;
            console.log(`✅ ADDED NEW: "${parsed.name}"`);
            console.log(`      Price   : ${formatPrice(parsed.price)}`);
            console.log(`      Category: ${parsed.category}`);
            console.log(`      Stock   : ${DEFAULT_STOCK} pcs (edit in Admin Panel)`);
            console.log(`      Sizes   : ${DEFAULT_SIZES.join(', ')} (edit in Admin Panel)`);
            console.log(`      Image   : ${newFilename}\n`);
            results.push({ file, name: parsed.name, status: 'added', price: parsed.price, category: parsed.category });
        }
    }

    productsCache = products;
    saveProducts(products);

    console.log('─'.repeat(70));
    console.log('\n📊 IMPORT SUMMARY:');
    console.log(`   ✅ Successfully Added  : ${added} shoe(s)`);
    console.log(`   🔄 Products Updated    : ${updated} shoe(s)`);
    console.log(`   ❌ Skipped / Errors    : ${skipped} file(s)`);
    console.log(`   📦 Total in Database   : ${products.length} shoe(s)\n`);

    if (added + updated > 0) {
        console.log('🎉 SUCCESS! Your shoes have been added to the website.');
        console.log('\n👀 To see your shoes live:');
        console.log('   1. Start the server: npm start');
        console.log('   2. Open: http://localhost:3000');
        console.log('   3. Click "Collection" in the navigation bar\n');
        console.log('💡 TIP: To adjust stock quantities, available sizes, descriptions,');
        console.log('       or upload more photos — use the ADMIN PANEL on the website!\n');
    }

    if (skipped > 0) {
        console.log('⚠️  Files skipped — fix filenames and re-run. Use this exact format:');
        console.log('   "NameOfShoe_PRICE_CATEGORY.jpg"');
        console.log('   Example: "Premium Leather Boots_3499_Boots.jpg"\n');
    }
}

main().catch(e => {
    console.error('\n❌ FATAL ERROR:', e.message);
    console.error(e.stack);
    process.exit(1);
});

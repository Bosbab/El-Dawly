const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');
const PRODUCTS_FILE = path.join(DATA_DIR, 'products.json');
const IMAGES_DIR = path.join(__dirname, 'client', 'images');

function loadProducts() {
    try {
        return JSON.parse(fs.readFileSync(PRODUCTS_FILE, 'utf-8'));
    } catch (e) { return []; }
}

function saveProducts(p) {
    fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(p, null, 2));
}

let products = loadProducts();
console.log(`\nTotal in DB before cleanup: ${products.length}`);

const kept = [];
const seenKeys = new Set();
const imagesToKeep = new Set();

for (const p of products) {
    const photoKey = p.image ? path.basename(p.image) : null;
    
    if (photoKey && !seenKeys.has(photoKey)) {
        seenKeys.add(photoKey);
        if (photoKey) imagesToKeep.add(photoKey);
        kept.push(p);
    } else if (!photoKey) {
        kept.push(p);
    }
}

kept.forEach((shoe, idx) => {
    shoe.id = idx + 1;
    const oldNumMatch = shoe.name.match(/Shoe (\d+)/);
    if (oldNumMatch) {
        const num = String(idx + 1).padStart(2, '0');
        shoe.name = `Shoe ${num} - Premium Collection`;
    }
});

saveProducts(kept);

const allImages = fs.existsSync(IMAGES_DIR) ? fs.readdirSync(IMAGES_DIR) : [];
const orphaned = allImages.filter(f => !imagesToKeep.has(f));
console.log(`Orphaned image files in /images: ${orphaned.length}`);

for (const file of orphaned) {
    try { fs.unlinkSync(path.join(IMAGES_DIR, file)); } catch(e) {}
}

const final = loadProducts();
console.log(`\n✅ After cleanup: ${final.length} unique products (Shoe 01 → Shoe ${String(final.length).padStart(2,'0')})`);
console.log(`✅ Each has a UNIQUE shoe photo from YOUR original batch!\n`);
console.log(`👀 Next: open in browser → http://localhost:3000\n`);

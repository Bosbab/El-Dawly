const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');
const PRODUCTS_FILE = path.join(DATA_DIR, 'products.json');

function loadProducts() {
    if (!fs.existsSync(PRODUCTS_FILE)) return [];
    try {
        return JSON.parse(fs.readFileSync(PRODUCTS_FILE, 'utf-8'));
    } catch (e) {
        return [];
    }
}

function saveProducts(products) {
    fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(products, null, 2));
}

const products = loadProducts();

const userShoes = products.filter(p => p.name.startsWith('Shoe ') && p.name.includes('Premium Collection'));
const demoShoes = products.filter(p => !(p.name.startsWith('Shoe ') && p.name.includes('Premium Collection')));

console.log('\n╔═══════════════════════════════════════════════════════════╗');
console.log('║         🧹  EL DAWLY - CLEAN UP DEMO PRODUCTS            ║');
console.log('╚═══════════════════════════════════════════════════════════╝\n');

console.log(`📦 Current total in database: ${products.length}`);
console.log(`👟 YOUR real imported shoes : ${userShoes.length}`);
console.log(`🎭 Demo/sample products     : ${demoShoes.length}\n`);

if (demoShoes.length === 0) {
    console.log('✅ Database already clean! Only your shoes remain.\n');
    process.exit(0);
}

console.log('Removing all demo products, keeping YOUR 50 shoes...\n');

const cleanedProducts = [...userShoes];
cleanedProducts.forEach((shoe, idx) => {
    shoe.id = idx + 1;
});

saveProducts(cleanedProducts);
const verify = loadProducts();

console.log('─'.repeat(60));
console.log('✅ CLEANUP COMPLETE!');
console.log('─'.repeat(60));
console.log(`📦 Products now in database : ${verify.length} (ALL YOUR SHOES!)`);
console.log(`👟 Shoes 01 → ${String(verify.length).padStart(2, '0')} are all imported from YOUR photos\n`);
console.log('💡 Now go to the Admin Panel to:');
console.log('   1. Change EGP 9,999 prices to your real prices');
console.log('   2. Edit "Shoe 01" names to descriptive names');
console.log('   3. Set correct categories (Formal/Sneakers/Boots/etc.)');
console.log('   4. Set actual stock & sizes for each');
console.log('─'.repeat(60) + '\n');

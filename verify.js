const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const results = [];

// 1. Node syntax check on server.js
try {
  execSync('node --check server.js', { cwd: __dirname });
  results.push('server.js: SYNTAX OK');
} catch (e) {
  results.push('server.js: SYNTAX ERROR - ' + e.message);
}

// 2. Check placeOrder function in script.js
const script = fs.readFileSync(path.join(__dirname, 'client', 'script.js'), 'utf-8');
results.push('script.js has placeOrder:', script.includes('async function placeOrder()'));
results.push('script.js has API error handling:', script.includes('Request failed with status'));
results.push('script.js redirects to thank-you:', script.includes("navigate('thank-you')"));

// 3. Check index.html has earth-map div
const html = fs.readFileSync(path.join(__dirname, 'client', 'index.html'), 'utf-8');
results.push('index.html has .earth-map:', html.includes('earth-map'));

// 4. Check styles.css references earth-map.svg
const css = fs.readFileSync(path.join(__dirname, 'client', 'styles.css'), 'utf-8');
results.push('styles.css references earth-map.svg times:', (css.match(/earth-map\.svg/g) || []).length);

// 5. earth-map.svg exists
results.push('earth-map.svg exists:', fs.existsSync(path.join(__dirname, 'client', 'images', 'earth-map.svg')));

// 6. Check data files were created
results.push('data dir exists:', fs.existsSync(path.join(__dirname, 'data')));
results.push('orders.json exists:', fs.existsSync(path.join(__dirname, 'data', 'orders.json')));
results.push('messages.json exists:', fs.existsSync(path.join(__dirname, 'data', 'messages.json')));

fs.writeFileSync(path.join(__dirname, 'verify-output.txt'), results.join('\n'));
console.log(results.join('\n'));

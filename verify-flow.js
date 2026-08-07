const fs = require('fs');
const results = [];
async function main() {
  try {
    const r = await fetch('http://localhost:3000/api/products');
    const d = await r.json();
    results.push('PRODUCTS status=' + r.status + ' count=' + d.length);
  } catch (e) { results.push('PRODUCTS ERR ' + e.message); }

  try {
    const o = await fetch('http://localhost:3000/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderNumber: 'ELD-VERIFY' + Date.now(),
        items: [{ name: 'Test', price: 100, quantity: 1, size: '41' }],
        subtotal: 100, shippingFee: 0, paymentFee: 0, total: 100,
        shipping: { name: 'T', phone: '01000000000', governorate: 'Suez', city: 'Suez', address: 'St', phone2: '', notes: '' },
        paymentMethod: 'cod', paymentMethodName: 'Cash on Delivery',
        status: 'pending_cod', createdAt: new Date().toISOString()
      })
    });
    const body = await o.text();
    results.push('ORDER status=' + o.status + ' body=' + body);
  } catch (e) { results.push('ORDER ERR ' + e.message); }

  fs.writeFileSync('flow-out.txt', results.join('\n'));
  process.exit(0);
}
main();

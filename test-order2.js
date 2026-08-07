const fs = require('fs');

async function main() {
  try {
    const o = await fetch('http://localhost:3000/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderNumber: 'ELD-T' + Date.now(),
        items: [{ name: 'Test', price: 100, quantity: 1, size: '41' }],
        subtotal: 100, shippingFee: 0, paymentFee: 0, total: 100,
        shipping: { name: 'T', phone: '01000000000', governorate: 'Suez', city: 'Suez', address: 'St' },
        paymentMethod: 'cod', paymentMethodName: 'Cash on Delivery', status: 'pending_cod',
        createdAt: new Date().toISOString()
      })
    });
    const body = await o.text();
    fs.writeFileSync('order-out.txt', 'STATUS: ' + o.status + '\nBODY: ' + body);
  } catch (e) {
    fs.writeFileSync('order-out.txt', 'ERR: ' + e.message);
  }
}
main();

const { exec } = require('child_process');

const server = exec('node server.js', { cwd: process.cwd() });
server.stdout.on('data', d => process.stdout.write('SRV: ' + d));
server.stderr.on('data', d => process.stderr.write('ERRSRV: ' + d));

setTimeout(async () => {
  try {
    const r = await fetch('http://localhost:3000/api/products');
    const d = await r.json();
    console.log('PRODUCTS COUNT:', d.length);

    const o = await fetch('http://localhost:3000/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderNumber: 'ELD-TEST123',
        items: [{ name: 'Test Shoe', price: 100, quantity: 1, size: '41' }],
        subtotal: 100,
        shippingFee: 0,
        paymentFee: 0,
        total: 100,
        shipping: { name: 'Test', phone: '01000000000', governorate: 'Suez', city: 'Suez', address: 'Test St', phone2: '', notes: '' },
        paymentMethod: 'cod',
        paymentMethodName: 'Cash on Delivery',
        status: 'pending_cod',
        createdAt: new Date().toISOString()
      })
    });
    const body = await o.text();
    console.log('ORDER STATUS:', o.status);
    console.log('ORDER BODY:', body);
  } catch (e) {
    console.error('FETCH ERR:', e.message);
  }
  server.kill();
  process.exit(0);
}, 3000);

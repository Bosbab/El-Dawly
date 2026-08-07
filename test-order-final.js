fetch('http://localhost:3000/api/orders', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    orderNumber: 'ELD-TEST' + Date.now().toString().slice(-6),
    items: [{ cartId: 1, id: 1, name: 'Test Shoe', price: 9999, size: '42', quantity: 1 }],
    subtotal: 9999,
    shippingFee: 0,
    paymentFee: 0,
    total: 9999,
    shipping: { name: 'Test', phone: '01000000000', governorate: 'Suez', city: 'Suez', address: '123 St', phone2: '', notes: '' },
    paymentMethod: 'cod',
    paymentMethodName: 'Cash on Delivery',
    status: 'pending_cod',
    createdAt: new Date().toISOString()
  })
}).then(async r => {
  console.log('STATUS', r.status);
  console.log('BODY', await r.text());
}).catch(e => console.log('ERR', e.message));

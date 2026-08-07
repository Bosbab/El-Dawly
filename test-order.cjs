// Spawn the real server and test the /api/orders POST endpoint
const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

const OUT = 'C:/Users/cliny/OneDrive/Desktop/ELDawly/test-output.txt';
const write = (s) => fs.appendFileSync(OUT, s + '\n');

try { fs.writeFileSync(OUT, '--- TEST START ---\n'); } catch(e) {}

const PORT = 3999;
const env = { ...process.env, PORT: String(PORT) };

const child = spawn('node', ['server.js'], { cwd: 'C:/Users/cliny/OneDrive/Desktop/ELDawly', env });

child.stdout.on('data', d => write('[SRV] ' + d.toString().trim()));
child.stderr.on('data', d => write('[SRV-ERR] ' + d.toString().trim()));

function testOrders() {
  const body = JSON.stringify({
    orderNumber: 'ELD-TEST-12345678',
    items: [{ id: 1, name: 'Test Shoe', price: 100, quantity: 1, size: '42' }],
    subtotal: 100, shippingFee: 0, paymentFee: 0, total: 100,
    shipping: { name: 'Test', phone: '01000000000', governorate: 'Suez', city: 'Suez', address: 'Test Address' },
    paymentMethod: 'cod', paymentMethodName: 'Cash on Delivery',
    status: 'pending_cod', createdAt: new Date().toISOString()
  });
  const req = http.request({ host: 'localhost', port: PORT, path: '/api/orders', method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) } }, (res) => {
    let data = '';
    res.on('data', c => data += c);
    res.on('end', () => {
      write(`[POST /api/orders] => status ${res.statusCode}, body: ${data}`);
      // Now test a nonexistent API route to confirm 404 behavior
      const req2 = http.request({ host: 'localhost', port: PORT, path: '/api/nonexistent', method: 'GET' }, (res2) => {
        let d2 = '';
        res2.on('data', c => d2 += c);
        res2.on('end', () => {
          write(`[GET /api/nonexistent] => status ${res2.statusCode}`);
          write('--- TEST DONE ---');
          child.kill();
          process.exit(0);
        });
      });
      req2.end();
    });
  });
  req.on('error', e => { write('[POST ERROR] ' + e.message); child.kill(); process.exit(0); });
  req.write(body);
  req.end();
}

setTimeout(testOrders, 4000);


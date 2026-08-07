const fs = require('fs');
const file = 'client/script.js';
let s = fs.readFileSync(file, 'utf8');

// Find and replace the broken getWhatsAppURL function
const startMarker = 'function getWhatsAppURL(product) {';
const endMarker = '\n}\n\nconst API_BASE';
const start = s.indexOf(startMarker);
const end = s.indexOf(endMarker);

if (start !== -1 && end !== -1) {
  const replacement = `function getWhatsAppURL(product) {
    const text = encodeURIComponent(
        'مرحباً AL Dawly 👋\\n' +
        'أود حجز / الاستفسار عن:\\n' +
        '\\n' +
        '👟 المنتج: ' + product.name + '\\n' +
        '🏷️ السعر: EGP ' + product.price.toLocaleString() + '\\n' +
        '📂 القسم: ' + product.category + '\\n' +
        '\\n' +
        'من فضلك أرسل لي تفاصيل أكثر وشكراً ✨\\n' +
        '\\n' +
        '— من موقع AL Dawly'
    );
    return 'https://wa.me/' + WHATSAPP_NUMBER + '?text=' + text;
}`;
  s = s.slice(0, start) + replacement + s.slice(end);
  fs.writeFileSync(file, s);
  console.log('FIXED getWhatsAppURL');
} else {
  console.log('NOT FOUND start=', start, 'end=', end);
}


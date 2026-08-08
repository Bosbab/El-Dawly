const fs = require('fs');
const zlib = require('zlib');

// Minimal JPEG decoder (baseline + progressive friendly) using zlib.
// We only need to sample a few pixels for the background color.
const buf = fs.readFileSync('C:/Users/cliny/OneDrive/Desktop/ELDawly/client/images/logo.jpeg');

class BitReader {
  constructor(data) { this.data = data; this.pos = 0; this.bitBuf = 0; this.bitCnt = 0; }
  readBits(n) {
    while (this.bitCnt < n) {
      this.bitBuf = (this.bitBuf << 8) | this.data[this.pos++];
      this.bitCnt += 8;
    }
    this.bitCnt -= n;
    return (this.bitBuf >> this.bitCnt) & ((1 << n) - 1);
  }
  readByte() { return this.data[this.pos++]; }
}

// Try a simple approach: parse SOF markers for dimensions, then decode is complex.
// Instead, list all markers and any ICC/EXIF, and print file details.
let offset = 2;
const markers = [];
while (offset < buf.length) {
  while (offset < buf.length && buf[offset] !== 0xFF) offset++;
  if (offset >= buf.length) break;
  const marker = buf[offset + 1];
  if (marker === 0xFF) { offset++; continue; }
  if (marker === 0xD8 || (marker >= 0xD0 && marker <= 0xD7)) { offset += 2; continue; }
  if (marker === 0xD9) break; // EOI
  const length = buf.readUInt16BE(offset + 2);
  markers.push({ marker: marker.toString(16), length });
  // SOF markers contain dimensions
  if (marker >= 0xC0 && marker <= 0xCF && marker !== 0xC4 && marker !== 0xC8 && marker !== 0xCC) {
    const h = buf.readUInt16BE(offset + 5);
    const w = buf.readUInt16BE(offset + 7);
    console.log('SOF marker 0x' + marker.toString(16), 'size:', w + 'x' + h);
  }
  offset += 2 + length;
}
console.log('Total markers:', markers.length);
console.log('File size:', buf.length, 'bytes');
console.log('First 16 bytes hex:', buf.slice(0,16).toString('hex'));

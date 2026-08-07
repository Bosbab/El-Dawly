async function main() {
  const r = await fetch('http://localhost:3000/');
  const t = await r.text();
  const checks = {
    'navGlobe canvas': t.includes('navEarthGlobe'),
    'globe.js loaded': t.includes('globe.js'),
    'three.js loaded': t.includes('three.min.js'),
    'brand AL DAWLY': t.includes('AL DAWLY')
  };
  console.log(JSON.stringify(checks, null, 2));
}
main().catch(e => console.log('ERR', e.message));

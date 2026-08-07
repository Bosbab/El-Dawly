/* EL Dawly — Realistic 3D Rotating Earth Globe (Three.js)
   Creates a true 3D sphere with procedurally generated multi-layered
   Earth texture, clouds, atmosphere glow, and continuous rotation. */

(function () {
  // If Three.js failed to load (e.g. CDN blocked/offline), render a CSS
  // fallback earth so the logo/hero never appear empty.
  if (typeof THREE === 'undefined') {
    const fallbackCSS = `
      .earth-fallback{position:absolute;inset:0;border-radius:50%;
        background:radial-gradient(circle at 30% 30%, #1e3a5f 0%, #0b1d3a 35%, #061427 70%, #020814 100%);
        display:flex;align-items:center;justify-content:center;overflow:hidden;}
      .earth-fallback::before{content:'';position:absolute;inset:0;border-radius:50%;
        background:url('./images/earth-map.svg') center/cover no-repeat;
        animation:earthFallSpin 18s linear infinite;}
      @keyframes earthFallSpin{from{transform:rotateY(0)}to{transform:rotateY(360deg)}}
    `;
    const style = document.createElement('style');
    style.textContent = fallbackCSS;
    document.head.appendChild(style);

    function applyFallback() {
      document.querySelectorAll('.earth-globe-canvas, .hero-earth-globe-canvas').forEach(canvas => {
        if (canvas.__fallback) return;
        canvas.__fallback = true;
        const holder = document.createElement('div');
        holder.className = 'earth-fallback';
        canvas.parentNode.insertBefore(holder, canvas);
        canvas.style.display = 'none';
      });
    }

    window.EarthGlobe = {
      init: applyFallback,
      cleanup: function () {}
    };
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', applyFallback);
    } else {
      applyFallback();
    }
    return;
  }

  // ------------------------------------------------------------------
  // 1. Procedural equirectangular Earth texture (2048 x 1024 canvas)
  //    Combines real continent silhouettes, latitudinal vegetation,
  //    deserts, ice caps, and ocean depth gradient for realism.
  // ------------------------------------------------------------------
  function createEarthTexture() {
    const W = 2048, H = 1024;
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');

    // Ocean base gradient
    const ocean = ctx.createLinearGradient(0, 0, 0, H);
    ocean.addColorStop(0, '#0a1f3c');
    ocean.addColorStop(0.25, '#123a63');
    ocean.addColorStop(0.45, '#1a5a8f');
    ocean.addColorStop(0.55, '#1a5a8f');
    ocean.addColorStop(0.75, '#123a63');
    ocean.addColorStop(1, '#0a1f3c');
    ctx.fillStyle = ocean;
    ctx.fillRect(0, 0, W, H);

    // Subtle ocean noise / currents
    for (let i = 0; i < 9000; i++) {
      const x = Math.random() * W;
      const y = Math.random() * H;
      const a = Math.random() * 0.05;
      ctx.fillStyle = Math.random() > 0.5 ? `rgba(255,255,255,${a})` : `rgba(0,20,60,${a})`;
      ctx.fillRect(x, y, 2, 2);
    }

    // Landmass polygons (equirectangular-ish coordinates)
    // Each continent is an array of [x, y] in 0..W, 0..H space
    const continents = [
      // North America
      [[160,120],[260,80],[360,78],[430,130],[420,210],[350,250],[300,240],
       [270,270],[230,300],[210,280],[175,240],[150,200],[155,160]],
      // Greenland
      [[420,60],[500,55],[540,90],[520,140],[450,140],[430,100]],
      // Central America
      [[250,300],[300,300],[330,330],[320,360],[290,370],[250,340]],
      // South America
      [[300,380],[360,380],[400,430],[420,480],[400,560],[360,620],[330,590],
       [310,540],[300,470],[295,420]],
      // Europe
      [[540,130],[600,110],[660,120],[700,150],[690,190],[660,210],[620,220],
       [580,210],[550,180]],
      // Africa
      [[560,220],[650,200],[720,230],[760,290],[740,380],[700,440],[660,460],
       [630,430],[610,380],[580,300],[560,260]],
      // Madagascar
      [[770,420],[800,420],[810,460],[800,500],[780,490],[770,450]],
      // Asia
      [[700,120],[820,90],[940,100],[1040,130],[1080,180],[1060,240],[1000,270],
       [940,280],[900,250],[860,260],[820,230],[780,200],[740,170]],
      // India
      [[900,260],[960,270],[980,320],[960,360],[920,360],[900,320]],
      // Southeast Asia
      [[1000,300],[1060,300],[1100,340],[1080,380],[1040,380],[1010,340]],
      // Japan
      [[1090,220],[1120,230],[1120,280],[1100,290],[1085,260]],
      // Australia
      [[1180,600],[1280,580],[1360,610],[1380,660],[1360,720],[1260,740],
       [1200,720],[1175,670]],
      // New Zealand
      [[1420,760],[1450,760],[1450,800],[1420,800]]
    ];

    const landFills = [
      [60,120,40], [40,90,30], [60,110,35], [40,90,30],
      [70,130,45], [90,150,50], [70,120,40], [80,140,48],
      [90,150,50], [70,120,40], [80,140,48], [90,150,50], [90,150,50]
    ];

    continents.forEach((poly, i) => {
      const [r, g, b] = landFills[i % landFills.length];
      // Base land
      ctx.beginPath();
      ctx.moveTo(poly[0][0], poly[0][1]);
      for (let j = 1; j < poly.length; j++) ctx.lineTo(poly[j][0], poly[j][1]);
      ctx.closePath();
      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.fill();

      // Vegetation shading gradient (more green near equator - y ~ 512)
      const grd = ctx.createLinearGradient(0, 300, 0, 700);
      grd.addColorStop(0, `rgba(40,80,30,0.35)`);
      grd.addColorStop(0.5, `rgba(30,60,25,0) `);
      grd.addColorStop(1, `rgba(40,80,30,0.35)`);
      ctx.fillStyle = grd;
      ctx.fill();

      // Land texture speckle
      for (let s = 0; s < 60; s++) {
        const px = poly[Math.floor(Math.random() * poly.length)][0] + (Math.random() - 0.5) * 40;
        const py = poly[Math.floor(Math.random() * poly.length)][1] + (Math.random() - 0.5) * 40;
        ctx.fillStyle = Math.random() > 0.5 ? `rgba(20,40,15,0.25)` : `rgba(120,160,80,0.18)`;
        ctx.fillRect(px, py, 6, 6);
      }
    });

    // Sahara desert
    ctx.fillStyle = 'rgba(194,154,84,0.85)';
    ctx.beginPath();
    ctx.ellipse(650, 330, 90, 45, -0.1, 0, Math.PI * 2);
    ctx.fill();
    // Arabian desert
    ctx.fillStyle = 'rgba(190,150,80,0.8)';
    ctx.beginPath();
    ctx.ellipse(930, 290, 45, 30, 0, 0, Math.PI * 2);
    ctx.fill();

    // Ice caps
    ctx.fillStyle = '#eef6fb';
    ctx.fillRect(0, 0, W, 40);
    ctx.fillRect(0, H - 40, W, 40);
    // First/last column wrap for seamless horizontal texture
    ctx.fillStyle = '#0a1f3c';

    // Highlight cloud streaks (subtle white)
    for (let i = 0; i < 40; i++) {
      const y = Math.random() * H;
      const x = Math.random() * W;
      const len = 40 + Math.random() * 120;
      const a = 0.04 + Math.random() * 0.06;
      ctx.strokeStyle = `rgba(255,255,255,${a})`;
      ctx.lineWidth = 2 + Math.random() * 4;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + len, y);
      ctx.stroke();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.anisotropy = 4;
    return texture;
  }

  // Cloud layer texture (semi-transparent white blotches)
  function createCloudTexture() {
    const W = 1024, H = 512;
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, W, H);
    for (let i = 0; i < 260; i++) {
      const x = Math.random() * W;
      const y = Math.random() * H;
      const r = 8 + Math.random() * 40;
      const a = 0.06 + Math.random() * 0.16;
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, `rgba(255,255,255,${a})`);
      g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
    for (let i = 0; i < 12; i++) {
      const y = Math.random() * H;
      const x0 = Math.random() * W;
      const len = 100 + Math.random() * 200;
      const grd = ctx.createLinearGradient(x0, y, x0 + len, y);
      grd.addColorStop(0, 'rgba(255,255,255,0)');
      grd.addColorStop(0.5, `rgba(255,255,255,${0.2 + Math.random() * 0.2})`);
      grd.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.ellipse(x0 + len / 2, y, len / 2, 6 + Math.random() * 8, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    return texture;
  }

  // ------------------------------------------------------------------
  // 2. Build a single realistic globe scene
  // ------------------------------------------------------------------
  function buildGlobe(canvas, opts) {
    const container = canvas.parentElement;
    const size = opts.size || 260;
    const cloudSpeed = opts.cloudSpeed || 0.0004;
    const earthSpeed = opts.earthSpeed || 0.0016;

    canvas.width = size * 2;
    canvas.height = size * 2;

    const renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      alpha: true,
      antialias: true
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(size * 2, size * 2);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
    camera.position.z = 3.2;

    // Lighting
    const ambient = new THREE.AmbientLight(0xffffff, 0.55);
    scene.add(ambient);
    const sun = new THREE.DirectionalLight(0xffffff, 1.15);
    sun.position.set(3, 1.5, 3);
    scene.add(sun);
    const rim = new THREE.DirectionalLight(0xaaccff, 0.35);
    rim.position.set(-3, -1, -2);
    scene.add(rim);

    // Earth sphere
    const earthGeo = new THREE.SphereGeometry(1, 64, 64);
    const earthMat = new THREE.MeshPhongMaterial({
      map: createEarthTexture(),
      specular: new THREE.Color(0x333333),
      shininess: 12,
      emissive: new THREE.Color(0x06121f)
    });
    const earth = new THREE.Mesh(earthGeo, earthMat);
    earth.rotation.x = 0.4; // slight axial tilt
    scene.add(earth);

    // Cloud sphere (slightly larger)
    const cloudMat = new THREE.MeshPhongMaterial({
      map: createCloudTexture(),
      transparent: true,
      opacity: 0.85,
      depthWrite: false
    });
    const clouds = new THREE.Mesh(new THREE.SphereGeometry(1.012, 64, 64), cloudMat);
    clouds.rotation.x = 0.4;
    scene.add(clouds);

    // Atmosphere glow (outer sprite)
    const glowCanvas = document.createElement('canvas');
    glowCanvas.width = 256;
    glowCanvas.height = 256;
    const gctx = glowCanvas.getContext('2d');
    const grad = gctx.createRadialGradient(128, 128, 60, 128, 128, 128);
    grad.addColorStop(0, 'rgba(80,160,255,0.35)');
    grad.addColorStop(0.5, 'rgba(60,140,255,0.12)');
    grad.addColorStop(1, 'rgba(30,90,220,0)');
    gctx.fillStyle = grad;
    gctx.fillRect(0, 0, 256, 256);
    const glowTex = new THREE.CanvasTexture(glowCanvas);
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({
      map: glowTex,
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false
    }));
    glow.scale.set(2.6, 2.6, 1);
    scene.add(glow);

    // Animation
    let rafId;
    function animate() {
      rafId = requestAnimationFrame(animate);
      earth.rotation.y += earthSpeed;
      clouds.rotation.y += cloudSpeed;
      renderer.render(scene, camera);
    }
    animate();

    // Resize handling
    function onResize() {
      const parentSize = container.clientWidth || size;
      const s = parentSize * 2;
      canvas.width = s;
      canvas.height = s;
      renderer.setSize(s, s);
    }
    window.addEventListener('resize', onResize);

    return {
      destroy() {
        cancelAnimationFrame(rafId);
        window.removeEventListener('resize', onResize);
        renderer.dispose();
        earthGeo.dispose();
        if (earthMat.map) earthMat.map.dispose();
        earthMat.dispose();
        if (cloudMat.map) cloudMat.map.dispose();
        cloudMat.dispose();
      }
    };
  }

// ------------------------------------------------------------------
  // 3. Global API (so script.js can re-init the hero globe after render)
  // ------------------------------------------------------------------
  const activeGlobes = [];

  function buildGlobeTracked(canvas, opts) {
    const globe = buildGlobe(canvas, opts);
    activeGlobes.push({ canvas, globe });
    return globe;
  }

  function initGlobes() {
    // Navbar globe (persistent)
    const navCanvas = document.getElementById('navEarthGlobe');
    if (navCanvas && !navCanvas.__initialized) {
      buildGlobeTracked(navCanvas, { size: 52, earthSpeed: 0.0022, cloudSpeed: 0.0006 });
      navCanvas.__initialized = true;
    }
    // Hero globe (re-created on each render)
    const heroCanvas = document.getElementById('heroEarthGlobe');
    if (heroCanvas && !heroCanvas.__initialized) {
      buildGlobeTracked(heroCanvas, { size: 260, earthSpeed: 0.0016, cloudSpeed: 0.0004 });
      heroCanvas.__initialized = true;
    }
  }

  // Destroy any globe whose canvas is no longer in the DOM (e.g. hero re-render)
  function cleanupOrphanGlobes() {
    for (let i = activeGlobes.length - 1; i >= 0; i--) {
      const entry = activeGlobes[i];
      if (!entry.canvas || !document.body.contains(entry.canvas)) {
        try { entry.globe.destroy(); } catch (e) {}
        activeGlobes.splice(i, 1);
      }
    }
  }

  window.EarthGlobe = {
    init: initGlobes,
    cleanup: cleanupOrphanGlobes
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGlobes);
  } else {
    initGlobes();
  }
})();

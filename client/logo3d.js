/* EL Dawly — Animated 3D Rotating Logo Sphere (Three.js)
   Loads logo.jpeg and wraps it onto a single 3D sphere that rotates
   continuously. Includes:
   - continuous rotation (auto-spin)
   - gentle floating bob
   - golden rim lighting + soft glow to match the premium brand theme
   - optional mouse-drag rotation
   Exposes window.Logo3D with init()/cleanup() mirroring globe.js. */

(function () {
  // If Three.js failed to load (e.g. CDN blocked/offline), render a CSS
  // fallback so the logo area never appears empty.
  if (typeof THREE === 'undefined') {
    function applyFallback() {
      document.querySelectorAll('.logo3d-canvas').forEach(canvas => {
        if (canvas.__fallback) return;
        canvas.__fallback = true;
        const img = document.createElement('img');
        img.src = './images/logo.jpeg';
        img.alt = 'AL Dawly Logo';
        img.style.cssText =
          'width:100%;height:100%;object-fit:contain;border-radius:50%;' +
          'animation:logoFallSpin 16s linear infinite;';
        const style = document.createElement('style');
        style.textContent =
          '@keyframes logoFallSpin{from{transform:rotateY(0)}to{transform:rotateY(360deg)}}';
        document.head.appendChild(style);
        canvas.parentNode.insertBefore(img, canvas);
        canvas.style.display = 'none';
      });
    }
    window.Logo3D = { init: applyFallback, cleanup: function () {} };
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', applyFallback);
    } else {
      applyFallback();
    }
    return;
  }

  // Shared texture cache so the logo is only decoded once.
  let sharedTexture = null;
  let textureUrl = './images/logo.jpeg';

// Process an image into a texture, converting near-white background
  // pixels to transparent so only the logo content shows (no white square).
  function processToTexture(img) {
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);

    try {
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        // Near-white pixels become transparent
        if (r > 235 && g > 235 && b > 235) {
          data[i + 3] = 0;
        }
      }
      ctx.putImageData(imageData, 0, 0);
    } catch (e) {
      // Cross-origin / taint issues — fall back to the raw image.
      console.warn('Could not process logo background:', e);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.anisotropy = 4;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.premultiplyAlpha = true;
    return texture;
  }

  function getTexture(onLoad) {
    if (sharedTexture) {
      if (onLoad) onLoad(sharedTexture);
      return sharedTexture;
    }
    const loader = new THREE.TextureLoader();
    loader.load(
      textureUrl,
      function (tex) {
        // Re-process the image to knock out the white background.
        const img = new Image();
        img.onload = function () {
          sharedTexture = processToTexture(img);
          if (onLoad) onLoad(sharedTexture);
        };
        img.onerror = function () {
          tex.anisotropy = 4;
          sharedTexture = tex;
          if (onLoad) onLoad(sharedTexture);
        };
        img.src = textureUrl;
      },
      undefined,
      function () {
        // Fallback: generate a branded placeholder texture
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 682; // portrait ratio ~768:1024
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, 512, 682);
        const grad = ctx.createLinearGradient(0, 0, 512, 682);
        grad.addColorStop(0, '#8B6914');
        grad.addColorStop(0.5, '#D4AF37');
        grad.addColorStop(1, '#8B6914');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 512, 682);
        ctx.fillStyle = '#1A1A1A';
        ctx.font = 'bold 120px Georgia, serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('AL', 256, 280);
        ctx.font = 'bold 90px Georgia, serif';
        ctx.fillText('DAWLY', 256, 420);
        sharedTexture = new THREE.CanvasTexture(canvas);
        if (onLoad) onLoad(sharedTexture);
      }
    );
    return null;
  }

  // ------------------------------------------------------------------
  // Build a single 3D logo sphere scene
  // ------------------------------------------------------------------
  function buildLogo(canvas, opts) {
    const container = canvas.parentElement;
    const size = opts.size || 260;
    const speed = opts.speed || 0.008;
    const bobAmp = opts.bobAmp || 0.06;   // floating bob amplitude
    const fov = opts.fov || 40;

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
    const camera = new THREE.PerspectiveCamera(fov, 1, 0.1, 1000);
    camera.position.z = 3;

    // Lighting — golden premium rim glow
    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambient);
    const key = new THREE.DirectionalLight(0xfff2cc, 1.1);
    key.position.set(2, 2, 3);
    scene.add(key);
    const gold = new THREE.DirectionalLight(0xd4af37, 0.7);
    gold.position.set(-3, 1, 2);
    scene.add(gold);
    const rim = new THREE.DirectionalLight(0xffffff, 0.4);
    rim.position.set(-2, -2, -2);
    scene.add(rim);

    // Group holding the single sphere
    const group = new THREE.Group();
    scene.add(group);

// Single rotating sphere with the logo texture wrapped on it.
    // The sphere base is opaque black. The logo's white background has been
    // made transparent in processToTexture, and alphaTest discards those
    // transparent texels — so the black sphere shows through and there is
    // NO white square. AL DAWLY text and continents remain visible.
    function buildSphere(tex) {
      const geo = new THREE.SphereGeometry(0.85, 64, 64);
      const mat = new THREE.MeshPhongMaterial({
        color: 0x000000,        // black sphere base
        map: tex,
        alphaTest: 0.4,          // discard transparent (removed-white) pixels
        side: THREE.DoubleSide,
        specular: new THREE.Color(0x333333),
        shininess: 20,
        emissive: new THREE.Color(0x1a1405),
        emissiveIntensity: 0.15
      });
      const mesh = new THREE.Mesh(geo, mat);
      group.add(mesh);
      ready = true;
    }

    let ready = false;
    getTexture(buildSphere);

    // Soft glow behind the logo
    const glowCanvas = document.createElement('canvas');
    glowCanvas.width = 256;
    glowCanvas.height = 256;
    const gctx = glowCanvas.getContext('2d');
    const grad = gctx.createRadialGradient(128, 128, 20, 128, 128, 128);
    grad.addColorStop(0, 'rgba(212,175,55,0.5)');
    grad.addColorStop(0.5, 'rgba(184,134,11,0.22)');
    grad.addColorStop(1, 'rgba(184,134,11,0)');
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
    glow.position.z = -0.3;
    scene.add(glow);

    // Mouse-drag rotation (optional)
    let isDragging = false;
    let prevX = 0, prevY = 0;
    let targetRotY = 0, targetRotX = 0;

    canvas.addEventListener('pointerdown', (e) => {
      isDragging = true;
      prevX = e.clientX;
      prevY = e.clientY;
      canvas.setPointerCapture && canvas.setPointerCapture(e.pointerId);
    });
    canvas.addEventListener('pointermove', (e) => {
      if (!isDragging) return;
      const dx = e.clientX - prevX;
      const dy = e.clientY - prevY;
      prevX = e.clientX;
      prevY = e.clientY;
      targetRotY += dx * 0.01;
      targetRotX += dy * 0.01;
    });
    canvas.addEventListener('pointerup', () => { isDragging = false; });
    canvas.addEventListener('pointerleave', () => { isDragging = false; });

    // Animation loop
    let rafId;
    let time = 0;
    function animate() {
      rafId = requestAnimationFrame(animate);
      time += 0.016;

      // Auto-spin on Y (paused when user is dragging)
      if (!isDragging) {
        group.rotation.y += speed;
      } else {
        // Smooth toward drag target
        group.rotation.y += (targetRotY - group.rotation.y) * 0.1;
        group.rotation.x += (targetRotX - group.rotation.x) * 0.1;
      }

      // Floating bob
      group.position.y = Math.sin(time * 1.6) * bobAmp;

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
        canvas.removeEventListener('pointerdown', null);
        canvas.removeEventListener('pointermove', null);
        canvas.removeEventListener('pointerup', null);
        canvas.removeEventListener('pointerleave', null);
        renderer.dispose();
        group.traverse((o) => {
          if (o.geometry) o.geometry.dispose();
          if (o.material) {
            if (o.material.map) o.material.map.dispose();
            o.material.dispose();
          }
        });
        if (glowTex) glowTex.dispose();
      }
    };
  }

  // ------------------------------------------------------------------
  // Global API (so script.js can re-init the hero logo after render)
  // ------------------------------------------------------------------
  const activeLogos = [];

  function buildLogoTracked(canvas, opts) {
    const logo = buildLogo(canvas, opts);
    activeLogos.push({ canvas, logo });
    return logo;
  }

  function initLogos() {
    // Navbar logo (persistent)
    const navCanvas = document.getElementById('navLogo3D');
    if (navCanvas && !navCanvas.__initialized) {
      buildLogoTracked(navCanvas, { size: 52, speed: 0.006, bobAmp: 0.02, fov: 50 });
      navCanvas.__initialized = true;
    }
    // Hero logo (re-created on each render)
    const heroCanvas = document.getElementById('heroLogo3D');
    if (heroCanvas && !heroCanvas.__initialized) {
      buildLogoTracked(heroCanvas, { size: 260, speed: 0.008, bobAmp: 0.06, fov: 40 });
      heroCanvas.__initialized = true;
    }
  }

  // Destroy any logo whose canvas is no longer in the DOM (e.g. hero re-render)
  function cleanupOrphanLogos() {
    for (let i = activeLogos.length - 1; i >= 0; i--) {
      const entry = activeLogos[i];
      if (!entry.canvas || !document.body.contains(entry.canvas)) {
        try { entry.logo.destroy(); } catch (e) {}
        activeLogos.splice(i, 1);
      }
    }
  }

  window.Logo3D = {
    init: initLogos,
    cleanup: cleanupOrphanLogos
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLogos);
  } else {
    initLogos();
  }
})();

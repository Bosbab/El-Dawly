const AVAILABLE_SIZES = ['36', '37', '38', '39', '40', '41', '42', '43', '44', '45', '46'];
const CATEGORIES = ['Running', 'Casual', 'Formal', 'Sports', 'Sneakers', 'Boots', 'Sandals'];
const SHOE_EMOJIS = ['👟', '👞', '🥾', '👠', '🩴', '👢', '🥾', '⛸️'];
const WHATSAPP_NUMBER = '201211339267';
const FEATURED_SHOE_IDS = [34, 38, 41];

function getWhatsAppURL(product) {
    const text = encodeURIComponent(
        'مرحباً AL Dawly 👋\n' +
        'أود حجز / الاستفسار عن:\n' +
        '\n' +
        '👟 المنتج: ' + product.name + '\n' +
        '🏷️ السعر: EGP ' + product.price.toLocaleString() + '\n' +
        '📂 القسم: ' + product.category + '\n' +
        '\n' +
        'من فضلك أرسل لي تفاصيل أكثر وشكراً ✨\n' +
        '\n' +
        '— من موقع AL Dawly'
    );
return 'https://wa.me/' + WHATSAPP_NUMBER + '?text=' + text;
}

const API_BASE = '/api';

// ------------------------------------------------------------------
// Static fallback product data (used when running on static hosting
// like Vercel / GitHub Pages where the Node/Express backend is absent)
// ------------------------------------------------------------------
const STATIC_PRODUCTS = [
  {id:1,name:'Heritage Oxford Classic',category:'Formal',price:3499,description:'Hand-stitched premium leather Oxford shoes. Crafted from full-grain Italian leather with a leather sole and Goodyear welt construction. A timeless design for distinguished gentlemen.',stock:12,sizes:['39','40','41','42','43','44','45'],image:'/images/shoe-01-1786122608267-5382.jpg',emoji:'👞'},
  {id:2,name:'Velvet Sovereign Loafers',category:'Formal',price:2899,description:'Luxurious velvet loafers with gold-tone horsebit detail. Plush velvet upper, leather lining, and cushioned insole for unmatched comfort at galas and special events.',stock:8,sizes:['39','40','41','42','43','44'],image:'/images/shoe-02-1786122608279-5782.jpg',emoji:'👞'},
  {id:3,name:'Apex Predator Running Elite',category:'Running',price:2199,description:'Carbon-plate performance running shoes engineered for champions. Responsive foam midsole, breathable engineered mesh, and aggressive rubber outsole for race-day performance.',stock:18,sizes:['38','39','40','41','42','43','44','45'],image:'/images/shoe-03-1786122608287-3482.jpg',emoji:'👟'},
  {id:4,name:'Midnight Gold Street Sneakers',category:'Sneakers',price:2599,description:'Limited edition street sneakers featuring genuine leather panels with 24k gold accent stitching. Premium EVA cushioning for all-day urban comfort with head-turning style.',stock:15,sizes:['38','39','40','41','42','43','44','45'],image:'/images/shoe-04-1786122608295-9679.jpg',emoji:'👟'},
  {id:5,name:'Summit Conqueror Hiking Boots',category:'Boots',price:4299,description:'Expedition-grade waterproof hiking boots crafted from tough full-grain leather. Vibram outsole for unbeatable traction, reinforced ankle support, and breathable membrane.',stock:6,sizes:['40','41','42','43','44','45','46'],image:'/images/shoe-05-1786122608303-5537.jpg',emoji:'🥾'},
  {id:6,name:'Royal Sandal Collection',category:'Sandals',price:799,description:'Handcrafted leather sandals combining traditional craftsmanship with modern comfort. Plush padded footbed and non-slip rubber sole — perfect for warm-weather elegance.',stock:25,sizes:['36','37','38','39','40','41','42','43'],image:'/images/shoe-06-1786122608311-3706.jpg',emoji:'🩴'},
  {id:7,name:'Sapphire Court Sneakers',category:'Sneakers',price:2399,description:'Premium court-inspired sneakers with rich blue-toned leather, cushioned collar, and a grippy cupsole for everyday elegance.',stock:14,sizes:['38','39','40','41','42','43','44'],image:'/images/shoe-07-1786122608319-4245.jpg',emoji:'👟'},
  {id:8,name:'Regal Town Derby',category:'Formal',price:3199,description:'Refined derby shoes with burnished leather and a hand-finished patina. A modern classic for the discerning professional.',stock:10,sizes:['39','40','41','42','43','44','45'],image:'/images/shoe-08-1786122608327-3524.jpg',emoji:'👞'},
  {id:10,name:'Urban Stride Runner',category:'Running',price:1899,description:'Lightweight daily trainer with breathable mesh and cloud-like cushioning for everyday comfort and versatility.',stock:20,sizes:['38','39','40','41','42','43','44','45'],image:'/images/shoe-10-1786122608344-3830.jpg',emoji:'👟'},
  {id:12,name:'Desert Nomad Boots',category:'Boots',price:3899,description:'Rugged desert boots with supple suede uppers and a durable crepe sole. A perfect blend of comfort and adventure-ready style.',stock:9,sizes:['40','41','42','43','44','45'],image:'/images/shoe-12-1786122608360-4048.jpg',emoji:'🥾'},
  {id:15,name:'Sunset Slide Sandals',category:'Sandals',price:899,description:'Premium leather slides with a cushioned footbed and a sleek, minimalist profile for effortless warm-weather style.',stock:22,sizes:['37','38','39','40','41','42','43'],image:'/images/shoe-15-1786122608384-4115.jpg',emoji:'🩴'},
  {id:18,name:'Crimson Court Classic',category:'Sports',price:2799,description:'Court-ready performance shoes with red-leather accents, reinforced toe, and a responsive midsole for agile movement.',stock:13,sizes:['38','39','40','41','42','43','44'],image:'/images/shoe-18-1786122608408-6553.jpg',emoji:'👞'}
];

let currentPage = 'home';
let selectedProductId = null;
let selectedImageData = null;
let editingProductId = null;
let productsCache = [];
let authToken = localStorage.getItem('eldawly_auth_token') || null;

function getAuthToken() {
  return localStorage.getItem('eldawly_auth_token') || null;
}

function setAuthToken(token) {
  if (token) {
    localStorage.setItem('eldawly_auth_token', token);
    authToken = token;
  } else {
    localStorage.removeItem('eldawly_auth_token');
    authToken = null;
  }
}

async function apiRequest(endpoint, options = {}) {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers
    });
    
    const data = await res.json().catch(() => ({}));
    
    if (!res.ok) {
      throw new Error(data.error || `Request failed with status ${res.status}`);
    }
    
    return data;
  } catch (err) {
    console.error(`API Error [${endpoint}]:`, err);
    throw err;
  }
}

async function loadProducts(forceRefresh = false) {
  if (productsCache.length > 0 && !forceRefresh) {
    return productsCache;
  }
  try {
    const products = await apiRequest('/products');
    productsCache = products;
    return products;
  } catch (err) {
    // API unavailable (e.g. static hosting on Vercel/GitHub Pages).
    // Fall back to embedded dataset so the catalog still works.
    console.warn('API unavailable, using static product data:', err);
    productsCache = STATIC_PRODUCTS;
    return STATIC_PRODUCTS;
  }
}

async function refreshProducts() {
  productsCache = [];
  return loadProducts(true);
}

function isAdminLoggedIn() {
  return !!getAuthToken();
}

async function verifyAdminAuth() {
  const token = getAuthToken();
  if (!token) return false;
  try {
    const result = await apiRequest('/auth/verify', { method: 'POST' });
    return result.valid === true;
  } catch {
    setAuthToken(null);
    return false;
  }
}

function navigate(page) {
  currentPage = page;
  window.location.hash = page;
  document.getElementById('navMenu').classList.remove('active');
  render();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function toggleMobileMenu() {
  document.getElementById('navMenu').classList.toggle('active');
}

async function render() {
  const app = document.getElementById('app');
  const hash = window.location.hash.slice(1);

  if (hash) {
    if (hash.startsWith('product/')) {
      selectedProductId = parseInt(hash.split('/')[1]);
      currentPage = 'product-detail';
    } else {
      currentPage = hash;
    }
  }

  const adminNavLink = document.getElementById('adminNavLink');
  if (isAdminLoggedIn()) {
    const valid = await verifyAdminAuth();
    adminNavLink.textContent = valid ? 'Dashboard' : 'Admin';
  } else {
    adminNavLink.textContent = 'Admin';
  }

  switch (currentPage) {
    case 'home':
      app.innerHTML = renderLoading();
      const allForHome = await loadProducts();
      const featuredProducts = FEATURED_SHOE_IDS
        .map(id => allForHome.find(p => p.id === id))
        .filter(Boolean);
      app.innerHTML = renderHome(featuredProducts);
      break;
    case 'products':
      app.innerHTML = renderProductsShell();
      const allProducts = await loadProducts();
      productsCache = allProducts;
      renderProductsWithData(allProducts);
      setupProductFilters();
      break;
    case 'product-detail':
      app.innerHTML = renderLoading();
      const products = await loadProducts();
      app.innerHTML = renderProductDetail(products.find(p => p.id === selectedProductId));
      break;
    case 'about':
      app.innerHTML = renderAbout();
      break;
    case 'contact':
      app.innerHTML = renderContact();
      break;
    case 'admin':
      if (isAdminLoggedIn()) {
        const valid = await verifyAdminAuth();
        if (!valid) {
          setAuthToken(null);
        }
      }
      app.innerHTML = renderAdmin();
      if (isAdminLoggedIn()) {
        app.innerHTML = renderLoading();
        const dashboardProducts = await loadProducts();
        app.innerHTML = renderAdminDashboard(dashboardProducts);
      }
      setupAdminHandlers();
      break;
    default:
      const defProducts = await loadProducts();
      const defFeatured = FEATURED_SHOE_IDS
        .map(id => defProducts.find(p => p.id === id))
        .filter(Boolean);
      app.innerHTML = renderHome(defFeatured);
  }
}

function renderLoading() {
  return `
    <div style="min-height: 400px;" class="section">
      <div class="page-loader">
        <div class="loading-spinner"></div>
        <div>Loading...</div>
      </div>
    </div>
  `;
}

function renderHome(featuredProducts) {
    return `
<section class="hero home-dark">
            <div class="hero-content">
                <h1>AL Dawly <span>store</span></h1>
<div class="hero-logo3d-wrapper">
                    <div class="hero-logo3d-container" id="heroLogoContainer">
                        <img src="images/logo.jpeg" alt="AL Dawly Logo" class="hero-logo-img">
                    </div>
                </div>
                <p>Crafted with Excellence. Worn with Distinction. Discover the AL Dawly heritage of premium shoemaking.</p>
                <a href="#products" onclick="navigate('products')" class="btn btn-lg">Explore Collection →</a>
            </div>
        </section>

<section class="section home-dark">
            <div class="features">
                <div class="feature-card">
                    <div class="feature-icon">🏆</div>
                    <h3>Luxury Craftsmanship</h3>
                    <p>Hand-finished premium materials with meticulous attention to every detail</p>
                </div>
                <div class="feature-card">
                    <div class="feature-icon">🚚</div>
                    <h3>White Glove Delivery</h3>
                    <p>Carefully packaged and delivered with the utmost care to your door</p>
                </div>
                <div class="feature-card">
                    <div class="feature-icon">💎</div>
                    <h3>Guaranteed Quality</h3>
                    <p>Authentic quality promise with our extended craftsmanship warranty</p>
                </div>
                <div class="feature-card">
                    <div class="feature-icon">👑</div>
                    <h3>VIP Service</h3>
                    <p>Personalized concierge for exclusive clients and bespoke fittings</p>
                </div>
            </div>
        </section>

<section class="home-dark" style="background: #000000; padding: 6rem 2rem; border-top: var(--border-gold); border-bottom: var(--border-gold);">
            <div class="section">
                <div class="section-title">
                    <h2>Signature Collection</h2>
                    <p>Masterpieces from our atelier — handpicked for the discerning</p>
                </div>
                ${renderProductsGrid(featuredProducts)}
                <div style="text-align: center; margin-top: 3.5rem;">
                    <a href="#products" onclick="navigate('products')" class="btn btn-lg btn-secondary">View Complete Collection</a>
                </div>
            </div>
        </section>
    `;
}

function renderProductsShell() {
    return `
        <section class="section">
            <div class="section-title">
                <h2>The Complete Collection</h2>
                <p>Every pair tells a story of excellence and heritage</p>
            </div>
            <div class="filters">
                <div class="filter-group">
                    <input type="text" id="searchInput" class="search-input" placeholder="🔍 Search the collection...">
                    <select id="categoryFilter">
                        <option value="">All Categories</option>
                        ${CATEGORIES.map(c => `<option value="${c}">${c}</option>`).join('')}
                    </select>
                </div>
                <div class="filter-group">
                    <select id="sortFilter">
                        <option value="default">Sort By</option>
                        <option value="price-low">Price: Low to High</option>
                        <option value="price-high">Price: High to Low</option>
                        <option value="name">Name: A-Z</option>
                        <option value="stock">Stock Availability</option>
                    </select>
                </div>
            </div>
            <div id="productsGrid">
                ${renderLoading()}
            </div>
        </section>
    `;
}

function renderProductsWithData(products) {
    document.getElementById('productsGrid').innerHTML = renderProductsGrid(products);
}

function setupProductFilters() {
    const searchInput = document.getElementById('searchInput');
    const categoryFilter = document.getElementById('categoryFilter');
    const sortFilter = document.getElementById('sortFilter');

    if (searchInput) {
        searchInput.addEventListener('input', filterProducts);
        categoryFilter.addEventListener('change', filterProducts);
        sortFilter.addEventListener('change', filterProducts);
    }
}

async function filterProducts() {
    let products = [...productsCache];
    if (products.length === 0) {
        products = await loadProducts();
    }
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const category = document.getElementById('categoryFilter').value;
    const sort = document.getElementById('sortFilter').value;

    if (searchTerm) {
        products = products.filter(p => 
            p.name.toLowerCase().includes(searchTerm) ||
            p.description.toLowerCase().includes(searchTerm) ||
            p.category.toLowerCase().includes(searchTerm)
        );
    }

    if (category) {
        products = products.filter(p => p.category === category);
    }

    switch (sort) {
        case 'price-low':
            products.sort((a, b) => a.price - b.price);
            break;
        case 'price-high':
            products.sort((a, b) => b.price - a.price);
            break;
        case 'name':
            products.sort((a, b) => a.name.localeCompare(b.name));
            break;
        case 'stock':
            products.sort((a, b) => b.stock - a.stock);
            break;
    }

    document.getElementById('productsGrid').innerHTML = renderProductsGrid(products);
}

function renderProductsGrid(products) {
    if (!products || products.length === 0) {
        return `
            <div class="empty-state">
                <div class="empty-state-icon">🔍</div>
                <h3>No Pieces Found</h3>
                <p>Try adjusting your search or filters</p>
            </div>
        `;
    }

return `
        <div class="products-grid">
            ${products.map(product => {
                const spinImage = FEATURED_SHOE_IDS.includes(product.id);
                return `
                <div class="product-card" onclick="viewProduct(${product.id})">
                    <div class="product-image ${spinImage ? 'spin-image-wrap' : ''}">
                        ${product.image 
                            ? `<img src="${product.image}" alt="${product.name}" loading="lazy" class="${spinImage ? 'spin-image' : ''}">`
                            : product.emoji || '👟'
                        }
                        ${product.stock === 0 ? `<span class="product-badge sold-out">Sold Out</span>` : ''}
                    </div>
                    <div class="product-info">
                        <span class="product-category">${product.category}</span>
                        <h3 class="product-name">${product.name}</h3>
                        <div class="product-price-row">
                            <div class="product-price">EGP ${product.price.toLocaleString()}</div>
                            <button class="quick-add-btn" onclick="event.stopPropagation(); viewProduct(${product.id})" ${product.stock === 0 ? 'disabled' : ''} title="${product.stock === 0 ? 'Sold Out' : 'Select Size'}">
                                ${product.stock === 0 ? '✕' : '+'}
                            </button>
                        </div>
                        <div class="product-stock ${getStockClass(product.stock)}">
                            ${getStockText(product.stock)}
                        </div>
                    </div>
                </div>
            `}).join('')}
        </div>
    `;
}

function getStockClass(stock) {
    if (stock === 0) return 'out-of-stock';
    if (stock <= 5) return 'low-stock';
    return 'in-stock';
}

function getStockText(stock) {
    if (stock === 0) return '❌ Sold Out';
    if (stock <= 5) return `⚠️ Limited (${stock} left)`;
    return `✓ Available (${stock} in stock)`;
}

function viewProduct(id) {
    selectedProductId = id;
    window.location.hash = `product/${id}`;
    currentPage = 'product-detail';
    render();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function renderProductDetail(product) {
    if (!product) {
        return `
            <section class="section">
                <div class="empty-state">
                    <div class="empty-state-icon">❓</div>
                    <h3>Piece Not Found</h3>
                    <a href="#products" onclick="navigate('products')" class="btn">Return to Collection</a>
                </div>
            </section>
        `;
    }

    return `
        <section class="section">
            <a href="#products" onclick="navigate('products'); return false;" class="back-link">← Back to Collection</a>
            
            <div class="product-detail">
                <div class="product-detail-image">
                    ${product.image 
                        ? `<img src="${product.image}" alt="${product.name}">`
                        : product.emoji || '👞'
                    }
                </div>
                <div class="product-detail-info">
                    <span class="product-category">${product.category} Collection</span>
                    <h1>${product.name}</h1>
                    <div class="product-detail-price">EGP ${product.price.toLocaleString()}</div>
                    
                    <div class="product-detail-section">
                        <h3>Availability</h3>
                        <span class="product-stock ${getStockClass(product.stock)}" style="font-size: 1.1rem;">
                            ${getStockText(product.stock)}
                        </span>
                    </div>

                    <div class="product-detail-section">
                        <h3>Select Your Size (EU)</h3>
                        <div class="sizes-grid">
                            ${AVAILABLE_SIZES.map(size => `
                                <div class="size-tag ${product.sizes.includes(size) ? '' : 'unavailable'}">
                                    ${size}
                                </div>
                            `).join('')}
                        </div>
                    </div>

                    <div class="product-detail-section">
                        <h3>The Craft</h3>
                        <p class="product-description">${product.description}</p>
                    </div>

                    <div style="margin-top: 2rem; display: flex; gap: 1rem; flex-wrap: wrap;">
                        ${product.stock > 0 
                            ? `<a href="${getWhatsAppURL(product)}" target="_blank" rel="noopener noreferrer" class="btn btn-lg btn-primary">💬 WhatsApp: Reserve Now</a>`
                            : `<button class="btn btn-lg" disabled style="background: #333; cursor: not-allowed; color: #888;">Sold Out</button>`
                        }
                        <button class="btn btn-lg btn-secondary" onclick="navigate('contact')">📍 Visit Store</button>
                    </div>
                </div>
            </div>
        </section>
    `;
}

function renderAbout() {
    return `
        <section class="section">
            <div class="section-title">
                <h2>Atelier Heritage</h2>
                <p>A legacy of craftsmanship spanning generations</p>
            </div>
            
            <div class="about-section">
                <div class="about-image">👑</div>
                <div class="about-content">
                    <h2>Excellence in Every Stitch</h2>
                    <p>Founded with a singular vision — to create footwear that transcends trends and stands as a testament to timeless elegance. At AL Dawly, every pair begins as a sketch and ends as a masterpiece.</p>
                    <p>Our master craftsmen employ techniques honed over decades, using only the finest materials sourced from the most prestigious tanneries and mills across the globe.</p>
                    <p>From the selection of the first hide to the final polish by hand, quality is never compromised. We measure our success not by the number of pairs we create, but by the number of generations who wear them.</p>
                    <p>When you step into AL Dawly, you don't just wear shoes — you wear a tradition. A philosophy. A promise of excellence that will accompany you on life's most important journeys.</p>
                </div>
            </div>

            <div class="features" style="margin-top: 5rem;">
                <div class="feature-card">
                    <div class="feature-icon">🎯</div>
                    <h3>Our Mission</h3>
                    <p>To craft footwear that empowers the extraordinary in every individual — combining timeless design with uncompromising comfort.</p>
                </div>
                <div class="feature-card">
                    <div class="feature-icon">✨</div>
                    <h3>Our Vision</h3>
                    <p>To be recognized as Egypt's premier luxury footwear house — synonymous globally with heritage, quality, and understated elegance.</p>
                </div>
                <div class="feature-card">
                    <div class="feature-icon">💎</div>
                    <h3>Our Values</h3>
                    <p>Uncompromising craftsmanship. Respect for tradition. Innovation in design. Integrity in all that we do.</p>
                </div>
            </div>
        </section>
    `;
}

function renderContact() {
    return `
        <section class="section" id="contact">
            <div class="section-title">
                <h2>Contact AL Dawly Store</h2>
                <p>AL Dawly Premium Shoes — Suez (Delivery & Support in Suez Only)</p>
            </div>
            
            <div class="contact-grid">
                <div>
                    <div class="contact-info-card">
                        <h3><span class="contact-icon">🏪</span> Store</h3>
                        <p><strong>AL Dawly Premium Shoes</strong><br>Suez Branch</p>
                    </div>
                    <div class="contact-info-card">
                        <h3><span class="contact-icon">📍</span> Store Location</h3>
                        <p><strong>Suez City</strong><br>Directly in front of <em>Rawash Restaurant</em></p>
                    </div>
                    <div class="contact-info-card">
                        <h3><span class="contact-icon">📞</span> Direct Phone Line</h3>
                        <p><strong>Call Us</strong><br>📱 <a href="tel:+201013909708" style="color: var(--gold); font-weight: 600;">010 1390 9708</a></p>
                    </div>
                    <div class="contact-info-card">
                        <h3><span class="contact-icon">💬</span> WhatsApp Order Line</h3>
                        <p><strong>Fast Reservations & Orders</strong><br>💬 <a href="https://wa.me/201211339267" target="_blank" rel="noopener noreferrer" style="color: var(--gold); font-weight: 600;">012 1133 9267</a><br><small style="opacity: 0.7;">Click to chat instantly with AL Dawly Store</small></p>
                    </div>
                    <div class="contact-info-card">
                        <h3><span class="contact-icon">⏰</span> Working Hours</h3>
                        <p>Saturday → Thursday: <strong>10:00 AM — 10:00 PM</strong><br>Friday: <strong>2:00 PM — 10:00 PM</strong></p>
                    </div>
                </div>
                
                <div class="contact-form">
                    <h3>Send a Message to AL Dawly Store</h3>
                    <form onsubmit="handleContactSubmit(event)">
                        <div class="form-group">
                            <label>Your Full Name</label>
                            <input type="text" id="contactName" required placeholder="Your name">
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>Phone Number</label>
                                <input type="tel" id="contactPhone" required placeholder="010 0000 0000">
                            </div>
                            <div class="form-group">
                                <label>Email (Optional)</label>
                                <input type="email" id="contactEmail" placeholder="you@email.com">
                            </div>
                        </div>
                        <div class="form-group">
                            <label>Subject</label>
                            <input type="text" id="contactSubject" required placeholder="e.g. Order / Shoe Model Inquiry">
                        </div>
                        <div class="form-group">
                            <label>Your Message</label>
                            <textarea id="contactMessage" required placeholder="Type your message for AL Dawly Store — mention shoe model name/number if possible..." rows="5"></textarea>
                        </div>
                        <div style="display: flex; gap: 1rem; flex-wrap: wrap;">
                            <button type="submit" id="contactSubmitBtn" class="btn btn-lg" style="flex: 1;">Send Message ✉️</button>
                            <a href="https://wa.me/201211339267?text=%D9%85%D8%B1%D8%AD%D8%A8%D8%A7%D9%8B%20EL%20Dawly%20%F0%9F%91%8B" target="_blank" rel="noopener noreferrer" class="btn btn-lg btn-secondary" style="white-space: nowrap;">💬 WhatsApp Us</a>
                        </div>
                    </form>
                </div>
            </div>
        </section>
    `;
}

async function handleContactSubmit(e) {
    e.preventDefault();
    const btn = document.getElementById('contactSubmitBtn');
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<span class="loading-spinner" style="width: 18px; height: 18px; border-width: 2px; vertical-align: middle; margin-right: 0.5rem;"></span> Sending...';

    try {
        await apiRequest('/contact', {
            method: 'POST',
            body: JSON.stringify({
                name: document.getElementById('contactName').value,
                email: document.getElementById('contactEmail').value,
                phone: document.getElementById('contactPhone').value,
                subject: document.getElementById('contactSubject').value,
                message: document.getElementById('contactMessage').value
            })
        });
        showToast('Your message has been received. A member of our team will be in touch shortly.', 'success');
        e.target.reset();
    } catch (err) {
        showToast(err.message || 'Failed to send message. Please try again.', 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
}

function renderAdmin() {
    if (!isAdminLoggedIn()) {
        return renderAdminLogin();
    }
    return renderLoading();
}

function renderAdminLogin() {
    return `
        <section class="section">
            <div class="admin-login">
                <div style="text-align: center; font-size: 3.5rem; margin-bottom: 1rem;">🔐</div>
                <h2>Private Access</h2>
                <p class="subtitle">Atelier Management Portal</p>
                <form onsubmit="handleAdminLogin(event)">
                    <div class="form-group">
                        <label>Private ID</label>
                        <input type="text" id="adminUsername" required placeholder="Administrator ID" autocomplete="username">
                    </div>
                    <div class="form-group">
                        <label>Secure Key</label>
                        <input type="password" id="adminPassword" required placeholder="••••••••" autocomplete="current-password">
                        <div class="form-error" id="loginError" style="display: none;"></div>
                    </div>
                    <button type="submit" id="loginBtn" class="btn btn-lg" style="width: 100%;">Enter Portal →</button>
                </form>
            </div>
        </section>
    `;
}

async function handleAdminLogin(e) {
    e.preventDefault();
    const username = document.getElementById('adminUsername').value;
    const password = document.getElementById('adminPassword').value;
    const errorEl = document.getElementById('loginError');
    const btn = document.getElementById('loginBtn');
    const originalText = btn.innerHTML;

    btn.disabled = true;
    btn.innerHTML = '<span class="loading-spinner" style="width: 18px; height: 18px; border-width: 2px; vertical-align: middle; margin-right: 0.5rem;"></span> Authenticating...';

    try {
        const result = await apiRequest('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ username, password })
        });
        
        setAuthToken(result.token);
        showToast('Welcome back, Administrator.', 'success');
        render();
    } catch (err) {
        errorEl.style.display = 'block';
        errorEl.textContent = '❌ ' + (err.message || 'Invalid credentials');
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
}

function renderAdminDashboard(products) {
    const totalStock = products.reduce((sum, p) => sum + p.stock, 0);
    const outOfStock = products.filter(p => p.stock === 0).length;
    const lowStock = products.filter(p => p.stock > 0 && p.stock <= 5).length;
    const totalValue = products.reduce((sum, p) => sum + (p.price * p.stock), 0);

    return `
        <div class="admin-container">
            <div class="admin-header">
                <div>
                    <h2>Inventory Control</h2>
                    <p style="color: var(--gray);">AL Dawly Atelier — Collection Management Dashboard</p>
                </div>
                <div class="admin-actions">
                    <button class="btn" onclick="openAddProductModal()">➕ Introduce Piece</button>
                    <button class="btn btn-danger" onclick="handleAdminLogout()">🚪 Exit Portal</button>
                </div>
            </div>

            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-value">${products.length}</div>
                    <div class="stat-label">Distinct Pieces</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${totalStock}</div>
                    <div class="stat-label">Total Units</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${lowStock} / ${outOfStock}</div>
                    <div class="stat-label">Limited / Sold Out</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">EGP ${totalValue.toLocaleString()}</div>
                    <div class="stat-label">Collection Value</div>
                </div>
            </div>

            <div class="admin-table-container">
                <table class="admin-table">
                    <thead>
                        <tr>
                            <th>Image</th>
                            <th>Piece Name</th>
                            <th>Category</th>
                            <th>Price</th>
                            <th>Stock</th>
                            <th>Sizes</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${products.length === 0 ? `
                            <tr>
                                <td colspan="7" style="text-align: center; padding: 4rem 2rem; color: var(--gray);">
                                    <div style="font-size: 3.5rem; margin-bottom: 1rem;">📦</div>
                                    <h3 style="color: var(--white); margin-bottom: 0.5rem; font-weight: 300;">Collection is Empty</h3>
                                    <p>Click "Introduce Piece" above to add your first masterpiece</p>
                                </td>
                            </tr>
                        ` : products.map(product => `
                            <tr>
                                <td>
                                    <div class="product-thumb">
                                        ${product.image 
                                            ? `<img src="${product.image}" alt="${product.name}">`
                                            : product.emoji || '👞'
                                        }
                                    </div>
                                </td>
                                <td><strong style="font-weight: 600;">${product.name}</strong></td>
                                <td><span class="product-category">${product.category}</span></td>
                                <td><strong style="color: var(--gold);">EGP ${product.price.toLocaleString()}</strong></td>
                                <td><span class="${getStockClass(product.stock)}">${product.stock} units</span></td>
                                <td>${product.sizes.length} sizes</td>
                                <td>
                                    <div class="table-actions">
                                        <button class="btn-icon btn-edit" onclick="openEditProductModal(${product.id})" title="Edit">✏️</button>
                                        <button class="btn-icon btn-delete" onclick="deleteProduct(${product.id})" title="Delete">🗑️</button>
                                    </div>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function setupAdminHandlers() {
}

function handleAdminLogout() {
    if (confirm('Are you certain you wish to exit the management portal?')) {
        setAuthToken(null);
        showToast('You have exited the portal securely.', 'success');
        navigate('home');
    }
}

function openAddProductModal() {
    editingProductId = null;
    selectedImageData = null;
    openModal(`
        <div class="modal-header">
            <h3>➕ Introduce New Piece</h3>
        </div>
        ${renderProductForm(null)}
    `);
    setupImageUpload();
}

function openEditProductModal(id) {
    const product = productsCache.find(p => p.id === id);
    if (!product) return;
    
    editingProductId = id;
    selectedImageData = product.image;
    
    openModal(`
        <div class="modal-header">
            <h3>✏️ Edit Piece — ${product.name}</h3>
        </div>
        ${renderProductForm(product)}
    `);
    setupImageUpload();
}

function renderProductForm(product) {
    const isEdit = product !== null;
    const data = product || {
        name: '',
        category: 'Formal',
        price: '',
        description: '',
        stock: '',
        sizes: [],
        image: null,
        emoji: '👞'
    };

    return `
        <form onsubmit="handleProductSubmit(event)" id="productForm">
            <div class="form-group">
                <label>Product Photography</label>
                <div class="image-upload-area" id="imageUploadArea">
                    ${selectedImageData 
                        ? `<img src="${selectedImageData}" class="preview-image" id="previewImg">`
                        : `
                            <div class="upload-icon">📸</div>
                            <p><strong>Click to upload</strong> or drag and drop imagery</p>
                            <p style="color: var(--gray); font-size: 0.85rem; margin-top: 0.5rem;">High resolution PNG, JPG, WEBP — Max 5MB</p>
                        `
                    }
                </div>
<input type="file" id="imageInput" accept="image/*" style="display: none;">
                ${selectedImageData ? `
                    <button type="button" id="imageRemoveBtn" class="btn btn-sm btn-danger" style="margin-top: 0.75rem;" onclick="removeImage()">Remove Photography</button>
                ` : ''}
            </div>
            
            <div class="form-group">
                <label>Piece Name *</label>
                <input type="text" id="productName" required value="${data.name}" placeholder="e.g. Sovereign Heritage Oxford">
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label>Collection *</label>
                    <select id="productCategory" required>
                        ${CATEGORIES.map(c => `<option value="${c}" ${data.category === c ? 'selected' : ''}>${c}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label>Price (EGP) *</label>
                    <input type="number" id="productPrice" required min="0" step="0.01" value="${data.price}" placeholder="3499">
                </div>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label>Stock Quantity *</label>
                    <input type="number" id="productStock" required min="0" value="${data.stock}" placeholder="25">
                </div>
                <div class="form-group">
                    <label>Display Icon</label>
                    <select id="productEmoji">
                        ${SHOE_EMOJIS.map((e, i) => `<option value="${e}" ${data.emoji === e ? 'selected' : ''}>${e}</option>`).join('')}
                    </select>
                </div>
            </div>
            
            <div class="form-group">
                <label>Available Sizes (EU)</label>
                <div class="sizes-input-group">
                    ${AVAILABLE_SIZES.map(size => `
                        <label class="size-checkbox">
                            <input type="checkbox" value="${size}" ${data.sizes.includes(size) ? 'checked' : ''}>
                            ${size}
                        </label>
                    `).join('')}
                </div>
            </div>
            
            <div class="form-group">
                <label>Description & Craft Notes *</label>
                <textarea id="productDescription" required rows="5" placeholder="Describe materials, craftsmanship, unique features...">${data.description}</textarea>
            </div>
            
            <div style="display: flex; gap: 1rem; justify-content: flex-end; margin-top: 2rem; flex-wrap: wrap;">
                <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                <button type="submit" id="productSubmitBtn" class="btn btn-primary">${isEdit ? 'Update Piece' : 'Add to Collection'}</button>
            </div>
        </form>
    `;
}

function setupImageUpload() {
    const uploadArea = document.getElementById('imageUploadArea');
    const fileInput = document.getElementById('imageInput');

    if (!uploadArea || !fileInput) return;

    uploadArea.addEventListener('click', () => fileInput.click());

    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });

    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('dragover');
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        if (e.dataTransfer.files.length > 0) {
            handleImageFile(e.dataTransfer.files[0]);
        }
    });

    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleImageFile(e.target.files[0]);
        }
    });
}

function updateImagePreview() {
    const uploadArea = document.getElementById('imageUploadArea');
    if (!uploadArea) return;

    if (selectedImageData) {
        uploadArea.innerHTML = `<img src="${selectedImageData}" class="preview-image" id="previewImg">`;
        let removeBtn = document.getElementById('imageRemoveBtn');
        if (!removeBtn) {
            removeBtn = document.createElement('button');
            removeBtn.type = 'button';
            removeBtn.id = 'imageRemoveBtn';
            removeBtn.className = 'btn btn-sm btn-danger';
            removeBtn.style.marginTop = '0.75rem';
            removeBtn.textContent = 'Remove Photography';
            removeBtn.onclick = removeImage;
            uploadArea.parentElement.appendChild(removeBtn);
        }
    } else {
        uploadArea.innerHTML = `
            <div class="upload-icon">📸</div>
            <p><strong>Click to upload</strong> or drag and drop imagery</p>
            <p style="color: var(--gray); font-size: 0.85rem; margin-top: 0.5rem;">High resolution PNG, JPG, WEBP — Max 5MB</p>
        `;
        const removeBtn = document.getElementById('imageRemoveBtn');
        if (removeBtn) removeBtn.remove();
    }
}

function handleImageFile(file) {
    if (!file.type.startsWith('image/')) {
        showToast('Please select a valid image file', 'error');
        return;
    }

    if (file.size > 5 * 1024 * 1024) {
        showToast('Image size must be less than 5MB', 'error');
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        selectedImageData = e.target.result;
        updateImagePreview();
    };
    reader.readAsDataURL(file);
}

function removeImage() {
    selectedImageData = null;
    updateImagePreview();
}

async function handleProductSubmit(e) {
    e.preventDefault();
    
    const name = document.getElementById('productName').value.trim();
    const category = document.getElementById('productCategory').value;
    const price = parseFloat(document.getElementById('productPrice').value);
    const stock = parseInt(document.getElementById('productStock').value);
    const description = document.getElementById('productDescription').value.trim();
    const emoji = document.getElementById('productEmoji').value;
    
    const sizeCheckboxes = document.querySelectorAll('.size-checkbox input[type="checkbox"]:checked');
    const sizes = Array.from(sizeCheckboxes).map(cb => cb.value);
    const submitBtn = document.getElementById('productSubmitBtn');
    const originalText = submitBtn.innerHTML;

    if (sizes.length === 0) {
        showToast('Please select at least one available size', 'error');
        return;
    }

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="loading-spinner" style="width: 16px; height: 16px; border-width: 2px; vertical-align: middle; margin-right: 0.5rem;"></span> Saving...';

    try {
        const payload = {
            name, category, price, stock, description, sizes,
            image: selectedImageData,
            emoji
        };

        let savedToServer = false;

        if (editingProductId) {
            try {
                await apiRequest(`/products/${editingProductId}`, {
                    method: 'PUT',
                    body: JSON.stringify(payload)
                });
                savedToServer = true;
            } catch (err) {
                // Server unreachable or static hosting — still apply the edit
                // to the in-memory catalog so the change is reflected now.
                console.warn('Server update failed, applying locally:', err);
            }
        } else {
            try {
                await apiRequest('/products', {
                    method: 'POST',
                    body: JSON.stringify(payload)
                });
                savedToServer = true;
            } catch (err) {
                // Server unreachable or static hosting — add locally only.
                console.warn('Server create failed, applying locally:', err);
            }
        }

        // Apply/refresh the local catalog regardless of server availability.
        await refreshProducts();

        if (!savedToServer) {
            // When the server is unreachable, the fallback in refreshProducts()
            // loads STATIC_PRODUCTS, which won't contain this edit. Apply the
            // change directly to the in-memory catalog so it is visible now.
            if (editingProductId) {
                const idx = productsCache.findIndex(p => p.id === editingProductId);
                if (idx !== -1) {
                    productsCache[idx] = { ...productsCache[idx], ...payload, id: editingProductId };
                } else {
                    productsCache.push({ id: editingProductId, ...payload, createdAt: new Date().toISOString() });
                }
            } else {
                const newId = productsCache.length > 0
                    ? Math.max(...productsCache.map(p => p.id)) + 1
                    : 1;
                productsCache.push({ id: newId, ...payload, createdAt: new Date().toISOString() });
            }
        }

        if (savedToServer) {
            showToast(editingProductId
                ? 'Piece updated successfully in the collection.'
                : 'New masterpiece introduced to the collection.', 'success');
        } else {
            showToast(editingProductId
                ? 'Piece updated for this session. The server was unreachable, so changes may not persist after a refresh.'
                : 'Piece added for this session. The server was unreachable, so changes may not persist after a refresh.', 'warning');
        }

        closeModal();
        render();
    } catch (err) {
        showToast(err.message || 'Failed to save. Please try again.', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    }
}

async function deleteProduct(id) {
    const product = productsCache.find(p => p.id === id);
    if (!product) return;

    if (confirm(`⚠️ Are you certain you wish to remove "${product.name}" from the collection?\nThis action cannot be reversed.`)) {
        try {
            await apiRequest(`/products/${id}`, { method: 'DELETE' });
            await refreshProducts();
            showToast('Piece removed from collection successfully.', 'success');
            render();
        } catch (err) {
            showToast(err.message || 'Failed to delete.', 'error');
        }
    }
}

function openModal(content) {
    const modal = document.getElementById('modal');
    document.getElementById('modalBody').innerHTML = content;
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    document.getElementById('modal').style.display = 'none';
    document.body.style.overflow = '';
    selectedImageData = null;
    editingProductId = null;
}

function showToast(message, type = 'success') {
    const existingToast = document.querySelector('.toast');
    if (existingToast) existingToast.remove();

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'slideIn 0.4s cubic-bezier(0.4, 0, 0.2, 1) reverse';
        setTimeout(() => toast.remove(), 400);
    }, 4000);
}

const EGYPT_GOVERNORATES = [
    'Suez'
];

const SHIPPING_FEES = {
    'Suez': 0, 'default': 0
};

const PAYMENT_METHODS = [
    {
        id: 'cod',
        name: 'Cash on Delivery',
        icon: '💵',
        desc: 'Pay in cash when your order arrives at your door (Suez delivery only)',
        fee: 0
    }
];

let cart = JSON.parse(localStorage.getItem('eldawly_cart') || '[]');
let selectedProductSize = null;
let checkoutData = {
    shipping: { governorate: '', city: '', address: '', name: '', phone: '', phone2: '', notes: '' },
    payment: 'cod'
};
let currentOrder = null;

function saveCart() {
    localStorage.setItem('eldawly_cart', JSON.stringify(cart));
    updateCartBadge();
}

function getCartCount() {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
}

function getCartSubtotal() {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
}

function getShippingFee(governorate) {
    if (!governorate) return 0;
    return SHIPPING_FEES[governorate] || SHIPPING_FEES['default'];
}

function getPaymentFee(methodId) {
    const method = PAYMENT_METHODS.find(m => m.id === methodId);
    return method ? method.fee : 0;
}

function updateCartBadge() {
    const count = getCartCount();
    const badges = document.querySelectorAll('.cart-badge');
    badges.forEach(badge => {
        if (count > 0) {
            badge.textContent = count;
            badge.style.display = 'flex';
        } else {
            badge.style.display = 'none';
        }
    });
}

function openCartSidebar() {
    document.getElementById('cartSidebar').classList.add('open');
    document.getElementById('cartOverlay').classList.add('open');
    document.body.style.overflow = 'hidden';
    renderCartItems();
}

function closeCartSidebar() {
    document.getElementById('cartSidebar').classList.remove('open');
    document.getElementById('cartOverlay').classList.remove('open');
    document.body.style.overflow = '';
}

function renderCartItems() {
    const container = document.getElementById('cartItemsContainer');
    const footer = document.getElementById('cartFooter');

    if (cart.length === 0) {
        container.innerHTML = `
            <div class="cart-empty">
                <div class="cart-empty-icon">🛒</div>
                <h4>Your Cart is Empty</h4>
                <p>Browse our collection and add items to your cart</p>
            </div>
        `;
        footer.style.display = 'none';
        return;
    }

    footer.style.display = 'block';
    container.innerHTML = cart.map(item => `
        <div class="cart-item">
            <div class="cart-item-image">
                ${item.image ? `<img src="${item.image}" alt="${item.name}">` : (item.emoji || '👞')}
            </div>
            <div class="cart-item-details">
                <h4>${item.name}</h4>
                <div class="cart-item-meta">
                    <span>Size: EU ${item.size}</span>
                    <span>Qty: ${item.quantity}</span>
                </div>
                <div class="cart-item-price">EGP ${(item.price * item.quantity).toLocaleString()}</div>
                <div class="quantity-controls">
                    <button class="quantity-btn" onclick="decreaseQuantity(${item.cartId})">−</button>
                    <span class="quantity-value">${item.quantity}</span>
                    <button class="quantity-btn" onclick="increaseQuantity(${item.cartId})">+</button>
                </div>
            </div>
            <button class="cart-item-remove" onclick="removeFromCart(${item.cartId})" title="Remove">✕</button>
        </div>
    `).join('');

    const subtotal = getCartSubtotal();
    document.getElementById('cartSubtotal').textContent = `EGP ${subtotal.toLocaleString()}`;
    document.getElementById('cartTotal').textContent = `EGP ${subtotal.toLocaleString()}`;
}

function addToCart(product, size, quantity = 1) {
    if (!size) {
        showToast('Please select a size first', 'error');
        return false;
    }
    if (product.stock <= 0) {
        showToast('This product is currently out of stock', 'error');
        return false;
    }

    const existingItem = cart.find(item => item.id === product.id && item.size === size);
    if (existingItem) {
        if (existingItem.quantity + quantity > product.stock) {
            showToast(`Only ${product.stock} units available in stock`, 'error');
            return false;
        }
        existingItem.quantity += quantity;
    } else {
        cart.push({
            cartId: Date.now(),
            id: product.id,
            name: product.name,
            price: product.price,
            image: product.image,
            emoji: product.emoji,
            size: size,
            quantity: quantity,
            category: product.category
        });
    }

    saveCart();
    renderCartItems();
    showToast(`${product.name} (Size ${size}) added to cart!`, 'success');
    return true;
}

function removeFromCart(cartId) {
    cart = cart.filter(item => item.cartId !== cartId);
    saveCart();
    renderCartItems();
    if (currentPage === 'checkout') {
        render();
    }
    showToast('Item removed from cart', 'success');
}

function increaseQuantity(cartId) {
    const item = cart.find(i => i.cartId === cartId);
    if (!item) return;
    const product = productsCache.find(p => p.id === item.id);
    if (product && item.quantity + 1 > product.stock) {
        showToast(`Only ${product.stock} units available`, 'error');
        return;
    }
    item.quantity++;
    saveCart();
    renderCartItems();
    if (currentPage === 'checkout') render();
}

function decreaseQuantity(cartId) {
    const item = cart.find(i => i.cartId === cartId);
    if (!item) return;
    if (item.quantity <= 1) {
        removeFromCart(cartId);
        return;
    }
    item.quantity--;
    saveCart();
    renderCartItems();
    if (currentPage === 'checkout') render();
}

function goToCheckout() {
    if (cart.length === 0) {
        showToast('Your cart is empty', 'error');
        return;
    }
    closeCartSidebar();
    navigate('checkout');
}

function renderCheckout() {
    if (cart.length === 0) {
        return `
            <section class="section">
                <div class="empty-state">
                    <div class="empty-state-icon">🛒</div>
                    <h3>Your Cart is Empty</h3>
                    <p>Please add items to your cart before checking out</p>
                    <br>
                    <a href="#products" onclick="navigate('products')" class="btn">Browse Collection</a>
                </div>
            </section>
        `;
    }

    const subtotal = getCartSubtotal();
    const shippingFee = getShippingFee(checkoutData.shipping.governorate);
    const paymentFee = getPaymentFee(checkoutData.payment);
    const total = subtotal + shippingFee + paymentFee;

    return `
        <div class="checkout-page">
            <div class="checkout-steps">
                <div class="checkout-step active">
                    <div class="step-number">1</div>
                    <div class="step-label">Shipping</div>
                </div>
                <div class="checkout-step active">
                    <div class="step-number">2</div>
                    <div class="step-label">Payment</div>
                </div>
                <div class="checkout-step">
                    <div class="step-number">3</div>
                    <div class="step-label">Review</div>
                </div>
            </div>

            <div class="checkout-grid">
                <div>
                    <div class="shipping-info-banner">
                        <span class="icon">🚚</span>
                        <div>
                            <strong style="color: var(--charcoal);">Suez City Delivery Only</strong><br>
                            Delivery within 1-2 business days within Suez. Cash on Delivery available — FREE delivery inside Suez.
                        </div>
                    </div>

                    <div class="checkout-section">
                        <h3 class="checkout-section-title">
                            <span class="icon">📍</span>
                            Shipping Information
                        </h3>
                        <form id="shippingForm" onsubmit="event.preventDefault();">
                            <div class="form-row">
                                <div class="form-group">
                                    <label>Full Name *</label>
                                    <input type="text" id="shipName" required placeholder="Your full name" value="${checkoutData.shipping.name}">
                                </div>
                                <div class="form-group">
                                    <label>Phone Number *</label>
                                    <input type="tel" id="shipPhone" required placeholder="010 0000 0000" value="${checkoutData.shipping.phone}">
                                </div>
                            </div>
                            <div class="form-row">
                                <div class="form-group">
                                    <label>Governorate *</label>
                                    <select id="shipGovernorate" required onchange="updateShippingFee()">
                                        <option value="">Select governorate</option>
                                        ${EGYPT_GOVERNORATES.map(g => `<option value="${g}" ${checkoutData.shipping.governorate === g ? 'selected' : ''}>${g}</option>`).join('')}
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label>City / District *</label>
                                    <input type="text" id="shipCity" required placeholder="City or district name" value="${checkoutData.shipping.city}">
                                </div>
                            </div>
                            <div class="form-group">
                                <label>Full Address *</label>
                                <textarea id="shipAddress" required rows="3" placeholder="Street name, building number, apartment, floor, nearby landmark...">${checkoutData.shipping.address}</textarea>
                            </div>
                            <div class="form-row">
                                <div class="form-group">
                                    <label>Alternative Phone</label>
                                    <input type="tel" id="shipPhone2" placeholder="Another contact number" value="${checkoutData.shipping.phone2}">
                                </div>
                                <div class="form-group">
                                    <label>Delivery Notes</label>
                                    <input type="text" id="shipNotes" placeholder="Optional: special instructions" value="${checkoutData.shipping.notes}">
                                </div>
                            </div>
                        </form>
                    </div>

                    <div class="checkout-section">
                        <h3 class="checkout-section-title">
                            <span class="icon">💳</span>
                            Payment Method
                        </h3>
                        <div class="payment-methods">
                            ${PAYMENT_METHODS.map(method => `
                                <label class="payment-method ${checkoutData.payment === method.id ? 'selected' : ''}" onclick="selectPayment('${method.id}')">
                                    <input type="radio" name="payment" value="${method.id}" ${checkoutData.payment === method.id ? 'checked' : ''}>
                                    <div class="payment-radio"></div>
                                    <div class="payment-method-info">
                                        <div class="payment-method-name">
                                            <span class="payment-method-icon">${method.icon}</span>
                                            ${method.name}
                                        </div>
                                        <div class="payment-method-desc">${method.desc}</div>
                                    </div>
                                    <div class="payment-fee">
                                        ${method.fee === 0 ? 'Free' : `+EGP ${method.fee}`}
                                    </div>
                                </label>
                            `).join('')}
                        </div>
                    </div>

                    ${checkoutData.payment !== 'cod' ? `
                        <div class="checkout-section">
                            <h3 class="checkout-section-title">
                                <span class="icon">🔐</span>
                                Payment Details
                            </h3>
                            ${renderPaymentDetailsSection(checkoutData.payment)}
                        </div>
                    ` : ''}
                </div>

                <div>
                    <div class="order-summary-box">
                        <h3 class="order-summary-title">Order Summary</h3>
                        <div class="summary-items">
                            ${cart.map(item => `
                                <div class="summary-item">
                                    <div class="summary-item-img">
                                        ${item.image ? `<img src="${item.image}" alt="${item.name}">` : (item.emoji || '👞')}
                                    </div>
                                    <div class="summary-item-info">
                                        <div class="summary-item-name">${item.name}</div>
                                        <div class="summary-item-meta">
                                            Size ${item.size} <span class="summary-item-qty">×${item.quantity}</span>
                                        </div>
                                    </div>
                                    <div class="summary-item-price">EGP ${(item.price * item.quantity).toLocaleString()}</div>
                                </div>
                            `).join('')}
                        </div>
                        <div class="summary-divider"></div>
                        <div class="summary-row">
                            <span>Items (${getCartCount()})</span>
                            <span class="value">EGP ${subtotal.toLocaleString()}</span>
                        </div>
                        <div class="summary-row">
                            <span>Shipping ${checkoutData.shipping.governorate ? `(${checkoutData.shipping.governorate})` : ''}</span>
                            <span class="value">${checkoutData.shipping.governorate ? `EGP ${shippingFee.toLocaleString()}` : 'Select governorate'}</span>
                        </div>
                        <div class="summary-row">
                            <span>Payment Fee (${PAYMENT_METHODS.find(m => m.id === checkoutData.payment)?.name || ''})</span>
                            <span class="value">${paymentFee === 0 ? 'Free' : `EGP ${paymentFee.toLocaleString()}`}</span>
                        </div>
                        <div class="summary-row grand-total">
                            <span>Total</span>
                            <span class="value">EGP ${total.toLocaleString()}</span>
                        </div>
                        <button class="btn btn-block btn-lg" style="margin-top: 1.5rem;" onclick="placeOrder()">
                            💰 Place Order (EGP ${total.toLocaleString()})
                        </button>
                        <p style="text-align: center; margin-top: 1rem; font-size: 0.8rem; color: var(--premium-grey-5);">
                            🔒 By placing this order you agree to our Terms & Privacy Policy
                        </p>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function renderPaymentDetailsSection(method) {
    switch (method) {
        case 'card':
            return `
                <div class="form-row">
                    <div class="form-group">
                        <label>Card Number *</label>
                        <input type="text" placeholder="1234 5678 9012 3456" maxlength="19" style="letter-spacing: 2px;">
                    </div>
                    <div class="form-group">
                        <label>Cardholder Name *</label>
                        <input type="text" placeholder="Name on card">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Expiry Date *</label>
                        <input type="text" placeholder="MM / YY" maxlength="7">
                    </div>
                    <div class="form-group">
                        <label>CVV *</label>
                        <input type="text" placeholder="•••" maxlength="4" style="letter-spacing: 3px;">
                    </div>
                </div>
                <div class="shipping-info-banner" style="background: rgba(46, 125, 50, 0.06); border-color: rgba(46, 125, 50, 0.2);">
                    <span class="icon" style="color: #2E7D32;">🔒</span>
                    <div>
                        <strong style="color: var(--charcoal);">100% Secure Payment</strong><br>
                        Your card details are encrypted using industry-standard SSL protection.
                    </div>
                </div>
            `;
        case 'vodafone':
        case 'orange':
        case 'etisalat':
            const walletName = method === 'vodafone' ? 'Vodafone Cash' : method === 'orange' ? 'Orange Money' : 'Etisalat Cash';
            const walletNum = method === 'vodafone' ? '010 1234 5678' : method === 'orange' ? '012 1234 5678' : '011 1234 5678';
            return `
                <div class="form-group">
                    <label>Your ${walletName} Number *</label>
                    <input type="tel" placeholder="010 0000 0000">
                </div>
                <div class="shipping-info-banner" style="background: rgba(184, 134, 11, 0.06); border-color: rgba(184, 134, 11, 0.2);">
                    <span class="icon">💡</span>
                    <div>
                        <strong style="color: var(--charcoal);">How it works:</strong><br>
                        1. Place your order &amp; we'll send a payment request to your number<br>
                        2. Confirm the payment through your wallet app<br>
                        3. Order is processed immediately after successful payment<br>
                        <small style="opacity: 0.7;">Our ${walletName} number: <strong>${walletNum}</strong></small>
                    </div>
                </div>
            `;
        case 'fawry':
            return `
                <div class="shipping-info-banner" style="background: rgba(184, 134, 11, 0.06); border-color: rgba(184, 134, 11, 0.2);">
                    <span class="icon">💡</span>
                    <div>
                        <strong style="color: var(--charcoal);">How it works:</strong><br>
                        1. Place your order - you will receive a unique Fawry reference code<br>
                        2. Go to any Fawry location, ATM, or convenience store<br>
                        3. Provide the reference code and pay the order amount<br>
                        4. We will confirm your order within 1 hour of payment
                    </div>
                </div>
            `;
        default:
            return '';
    }
}

function selectPayment(methodId) {
    checkoutData.payment = methodId;
    render();
}

function updateShippingFee() {
    const gov = document.getElementById('shipGovernorate')?.value || '';
    checkoutData.shipping.governorate = gov;
    render();
}

function collectShippingData() {
    checkoutData.shipping.name = document.getElementById('shipName')?.value || '';
    checkoutData.shipping.phone = document.getElementById('shipPhone')?.value || '';
    checkoutData.shipping.governorate = document.getElementById('shipGovernorate')?.value || '';
    checkoutData.shipping.city = document.getElementById('shipCity')?.value || '';
    checkoutData.shipping.address = document.getElementById('shipAddress')?.value || '';
    checkoutData.shipping.phone2 = document.getElementById('shipPhone2')?.value || '';
    checkoutData.shipping.notes = document.getElementById('shipNotes')?.value || '';
}

function validateShippingData() {
    const { name, phone, governorate, city, address } = checkoutData.shipping;
    if (!name || !phone || !governorate || !city || !address) {
        return false;
    }
    if (phone.replace(/\D/g, '').length < 10) {
        return false;
    }
    if (governorate !== 'Suez') {
        showToast('⚠️ We currently deliver only within Suez governorate', 'error');
        return false;
    }
    return true;
}

async function placeOrder() {
    collectShippingData();

    if (!validateShippingData()) {
        showToast('Please fill in all required shipping fields correctly', 'error');
        document.getElementById('shipName')?.focus();
        return;
    }

    if (cart.length === 0) {
        showToast('Your cart is empty', 'error');
        return;
    }

    const subtotal = getCartSubtotal();
    const shippingFee = getShippingFee(checkoutData.shipping.governorate);
    const paymentFee = getPaymentFee(checkoutData.payment);
    const total = subtotal + shippingFee + paymentFee;

    const orderData = {
        orderNumber: 'ELD-' + Date.now().toString().slice(-8),
        items: [...cart],
        subtotal,
        shippingFee,
        paymentFee,
        total,
        shipping: { ...checkoutData.shipping },
        paymentMethod: checkoutData.payment,
        paymentMethodName: PAYMENT_METHODS.find(m => m.id === checkoutData.payment)?.name || '',
        status: checkoutData.payment === 'cod' ? 'pending_cod' : 'pending_payment',
        createdAt: new Date().toISOString()
    };

// Try the backend API first. If it fails (static hosting without a
    // server), fall back to delivering the order via WhatsApp so the
    // purchase is never lost.
    let apiSuccess = false;
    try {
        await apiRequest('/orders', {
            method: 'POST',
            body: JSON.stringify(orderData)
        });
        apiSuccess = true;
    } catch (err) {
        console.warn('Order API failed — using WhatsApp fallback:', err);
    }

    // Save the placed order regardless of delivery path
    currentOrder = orderData;
    cart = [];
    saveCart();
    checkoutData = {
        shipping: { governorate: '', city: '', address: '', name: '', phone: '', phone2: '', notes: '' },
        payment: 'cod'
    };
    selectedProductSize = null;

    // Notify the store via WhatsApp (non-blocking; never blocks success).
    try {
        sendWhatsAppOrder(orderData, apiSuccess || orderData.paymentMethod === 'cod');
    } catch (waErr) {
        console.warn('WhatsApp notification failed (order still placed):', waErr);
    }

    navigate('thank-you');
}

async function sendWhatsAppOrder(order, shouldNotify) {
    if (!shouldNotify) return;
    const itemsList = order.items.map((item, i) =>
        `${i + 1}. ${item.name} (Size ${item.size}) × ${item.quantity} - EGP ${(item.price * item.quantity).toLocaleString()}`
    ).join('\n');

    const text = encodeURIComponent(
        `🛍️ *NEW ORDER RECEIVED* 🛍️\n\n` +
        `📦 Order Number: *${order.orderNumber}*\n` +
        `📅 Date: ${new Date(order.createdAt).toLocaleString('en-EG')}\n\n` +
        `👤 *Customer Details:*\n` +
        `   Name: ${order.shipping.name}\n` +
        `   Phone: ${order.shipping.phone}\n` +
        `   Alt. Phone: ${order.shipping.phone2 || 'N/A'}\n\n` +
        `📍 *Delivery Address:*\n` +
        `   Governorate: ${order.shipping.governorate}\n` +
        `   City/District: ${order.shipping.city}\n` +
        `   Address: ${order.shipping.address}\n` +
        `   Notes: ${order.shipping.notes || 'None'}\n\n` +
        `🛒 *Order Items:*\n${itemsList}\n\n` +
        `💰 *Order Summary:*\n` +
        `   Subtotal: EGP ${order.subtotal.toLocaleString()}\n` +
        `   Shipping (${order.shipping.governorate}): EGP ${order.shippingFee.toLocaleString()}\n` +
        `   Payment Fee (${order.paymentMethodName}): EGP ${order.paymentFee.toLocaleString()}\n` +
        `   ⭐ TOTAL: *EGP ${order.total.toLocaleString()}*\n\n` +
        `💳 Payment Method: *${order.paymentMethodName}*\n\n` +
        `— From AL Dawly Website ✨`
    );

const waUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${text}`;

    // Attempt 1: open in a new tab.
    let opened = false;
    try {
        const win = window.open(waUrl, '_blank');
        opened = !!win;
    } catch (e) {
        opened = false;
    }

    // Attempt 2 (fallback): if the popup was blocked, navigate so the order
    // is still delivered.
    if (!opened) {
        setTimeout(() => {
            try {
                window.location.href = waUrl;
            } catch (e) {}
        }, 400);
    }
}

function renderThankYou() {
    if (!currentOrder) {
        return `
            <section class="section">
                <div class="empty-state">
                    <div class="empty-state-icon">📋</div>
                    <h3>No Order Found</h3>
                    <p>Your order details are no longer available or the page was refreshed</p>
                    <br>
                    <a href="#home" onclick="navigate('home')" class="btn">Back to Home</a>
                </div>
            </section>
        `;
    }

    const order = currentOrder;
    return `
        <div class="thank-you-page">
            <div class="success-icon">✓</div>
            <h1>Order Placed Successfully!</h1>
            <p class="subtitle">Thank you for choosing AL Dawly. We'll process your order immediately.</p>

            <div class="order-details-box">
                <div class="order-number">ORDER: ${order.orderNumber}</div>

                <div style="font-size: 1.1rem; font-weight: 600; margin-bottom: 0.5rem; color: var(--charcoal);">
                    📦 What happens next?
                </div>
<div style="color: var(--premium-grey-5); line-height: 1.9; margin-bottom: 1.5rem;">
                    ${order.paymentMethod === 'cod'
                        ? `✅ Your order is confirmed. Our team will call you on <strong>${order.shipping.phone}</strong> within 24 hours to confirm. Delivery within 1-2 business days in Suez.`
                        : `⏳ Order placed! We'll contact you shortly to confirm the ${order.paymentMethodName} payment details. Once payment is confirmed, your order will be delivered within Suez in 1-2 days.`
                    }
                </div>

                <div class="summary-divider"></div>

                <div class="order-detail-grid">
                    <div class="order-detail-item">
                        <div class="label">Customer Name</div>
                        <div class="value">${order.shipping.name}</div>
                    </div>
                    <div class="order-detail-item">
                        <div class="label">Phone Number</div>
                        <div class="value">${order.shipping.phone}</div>
                    </div>
                    <div class="order-detail-item">
                        <div class="label">Governorate</div>
                        <div class="value">${order.shipping.governorate}</div>
                    </div>
                    <div class="order-detail-item">
                        <div class="label">City / District</div>
                        <div class="value">${order.shipping.city}</div>
                    </div>
                    <div class="order-detail-item" style="grid-column: span 2;">
                        <div class="label">Delivery Address</div>
                        <div class="value">${order.shipping.address}</div>
                    </div>
                    <div class="order-detail-item">
                        <div class="label">Payment Method</div>
                        <div class="value">${order.paymentMethodName}</div>
                    </div>
                    <div class="order-detail-item">
                        <div class="label">Grand Total</div>
                        <div class="value" style="color: var(--gold); font-size: 1.1rem;">
                            EGP ${order.total.toLocaleString()}
                        </div>
                    </div>
                </div>

                <div class="summary-divider"></div>

                <div style="font-weight: 600; margin-bottom: 0.75rem; color: var(--charcoal);">🛒 Items Ordered:</div>
                <div style="color: var(--premium-grey-5);">
                    ${order.items.map(item => `
                        <div style="display: flex; justify-content: space-between; padding: 0.4rem 0; border-bottom: 1px solid var(--premium-grey-2);">
                            <span>${item.name} (Size ${item.size}) × ${item.quantity}</span>
                            <span style="font-weight: 600; color: var(--charcoal);">EGP ${(item.price * item.quantity).toLocaleString()}</span>
                        </div>
                    `).join('')}
                </div>
            </div>

            <div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;">
                <a href="#products" onclick="navigate('products')" class="btn btn-secondary btn-lg">Continue Shopping</a>
                <a href="tel:${order.shipping.phone.startsWith('0') ? '+2' + order.shipping.phone : order.shipping.phone}" class="btn btn-lg">
                    📞 Call ${order.shipping.phone}
                </a>
            </div>
        </div>
    `;
}

const origRender = render;
render = async function() {
    const app = document.getElementById('app');
    const hash = window.location.hash.slice(1);

    if (hash === 'checkout') {
        currentPage = 'checkout';
        app.innerHTML = renderCheckout();
        updateCartBadge();
        document.getElementById('navMenu').classList.remove('active');
        return;
    }

    if (hash === 'thank-you') {
        currentPage = 'thank-you';
        app.innerHTML = renderThankYou();
        updateCartBadge();
        document.getElementById('navMenu').classList.remove('active');
        return;
    }

    return origRender();
};

const origNavigate = navigate;
navigate = function(page) {
    if (page === 'checkout' || page === 'thank-you') {
        currentPage = page;
        window.location.hash = page;
        document.getElementById('navMenu').classList.remove('active');
        render();
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
    }
    return origNavigate(page);
};

const origProductDetail = renderProductDetail;
renderProductDetail = function(product) {
    if (!product) return origProductDetail(product);

    return `
        <section class="section">
            <a href="#products" onclick="navigate('products'); return false;" class="back-link">← Back to Collection</a>
            
            <div class="product-detail">
                <div class="product-detail-image">
                    ${product.image 
                        ? `<img src="${product.image}" alt="${product.name}">`
                        : product.emoji || '👞'
                    }
                </div>
                <div class="product-detail-info">
                    <span class="product-category">${product.category} Collection</span>
                    <h1>${product.name}</h1>
                    <div class="product-detail-price">EGP ${product.price.toLocaleString()}</div>
                    
                    <div class="product-detail-section">
                        <h3>Availability</h3>
                        <span class="product-stock ${getStockClass(product.stock)}" style="font-size: 1.1rem;">
                            ${getStockText(product.stock)}
                        </span>
                    </div>

                    <div class="product-detail-section">
                        <h3>Select Your Size (EU)</h3>
                        <div class="sizes-grid" id="sizeSelectGrid">
                            ${AVAILABLE_SIZES.map(size => `
                                <div class="size-tag ${product.sizes.includes(size) ? '' : 'unavailable'}"
                                     data-size="${size}"
                                     onclick="${product.sizes.includes(size) ? `selectSize('${size}')` : ''}">
                                    ${size}
                                </div>
                            `).join('')}
                        </div>
                    </div>

                    <div class="product-detail-section">
                        <h3>The Craft</h3>
                        <p class="product-description">${product.description}</p>
                    </div>

                    <div style="margin-top: 2rem; display: flex; gap: 1rem; flex-wrap: wrap;">
                        ${product.stock > 0 
                            ? `
                                <button class="btn btn-lg btn-primary add-to-cart-btn" onclick="handleAddToCartFromDetail(${product.id})">
                                    🛒 Add to Cart
                                </button>
                                <button class="btn btn-lg btn-secondary" onclick="buyNowFromDetail(${product.id})">
                                    💳 Buy Now
                                </button>
                            `
                            : `<button class="btn btn-lg" disabled style="background: var(--premium-grey-2); cursor: not-allowed; color: var(--premium-grey-5);">Sold Out</button>`
                        }
                        <a href="${getWhatsAppURL(product)}" target="_blank" rel="noopener noreferrer" class="btn btn-lg btn-outline">
                            💬 WhatsApp
                        </a>
                    </div>
                </div>
            </div>
        </section>
    `;
};

function selectSize(size) {
    selectedProductSize = size;
    document.querySelectorAll('.size-tag').forEach(tag => {
        tag.classList.remove('selected');
        if (tag.dataset.size === size) {
            tag.classList.add('selected');
        }
    });
}

async function handleAddToCartFromDetail(productId) {
    const products = productsCache.length > 0 ? productsCache : await loadProducts();
    const product = products.find(p => p.id === productId);
    if (!product) return;
    if (!selectedProductSize) {
        showToast('Please select your shoe size first', 'error');
        return;
    }
    if (addToCart(product, selectedProductSize, 1)) {
        setTimeout(() => openCartSidebar(), 500);
    }
}

async function buyNowFromDetail(productId) {
    const products = productsCache.length > 0 ? productsCache : await loadProducts();
    const product = products.find(p => p.id === productId);
    if (!product) return;
    if (!selectedProductSize) {
        showToast('Please select your shoe size first', 'error');
        return;
    }
    if (addToCart(product, selectedProductSize, 1)) {
        setTimeout(() => goToCheckout(), 300);
    }
}

function setupSizeHandlers() {
    document.querySelectorAll('.size-tag:not(.unavailable)').forEach(tag => {
        tag.addEventListener('click', () => selectSize(tag.dataset.size));
    });
}

const origRenderCall = render;
document.addEventListener('DOMContentLoaded', () => {
    updateCartBadge();
    setTimeout(setupSizeHandlers, 200);
});

const origProductsWithData = renderProductsWithData;
renderProductsWithData = function(products) {
    origProductsWithData(products);
    setupQuickAddButtons();
};

function setupQuickAddButtons() {
    const cards = document.querySelectorAll('.product-card');
    cards.forEach((card, index) => {
        if (index < productsCache.length) {
            const product = productsCache[index];
            const infoDiv = card.querySelector('.product-info');
            if (product.stock > 0 && infoDiv && !infoDiv.querySelector('.quick-add-btn')) {
                const btn = document.createElement('button');
                btn.className = 'btn btn-sm btn-accent quick-add-btn';
                btn.style.cssText = 'margin-top: 0.75rem; width: 100%;';
                btn.innerHTML = '🛒 Quick Add';
                btn.onclick = async (e) => {
                    e.stopPropagation();
                    viewProduct(product.id);
                    setTimeout(() => {
                        showToast('👆 Please select your size on the product page', 'success');
                    }, 300);
                };
                infoDiv.appendChild(btn);
            }
        }
    });
}

const origRenderHome = renderHome;
renderHome = function(featuredProducts) {
    const html = origRenderHome(featuredProducts);
    setTimeout(() => {
        setupQuickAddButtons();
        if (window.Logo3D && typeof window.Logo3D.cleanup === 'function') {
            window.Logo3D.cleanup();
        }
        if (window.Logo3D && typeof window.Logo3D.init === 'function') {
            window.Logo3D.init();
        }
        if (window.EarthGlobe && typeof window.EarthGlobe.cleanup === 'function') {
            window.EarthGlobe.cleanup();
            window.EarthGlobe.init();
        }
    }, 100);
    return html;
};

window.addEventListener('hashchange', render);

window.addEventListener('click', (e) => {
    const modal = document.getElementById('modal');
    if (e.target === modal) {
        closeModal();
    }
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeModal();
        closeCartSidebar();
    }
});

document.addEventListener('click', (e) => {
    if (e.target.closest('[data-size]')) {
        const size = e.target.closest('[data-size]').dataset.size;
        if (size && document.getElementById('sizeSelectGrid')) {
            selectSize(size);
        }
    }
});

updateCartBadge();
render();

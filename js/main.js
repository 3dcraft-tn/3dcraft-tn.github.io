/* ========================================
   3D CRAFT - Main JavaScript
   ======================================== */

// ==========================================
// Product Data Store (localStorage-based)
// ==========================================
const ProductStore = {
  STORAGE_KEY: '3dcraft_products',

  async loadRemote() {
    // 1. Try real-time GitHub API (instant, no cache)
    try {
      const apiRes = await fetch('https://api.github.com/repos/3dcraft-tn/3dcraft-tn.github.io/contents/data/products.json', {
        headers: { 'Accept': 'application/vnd.github.v3+json' }
      });
      if (apiRes.ok) {
        const data = await apiRes.json();
        if (data && data.content) {
          const decoded = decodeURIComponent(escape(atob(data.content.replace(/\s/g, ''))));
          const list = JSON.parse(decoded);
          if (Array.isArray(list) && list.length > 0) {
            this.save(list);
            return list;
          }
        }
      }
    } catch(e) {
      console.warn('API fetch fallback to raw', e);
    }

    // 2. Fallback to raw.githubusercontent.com
    try {
      const url = 'https://raw.githubusercontent.com/3dcraft-tn/3dcraft-tn.github.io/main/data/products.json?t=' + Date.now();
      const res = await fetch(url);
      if (res.ok) {
        const remote = await res.json();
        if (Array.isArray(remote) && remote.length > 0) {
          this.save(remote);
          return remote;
        }
      }
    } catch(e) {
      console.log('Using local store fallback');
    }
    return this.getAll();
  },

  getAll() {
    const data = localStorage.getItem(this.STORAGE_KEY);
    return data ? JSON.parse(data) : this.getDefaultProducts();
  },

  save(products) {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(products));
  },

  add(product) {
    const products = this.getAll();
    product.id = Date.now().toString();
    product.createdAt = new Date().toISOString();
    products.push(product);
    this.save(products);
    return product;
  },

  update(id, updatedData) {
    const products = this.getAll();
    const index = products.findIndex(p => p.id === id);
    if (index !== -1) {
      products[index] = { ...products[index], ...updatedData };
      this.save(products);
      return products[index];
    }
    return null;
  },

  delete(id) {
    const products = this.getAll().filter(p => p.id !== id);
    this.save(products);
  },

  getByCategory(category) {
    return this.getAll().filter(p => p.category === category);
  },

  getFeatured() {
    return this.getAll().filter(p => p.featured);
  },

  getDefaultProducts() {
    const defaults = [
      {
        id: '1',
        name: 'Dragon Bookend Set',
        category: 'home-decor',
        price: 45,
        description: 'Beautifully detailed dragon bookend pair, 3D printed with premium PLA filament.',
        image: '',
        badge: 'popular',
        featured: true,
        createdAt: '2026-01-01'
      },
      {
        id: '2',
        name: 'Gaming Controller Stand',
        category: 'gaming',
        price: 28,
        description: 'Sleek controller holder for PS5/Xbox. Keeps your desk organized in style.',
        image: '',
        badge: 'new',
        featured: true,
        createdAt: '2026-01-02'
      },
      {
        id: '3',
        name: 'Anime Figure - Warrior',
        category: 'anime',
        price: 65,
        description: 'High-detail anime warrior figure, hand-painted with fine details.',
        image: '',
        badge: '',
        featured: true,
        createdAt: '2026-01-03'
      },
      {
        id: '4',
        name: 'Articulated Robot Toy',
        category: 'toys',
        price: 22,
        description: 'Fully articulated robot toy with movable joints, print-in-place design.',
        image: '',
        badge: 'new',
        featured: true,
        createdAt: '2026-01-04'
      },
      {
        id: '5',
        name: 'Custom Phone Stand',
        category: 'accessories',
        price: 18,
        description: 'Adjustable phone stand with cable management, customizable design.',
        image: '',
        badge: '',
        featured: true,
        createdAt: '2026-01-05'
      },
      {
        id: '6',
        name: 'Geometric Vase Set',
        category: 'home-decor',
        price: 35,
        description: 'Modern geometric vases in a set of 3, perfect for minimalist decor.',
        image: '',
        badge: 'sale',
        featured: true,
        createdAt: '2026-01-06'
      },
      {
        id: '7',
        name: 'Headphone Wall Mount',
        category: 'gaming',
        price: 15,
        description: 'Wall-mounted headphone holder with cable hook. Sleek gaming setup accessory.',
        image: '',
        badge: '',
        featured: false,
        createdAt: '2026-01-07'
      },
      {
        id: '8',
        name: 'Chibi Character Set',
        category: 'anime',
        price: 42,
        description: 'Adorable chibi-style character set of 4, perfect for your desk collection.',
        image: '',
        badge: 'popular',
        featured: false,
        createdAt: '2026-01-08'
      },
      {
        id: '9',
        name: 'Flexi Rex Dinosaur',
        category: 'toys',
        price: 12,
        description: 'Fun flexible dinosaur toy, print-in-place with no assembly required.',
        image: '',
        badge: '',
        featured: false,
        createdAt: '2026-01-09'
      },
      {
        id: '10',
        name: 'Cable Organizer Set',
        category: 'accessories',
        price: 10,
        description: 'Desk cable organizer clips set of 6, keep your workspace tidy.',
        image: '',
        badge: '',
        featured: false,
        createdAt: '2026-01-10'
      },
      {
        id: '11',
        name: 'Moon Lamp Night Light',
        category: 'home-decor',
        price: 55,
        description: 'Lithophane moon lamp with LED base, creates stunning ambient lighting.',
        image: '',
        badge: 'new',
        featured: true,
        createdAt: '2026-01-11'
      },
      {
        id: '12',
        name: 'Keyboard Keycap Set',
        category: 'gaming',
        price: 32,
        description: 'Custom artisan keycaps for mechanical keyboards, unique 3D designs.',
        image: '',
        badge: '',
        featured: true,
        createdAt: '2026-01-12'
      }
    ];
    this.save(defaults);
    return defaults;
  }
};

// ==========================================
// Category Data
// ==========================================
const Categories = {
  'home-decor': {
    name: 'Home Decor',
    icon: '🏠',
    description: 'Beautiful 3D printed pieces to elevate your living space',
    page: 'pages/home-decor.html'
  },
  'gaming': {
    name: 'Gaming',
    icon: '🎮',
    description: 'Level up your gaming setup with custom 3D accessories',
    page: 'pages/gaming.html'
  },
  'anime': {
    name: 'Anime & Figures',
    icon: '⚔️',
    description: 'Detailed anime figures and collectible characters',
    page: 'pages/anime.html'
  },
  'toys': {
    name: 'Toys & Fun',
    icon: '🧸',
    description: 'Playful 3D printed toys for all ages',
    page: 'pages/toys.html'
  },
  'accessories': {
    name: 'Accessories',
    icon: '🎧',
    description: 'Practical and stylish everyday accessories',
    page: 'pages/accessories.html'
  },
  'tools': {
    name: 'Tools & DIY',
    icon: '🔧',
    description: 'Practical workshop organizers, jigs and measurement gauges',
    page: 'pages/tools.html'
  },
  'gifts': {
    name: 'Gifts & Specials',
    icon: '🎁',
    description: 'Personalized lithophanes, cryptex and unique surprise gifts',
    page: 'pages/gifts.html'
  },
  'keychains': {
    name: 'Custom Keychains',
    icon: '🔑',
    description: 'Custom name, car logo and Spotify scannable keychains',
    page: 'pages/keychains.html'
  }
};

// ==========================================
// Emoji icons for products (placeholder images)
// ==========================================
const CategoryEmojis = {
  'home-decor': ['🏺', '🕯️', '🪴', '🖼️', '🏠', '💡'],
  'gaming': ['🎮', '🕹️', '🎯', '🏆', '⌨️', '🖱️'],
  'anime': ['⚔️', '🗡️', '🛡️', '🎭', '🌸', '🐉'],
  'toys': ['🧸', '🤖', '🦕', '🚀', '🎪', '🎨'],
  'accessories': ['🎧', '📱', '⌚', '💼', '🧲', '📎'],
  'tools': ['🔧', '🛠️', '📐', '⚙️', '📏', '🗜️'],
  'gifts': ['🎁', '💝', '✨', '🎀', '💎', '🎉'],
  'keychains': ['🔑', '🏷️', '🚗', '🎵', '🏍️', '🔖']
};

// ==========================================
// Utility Functions
// ==========================================
function getProductEmoji(category, index = 0) {
  const emojis = CategoryEmojis[category] || ['📦'];
  return emojis[index % emojis.length];
}

function formatPrice(price) {
  return parseFloat(price).toFixed(2);
}

function getBadgeClass(badge) {
  switch(badge) {
    case 'new': return 'badge-new';
    case 'sale': return 'badge-sale';
    case 'popular': return 'badge-popular';
    default: return '';
  }
}

function getBadgeText(badge) {
  switch(badge) {
    case 'new': return '✨ New';
    case 'sale': return '🔥 Sale';
    case 'popular': return '⭐ Popular';
    default: return '';
  }
}

// ==========================================
// Render Product Card
// ==========================================
function renderProductCard(product, index = 0) {
  const emoji = getProductEmoji ? getProductEmoji(product.category, index) : '📦';
  const badgeHtml = product.badge
    ? `<span class="badge ${getBadgeClass ? getBadgeClass(product.badge) : ''}">${getBadgeText ? getBadgeText(product.badge) : product.badge}</span>`
    : '';

  return `
    <div class="product-card reveal" data-id="${product.id}" onclick="openProductModal('${product.id}')" style="cursor:pointer;" title="Cliquer pour voir les détails et commander">
      <div class="product-image">
        ${product.image
          ? `<img src="${product.image}" alt="${product.name}">`
          : `<span class="product-placeholder">${emoji}</span>`
        }
        ${badgeHtml ? `<div class="product-badge">${badgeHtml}</div>` : ''}
        <button class="quick-view" title="Voir Détails" onclick="event.stopPropagation(); openProductModal('${product.id}')">👁️</button>
      </div>
      <div class="product-info">
        <div class="product-category">${(typeof Categories !== 'undefined' && Categories[product.category]?.name) || product.category}</div>
        <h3 class="product-name">${product.name}</h3>
        <p class="product-description">${product.description || ''}</p>
        <div class="product-footer">
          <span class="product-price">${parseFloat(product.price).toFixed(2)} <span class="currency">TND</span></span>
          <button class="btn btn-sm btn-primary order-btn" onclick="event.stopPropagation(); openProductModal('${product.id}')">🛒 Commander</button>
        </div>
      </div>
    </div>
  `;
}

// ==========================================
// Render Products Grid
// ==========================================
function renderProductsGrid(containerId, products) {
  const container = document.getElementById(containerId);
  if (!container) return;

  if (products.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1;">
        <div class="empty-icon">📦</div>
        <h3>No products yet</h3>
        <p>New items are being crafted. Check back soon!</p>
      </div>
    `;
    return;
  }

  container.innerHTML = products.map((p, i) => renderProductCard(p, i)).join('');
  observeRevealElements();
}

// ==========================================
// WhatsApp Order
// ==========================================
function orderProduct(name, price) {
  const phone = '21646595833'; // WhatsApp: +216 46 595 833
  const message = encodeURIComponent(
    `Bonjour! 👋\nJe suis intéressé(e) par:\n\n📦 Produit: ${name}\n💰 Prix: ${price} TND\n\nEst-ce disponible?`
  );
  window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
}

// ==========================================
// Navbar Scroll Effect
// ==========================================
function initNavbar() {
  const navbar = document.querySelector('.navbar');
  if (!navbar) return;

  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  });

  // Mobile menu toggle
  const hamburger = document.querySelector('.nav-hamburger');
  const navLinks = document.querySelector('.nav-links');

  if (hamburger && navLinks) {
    hamburger.addEventListener('click', () => {
      hamburger.classList.toggle('active');
      navLinks.classList.toggle('open');
    });

    // Close menu on link click
    navLinks.querySelectorAll('a:not(.dropdown-toggle)').forEach(link => {
      link.addEventListener('click', () => {
        hamburger.classList.remove('active');
        navLinks.classList.remove('open');
      });
    });
  }
}

// ==========================================
// Scroll Reveal Animation
// ==========================================
function observeRevealElements() {
  const elements = document.querySelectorAll('.reveal:not(.visible)');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, index) => {
      if (entry.isIntersecting) {
        setTimeout(() => {
          entry.target.classList.add('visible');
        }, index * 80);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

  elements.forEach(el => observer.observe(el));
}

// ==========================================
// Toast Notification
// ==========================================
function showToast(message, icon = '✅') {
  // Remove existing toasts
  document.querySelectorAll('.toast').forEach(t => t.remove());

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `<span class="toast-icon">${icon}</span> ${message}`;
  document.body.appendChild(toast);

  setTimeout(() => toast.classList.add('show'), 10);
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// ==========================================
// Category page: load products
// ==========================================
function loadCategoryProducts(category) {
  const products = ProductStore.getByCategory(category);
  const countEl = document.getElementById('productCount');
  if (countEl) countEl.textContent = products.length;
  renderProductsGrid('categoryProducts', products);
}

// ==========================================
// Home page: load featured products
// ==========================================
function loadFeaturedProducts() {
  const products = ProductStore.getFeatured();
  renderProductsGrid('featuredProducts', products);
}

// ==========================================
// Home page: load category counts
// ==========================================
function loadCategoryCounts() {
  const allProducts = ProductStore.getAll();
  Object.keys(Categories).forEach(catKey => {
    const countEl = document.getElementById(`count-${catKey}`);
    if (countEl) {
      const count = allProducts.filter(p => p.category === catKey).length;
      countEl.textContent = `${count} product${count !== 1 ? 's' : ''}`;
    }
  });

  // Update total stats
  const totalEl = document.getElementById('totalProducts');
  if (totalEl) totalEl.textContent = allProducts.length + '+';
}

// ==========================================
// Init common elements
// ==========================================
function initCommon() {
  initNavbar();
  observeRevealElements();
}

// Run on DOM ready
document.addEventListener('DOMContentLoaded', initCommon);


// ==========================================
// OrderStore - Client Orders Storage
// ==========================================
const OrderStore = {
  KEY: '3dcraft_orders',
  getAll() {
    const d = localStorage.getItem(this.KEY);
    try {
      return d ? JSON.parse(d) : [];
    } catch(e) {
      return [];
    }
  },
  save(orders) {
    localStorage.setItem(this.KEY, JSON.stringify(orders || []));
  },
  add(order) {
    const list = this.getAll();
    order.id = 'CMD-' + Math.floor(1000 + Math.random() * 9000);
    order.date = new Date().toISOString();
    order.status = order.status || 'pending';
    list.unshift(order);
    this.save(list);
    return order;
  },
  updateStatus(id, newStatus) {
    const list = this.getAll();
    const idx = list.findIndex(o => o.id === id);
    if (idx !== -1) {
      list[idx].status = newStatus;
      this.save(list);
      return list[idx];
    }
    return null;
  },
  delete(id) {
    const list = this.getAll().filter(o => o.id !== id);
    this.save(list);
    return list;
  }
};

// ==========================================
// Product Detail & Order Modal Logic
// ==========================================
let currentModalProduct = null;

function openProductModal(id) {
  let p = null;
  if (typeof Store !== 'undefined' && Store.getAll) {
    p = Store.getAll().find(x => x.id === id);
  }
  if (!p && typeof ProductStore !== 'undefined' && ProductStore.getAll) {
    p = ProductStore.getAll().find(x => x.id === id);
  }
  if (!p) return;
  currentModalProduct = p;

  const modal = document.getElementById('orderModal');
  if (!modal) return;

  const orderView = document.getElementById('modalOrderView');
  const successView = document.getElementById('modalSuccessView');
  if (orderView) orderView.style.display = 'block';
  if (successView) successView.style.display = 'none';

  document.getElementById('modalTitle').textContent = p.name;
  document.getElementById('modalPrice').textContent = parseFloat(p.price).toFixed(2);
  document.getElementById('modalDesc').textContent = p.description || 'Création imprimée en 3D avec finitions soignées en PLA haute qualité.';

  const catObj = (typeof CATS !== 'undefined' && CATS[p.category]) 
    ? CATS[p.category] 
    : ((typeof Categories !== 'undefined' && Categories[p.category]) ? Categories[p.category] : { name: p.category, icon: '📦' });
  const catBadge = document.getElementById('modalCatBadge');
  if (catBadge) catBadge.textContent = `${catObj.icon || '📦'} ${catObj.name || p.category}`;

  const promoBadge = document.getElementById('modalPromoBadge');
  if (promoBadge) {
    if (p.badge) {
      promoBadge.textContent = p.badge === 'new' ? '✨ NOUVEAU' : p.badge === 'sale' ? '🔥 PROMO' : '⭐ POPULAIRE';
      promoBadge.style.display = 'inline-block';
    } else {
      promoBadge.style.display = 'none';
    }
  }

  const imgWrap = document.getElementById('modalImgWrap');
  if (imgWrap) {
    if (p.image) {
      imgWrap.innerHTML = `<img src="${p.image}" alt="${p.name}" style="width:100%; height:100%; object-fit:cover; border-radius:12px;">`;
    } else {
      const emoji = typeof getEmoji === 'function' ? getEmoji(p.category) : (catObj.icon || '📦');
      imgWrap.innerHTML = `<div style="font-size:4rem; display:flex; align-items:center; justify-content:center; width:100%; height:100%; background:var(--bg-section); border-radius:12px;">${emoji}</div>`;
    }
  }

  document.getElementById('orderProdId').value = p.id;
  document.getElementById('orderQty').value = 1;
  document.getElementById('orderComment').value = '';
  updateModalTotal();

  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function updateModalTotal() {
  if (!currentModalProduct) return;
  const qtyInput = document.getElementById('orderQty');
  const qty = Math.max(1, parseInt(qtyInput ? qtyInput.value : 1, 10) || 1);
  const total = (parseFloat(currentModalProduct.price) * qty).toFixed(2);
  const totalEl = document.getElementById('modalTotalAmount');
  if (totalEl) totalEl.textContent = total;
}

function closeOrderModal() {
  const modal = document.getElementById('orderModal');
  if (modal) modal.classList.remove('active');
  document.body.style.overflow = '';
}

function directOrderWA() {
  if (!currentModalProduct) return;
  const qty = parseInt(document.getElementById('orderQty').value, 10) || 1;
  const name = document.getElementById('orderName').value.trim();
  const phone = document.getElementById('orderPhone').value.trim();
  const addr = document.getElementById('orderAddress').value.trim();
  const notes = document.getElementById('orderComment').value.trim();
  const total = (parseFloat(currentModalProduct.price) * qty).toFixed(2);

  let msg = `Bonjour 3D Craft! 👋\nJe souhaite commander :\n----------------------------------\n📦 Produit : ${currentModalProduct.name}\n🔢 Quantité : ${qty}\n💰 Total : ${total} TND`;
  if (name) msg += `\n👤 Client : ${name}`;
  if (phone) msg += `\n📞 Tél : ${phone}`;
  if (addr) msg += `\n📍 Adresse : ${addr}`;
  if (notes) msg += `\n🎨 Personnalisation : ${notes}`;
  msg += `\n----------------------------------\nMerci de me confirmer la commande !`;

  window.open(`https://wa.me/21646595833?text=${encodeURIComponent(msg)}`, '_blank');
}

function submitCustomerOrder(e) {
  e.preventDefault();
  if (!currentModalProduct) return;

  const name = document.getElementById('orderName').value.trim();
  const phone = document.getElementById('orderPhone').value.trim();
  const address = document.getElementById('orderAddress').value.trim();
  const qty = Math.max(1, parseInt(document.getElementById('orderQty').value, 10) || 1);
  const notes = document.getElementById('orderComment').value.trim();

  if (!name || !phone || !address) {
    alert('Veuillez remplir votre nom, numéro de téléphone et adresse de livraison.');
    return;
  }

  const unitPrice = parseFloat(currentModalProduct.price);
  const total = (unitPrice * qty).toFixed(2);

  const order = {
    productId: currentModalProduct.id,
    productName: currentModalProduct.name,
    productPrice: unitPrice,
    productCategory: currentModalProduct.category,
    productImage: currentModalProduct.image || '',
    quantity: qty,
    totalPrice: total,
    customerName: name,
    customerPhone: phone,
    customerAddress: address,
    customerNotes: notes,
    status: 'pending'
  };

  const created = OrderStore.add(order);

  document.getElementById('modalOrderView').style.display = 'none';
  const successView = document.getElementById('modalSuccessView');
  successView.style.display = 'block';

  document.getElementById('successOrderRef').textContent = '#' + created.id;
  document.getElementById('successProdName').textContent = `${qty}x ${created.productName}`;
  document.getElementById('successTotal').textContent = total + ' TND';
  document.getElementById('successClient').textContent = `${name} (${phone})`;

  const waMsg = encodeURIComponent(
    `Bonjour 3D Craft! 👋\n` +
    `Je viens de passer la commande *${created.id}* sur votre boutique :\n` +
    `----------------------------------\n` +
    `📦 *Produit :* ${created.productName}\n` +
    `🔢 *Quantité :* ${qty}\n` +
    `💰 *Total :* ${total} TND\n` +
    `----------------------------------\n` +
    `👤 *Nom :* ${name}\n` +
    `📞 *Tél :* ${phone}\n` +
    `📍 *Adresse :* ${address}\n` +
    (notes ? `🎨 *Notes :* ${notes}\n` : '') +
    `----------------------------------\n` +
    `Merci de me contacter pour la validation et la livraison !`
  );
  document.getElementById('successWaLink').href = `https://wa.me/21646595833?text=${waMsg}`;

  if (typeof toast === 'function') toast('🎉 Commande confirmée avec succès !');
}

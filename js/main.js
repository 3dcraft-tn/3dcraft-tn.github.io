/**
 * 3D CRAFT - Application Core JavaScript
 * Store (Products) & OrderStore (Cloud-Synced Customer Orders)
 */

const STORE_PHONE = '21646595833'; // +216 46 595 833

// ==========================================
// SECURITY UTILITIES (XSS Prevention & Sanitization)
// ==========================================
function escapeHTML(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function sanitizeURL(url) {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  // Allow relative paths, http(s), and safe image data URLs
  if (trimmed.startsWith('/') || trimmed.startsWith('./') || trimmed.startsWith('../') || trimmed.startsWith('assets/')) {
    return escapeHTML(trimmed);
  }
  if (/^https?:\/\//i.test(trimmed) || /^data:image\/(png|jpe?g|gif|webp|svg\+xml);base64,/i.test(trimmed)) {
    return escapeHTML(trimmed);
  }
  return '';
}

// ==========================================
// STORE - Products Management
// ==========================================
const Store = {
  KEY: '3dcraft_products',

  async loadRemote() {
    // 0. Essai ultra-rapide Firebase Firestore si connecté
    if (typeof CloudStore !== 'undefined' && CloudStore.isReady()) {
      try {
        const fireProds = await CloudStore.getProducts();
        if (Array.isArray(fireProds) && fireProds.length > 0) {
          this.save(fireProds);
          return fireProds;
        }
      } catch(e) {
        console.warn('Firestore loadRemote products fallback', e);
      }
    }

    // 1. Essai relatif direct (rapide, sans limite API, fonctionne en local et sur GitHub Pages)
    const isSub = window.location.pathname.includes('/pages/');
    const relUrl = (isSub ? '../data/products.json' : 'data/products.json') + '?t=' + Date.now();
    try {
      const res = await fetch(relUrl);
      if (res.ok) {
        const list = await res.json();
        if (Array.isArray(list)) {
          this.save(list);
          return list;
        }
      }
    } catch(e) {
      console.warn('Relative products fetch fallback', e);
    }

    return this.getAll();
  },

  getAll() {
    const d = localStorage.getItem(this.KEY);
    if (!d) return [];
    try {
      return JSON.parse(d);
    } catch(e) {
      return [];
    }
  },

  save(p) {
    localStorage.setItem(this.KEY, JSON.stringify(p || []));
  },

  add(p) {
    const l = this.getAll();
    p.id = Date.now().toString();
    l.unshift(p);
    this.save(l);
    if (typeof CloudStore !== 'undefined' && CloudStore.isReady()) {
      CloudStore.addProduct(p).catch(e => console.warn('CloudStore addProduct err', e));
    }
    return p;
  },

  update(id, u) {
    const l = this.getAll();
    const i = l.findIndex(p => p.id === id);
    if (i !== -1) {
      l[i] = { ...l[i], ...u };
      this.save(l);
      if (typeof CloudStore !== 'undefined' && CloudStore.isReady()) {
        CloudStore.updateProduct(id, l[i]).catch(e => console.warn('CloudStore updateProduct err', e));
      }
      return l[i];
    }
    return null;
  },

  delete(id) {
    this.save(this.getAll().filter(p => p.id !== id));
    if (typeof CloudStore !== 'undefined' && CloudStore.isReady()) {
      CloudStore.deleteProduct(id).catch(e => console.warn('CloudStore deleteProduct err', e));
    }
  },

  byCat(c) {
    return this.getAll().filter(p => p.category === c);
  },

  getDefaults() {
    return [];
  }
};

// ==========================================
// ORDERSTORE - Cloud-Synced Customer Orders
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

  // Charger les commandes depuis Firebase Firestore avec secours local
  async loadRemote() {
    // 0. Essai ultra-rapide Firebase Firestore si connecté
    if (typeof CloudStore !== 'undefined' && CloudStore.isReady()) {
      try {
        const fireOrders = await CloudStore.getOrders();
        if (Array.isArray(fireOrders) && fireOrders.length > 0) {
          this.save(fireOrders);
          return fireOrders;
        }
      } catch(e) {
        console.warn('Firestore loadRemote orders fallback', e);
      }
    }

    // 1. Secours fichier relatif
    try {
      const isSub = window.location.pathname.includes('/pages/');
      const relUrl = (isSub ? '../data/orders.json' : 'data/orders.json') + '?t=' + Date.now();
      const res = await fetch(relUrl);
      if (res.ok) {
        const remoteOrders = await res.json();
        if (Array.isArray(remoteOrders)) {
          const local = this.getAll();
          const map = new Map();
          remoteOrders.forEach(o => { if (o && o.id) map.set(o.id, o); });
          local.forEach(o => { if (o && o.id && !map.has(o.id)) map.set(o.id, o); });
          const merged = Array.from(map.values()).sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
          this.save(merged);
          return merged;
        }
      }
    } catch(e) {
      console.warn('Relative orders fetch fallback', e);
    }

    return this.getAll();
  },

  add(order) {
    const list = this.getAll();
    order.id = order.id || ('CMD-' + Math.floor(1000 + Math.random() * 9000));
    order.date = order.date || new Date().toISOString();
    order.status = order.status || 'pending';
    list.unshift(order);
    this.save(list);

    // Envoi instantané vers Firebase Firestore
    if (typeof CloudStore !== 'undefined' && CloudStore.isReady()) {
      CloudStore.addOrder(order).catch(err => console.warn('Firestore addOrder error:', err));
    }
    return order;
  },

  updateStatus(id, newStatus) {
    const list = this.getAll();
    const idx = list.findIndex(o => o.id === id);
    if (idx !== -1) {
      list[idx].status = newStatus;
      this.save(list);

      // Firestore update
      if (typeof CloudStore !== 'undefined' && CloudStore.isReady()) {
        CloudStore.updateOrderStatus(id, newStatus).catch(err => console.warn('Firestore updateOrderStatus error:', err));
      }
      return list[idx];
    }
    return null;
  },

  delete(id) {
    const list = this.getAll().filter(o => o.id !== id);
    this.save(list);

    // Firestore delete
    if (typeof CloudStore !== 'undefined' && CloudStore.isReady()) {
      CloudStore.deleteOrder(id).catch(err => console.warn('Firestore deleteOrder error:', err));
    }
    return list;
  }
};
};

// ==========================================
// CATEGORIES & EMOJIS
// ==========================================
const CATS = {
  'home-decor': { name: 'Décoration Maison', icon: '🏠', desc: 'Vases, veilleuses, lampes et serre-livres' },
  'gaming': { name: 'Gaming Setup', icon: '🎮', desc: 'Supports de manettes, casques et touches custom' },
  'anime': { name: 'Anime & Figurines', icon: '⚔️', desc: 'Statues et figurines haute définition' },
  'toys': { name: 'Jouets & Gadgets', icon: '🧸', desc: 'Jouets articulés, flexi-rex et casse-têtes' },
  'accessories': { name: 'Accessoires Bureau', icon: '🎧', desc: 'Supports smartphone, range-câbles et utilitaires' },
  'tools': { name: 'Outils & Atelier', icon: '🔧', desc: 'Rangements d\'outils, calibres et gabarits de mesure' },
  'gifts': { name: 'Idées Cadeaux', icon: '🎁', desc: 'Lithophanies photo, boîtes secrètes et surprises' },
  'keychains': { name: 'Porte-clés Custom', icon: '🔑', desc: 'Porte-clés prénom bicolore, logos auto et codes Spotify' }
};

const EMOJIS = {
  'home-decor': ['🏺', '🪴', '💡', '🏠'],
  'gaming': ['🎮', '🕹️', '⌨️', '🎧'],
  'anime': ['⚔️', '🐉', '🎭', '🗡️'],
  'toys': ['🧸', '🤖', '🦕', '🚀'],
  'accessories': ['📱', '⌚', '💼', '🧲'],
  'tools': ['🔧', '🛠️', '📐', '⚙️'],
  'gifts': ['🎁', '💝', '✨', '🎀'],
  'keychains': ['🔑', '🏷️', '🚗', '🎵']
};

const Categories = CATS;

function getEmoji(cat, i = 0) {
  const a = EMOJIS[cat] || ['📦'];
  return a[i % a.length];
}

// Backward-compatibility aliases for category pages
const ProductStore = {
  getAll() { return Store.getAll(); },
  save(p) { Store.save(p); },
  add(p) { return Store.add(p); },
  update(id, u) { return Store.update(id, u); },
  delete(id) { Store.delete(id); },
  getByCategory(c) { return Store.byCat(c); },
  getFeatured() { return Store.getAll().filter(p => p.featured); },
  loadRemote() { return Store.loadRemote(); },
  getDefaultProducts() { return []; }
};

function formatPrice(p) {
  return parseFloat(p || 0).toFixed(2);
}

function getProductEmoji(cat, i = 0) {
  return getEmoji(cat, i);
}

function renderProductsGrid(containerId, products) {
  const container = document.getElementById(containerId);
  if (!container) return;
  if (!products || products.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; background: #fff; border: 1px dashed var(--border); border-radius: 16px; margin: 20px 0;">
        <div style="font-size: 2.8rem; margin-bottom: 12px;">📦</div>
        <h3 style="font-size: 1.25rem; font-weight: 800; color: var(--text); margin-bottom: 8px;">Aucun article dans cette catégorie pour le moment</h3>
        <p style="color: var(--text-muted); font-size: 0.92rem; max-width: 460px; margin: 0 auto 20px;">
          Vous avez un projet ou une idée précise ? Nous pouvons modéliser et imprimer n'importe quelle pièce sur mesure !
        </p>
        <a href="https://wa.me/${STORE_PHONE}?text=${encodeURIComponent('Bonjour 3D Craft! 👋 Je souhaite commander une impression 3D personnalisée sur mesure.')}" target="_blank" class="btn btn-primary btn-sm" style="background:#25D366; border-color:#25D366; font-weight:700;">
          💬 Demander une création sur mesure (WhatsApp)
        </a>
      </div>
    `;
    return;
  }
  container.innerHTML = products.map((p, i) => cardHTML(p, i)).join('');
}

// ==========================================
// PARTNERSTORE - Partners & Logos Management
// ==========================================
const DEFAULT_PARTNERS = [
  { id: '1', name: 'Bambu Lab', logo: 'assets/partners/bambulab.svg', url: 'https://bambulab.com', category: '3D Printers' },
  { id: '2', name: 'technomaker', logo: 'https://scontent.ftun16-1.fna.fbcdn.net/v/t39.30808-6/903552407_1453761400281532_8285187849921190643_n.avif?stp=dst-jpg_tt6&cstp=mx598x476&ctp=s598x476&_nc_cat=105&_nc_map=urlgen_bucketless&ccb=1-7&_nc_sid=6ee11a&_nc_ohc=tfdoKnb_jUcQ7kNvwGJqe-T&_nc_oc=AdrRHstbI1jW_tVfnfxFKv30zWkdG2KWJVQloPPE67uwG2vLDD6tMlstf1Sxtp8MOKk&_nc_zt=23&_nc_ht=scontent.ftun16-1.fna&_nc_gid=vNmaMuBx62uojlJonyxAhg&_nc_ss=7b2a8&oh=00_AQQ0bG-i53AmD-RhYvibEIcgxNrZ2vPVUlH4igfsFHTblA&oe=6B03EC94', url: 'https://www.facebook.com/Technomaker.tn/', category: 'Robotic Club' },
  { id: '3', name: 'Little-son', logo: 'https://little-son.tn/img/logo-1682280363.jpg', url: 'https://little-son.tn/', category: 'Materials' },
  { id: '4', name: 'SolidWorks', logo: 'assets/partners/solidworks.svg', url: 'https://www.solidworks.com', category: 'CAD Software' },
  { id: '5', name: 'Blender 3D', logo: 'assets/partners/blender.svg', url: 'https://www.blender.org', category: '3D Software' },
  { id: '6', name: 'eSUN Filament', logo: 'assets/partners/esun.svg', url: 'https://www.esun3d.com', category: 'Materials' },
  { id: '7', name: 'Anycubic', logo: 'assets/partners/anycubic.svg', url: 'https://www.anycubic.com', category: 'Resin & FDM' },
  { id: '8', name: 'Elegoo', logo: 'assets/partners/elegoo.svg', url: 'https://www.elegoo.com', category: 'Resin 3D' }
];

const PartnerStore = {
  KEY: '3dcraft_partners',

  getAll() {
    const d = localStorage.getItem(this.KEY);
    try {
      const parsed = d ? JSON.parse(d) : [];
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_PARTNERS;
    } catch(e) {
      return DEFAULT_PARTNERS;
    }
  },

  save(partners) {
    localStorage.setItem(this.KEY, JSON.stringify(partners || []));
  },

  async loadRemote() {
    // 0. Essai Firebase Firestore
    if (typeof CloudStore !== 'undefined' && CloudStore.isReady()) {
      try {
        const fire = await CloudStore.getPartners();
        if (Array.isArray(fire) && fire.length > 0) {
          this.save(fire);
          return fire;
        }
      } catch(e) {
        console.warn('Firestore loadRemote partners fallback', e);
      }
    }

    // 1. Essai JSON relatif
    const isSub = window.location.pathname.includes('/pages/');
    const relUrl = (isSub ? '../data/partners.json' : 'data/partners.json') + '?t=' + Date.now();
    try {
      const res = await fetch(relUrl);
      if (res.ok) {
        const list = await res.json();
        if (Array.isArray(list) && list.length > 0) {
          this.save(list);
          return list;
        }
      }
    } catch(e) {
      console.warn('Relative partners fetch fallback', e);
    }

    return this.getAll();
  },

  add(partner) {
    const list = this.getAll();
    partner.id = partner.id || Date.now().toString();
    list.push(partner);
    this.save(list);
    if (typeof CloudStore !== 'undefined' && CloudStore.isReady()) {
      CloudStore.addPartner(partner).catch(e => console.warn('CloudStore addPartner err', e));
    }
    return partner;
  },

  update(id, updated) {
    const list = this.getAll();
    const idx = list.findIndex(p => p.id === id);
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...updated };
      this.save(list);
      if (typeof CloudStore !== 'undefined' && CloudStore.isReady()) {
        CloudStore.updatePartner(id, list[idx]).catch(e => console.warn('CloudStore updatePartner err', e));
      }
      return list[idx];
    }
    return null;
  },

  delete(id) {
    const list = this.getAll().filter(p => p.id !== id);
    this.save(list);
    if (typeof CloudStore !== 'undefined' && CloudStore.isReady()) {
      CloudStore.deletePartner(id).catch(e => console.warn('CloudStore deletePartner err', e));
    }
    return list;
  }
};

function renderPartnersMarquee(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const partners = PartnerStore.getAll();
  if (!partners || partners.length === 0) {
    container.style.display = 'none';
    return;
  }
  container.style.display = 'block';

  // Double the list for seamless continuous infinite marquee
  const loopList = [...partners, ...partners];

  const cardsHtml = loopList.map(p => {
    const safeUrl = sanitizeURL(p.url);
    const safeLogo = sanitizeURL(p.logo) || 'assets/icon.png';
    const safeName = escapeHTML(p.name);
    return `
      <a href="${safeUrl || '#'}" target="${safeUrl ? '_blank' : '_self'}" class="partner-card" title="${safeName} - Partenaire officiel 3D Craft" rel="noopener">
        <div class="partner-logo-wrap">
          <img src="${safeLogo}" alt="${safeName}" loading="lazy" onerror="this.onerror=null; this.src='assets/icon.png';">
        </div>
        <span class="partner-name">${safeName}</span>
      </a>
    `;
  }).join('');

  container.innerHTML = `
    <div class="partner-marquee-track">
      ${cardsHtml}
    </div>
  `;
}

function getEmoji(cat, i = 0) {
  const a = EMOJIS[cat] || ['📦'];
  return a[i % a.length];
}

function toast(m) {
  let t = document.getElementById('toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'toast';
    t.className = 'toast';
    document.body.appendChild(t);
  }
  t.textContent = m;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3000);
}

function cardHTML(p, i = 0) {
  const safeBadge = p.badge ? `<span class="badge badge-${escapeHTML(p.badge)}">${p.badge === 'new' ? '✨ New' : p.badge === 'sale' ? '🔥 Sale' : '⭐ Popular'}</span>` : '';
  const safeImg = sanitizeURL(p.image);
  const safeName = escapeHTML(p.name);
  const safeDesc = escapeHTML(p.description || '');
  const safeId = escapeHTML(p.id);
  const catName = escapeHTML(CATS[p.category]?.name || p.category);
  const img = safeImg ? `<img src="${safeImg}" alt="${safeName}">` : `<span class="product-emoji">${getEmoji(p.category, i)}</span>`;
  return `
    <div class="product-card" onclick="openProductModal('${safeId}')" title="Cliquer pour voir les détails et commander">
      <div class="product-img">
        ${img}
        <div class="product-badge-wrap">${safeBadge}</div>
        <div class="product-overlay-hint"><span>👁️ Détails & Commande</span></div>
      </div>
      <div class="product-info">
        <span class="product-cat">${catName}</span>
        <h3 class="product-name">${safeName}</h3>
        <p class="product-desc">${safeDesc}</p>
        <div class="product-foot">
          <div class="product-price">${parseFloat(p.price || 0).toFixed(2)} <span>TND</span></div>
          <button class="product-order-btn" title="Commander" onclick="event.stopPropagation(); openProductModal('${safeId}')">🛒 Commander</button>
        </div>
      </div>
    </div>
  `;
}

// ==========================================
// PRODUCT DETAIL & ORDER MODAL LOGIC
// ==========================================
let currentModalProduct = null;

function openProductModal(id) {
  const p = Store.getAll().find(x => x.id === id);
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

  const catObj = CATS[p.category] || { name: p.category, icon: '📦' };
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
      const emoji = getEmoji(p.category);
      imgWrap.innerHTML = `<div style="font-size:4rem; display:flex; align-items:center; justify-content:center; width:100%; height:100%; background:var(--bg-section); border-radius:12px;">${emoji}</div>`;
    }
  }

  document.getElementById('orderProdId').value = p.id;
  document.getElementById('orderQty').value = 1;
  document.getElementById('orderComment').value = '';

  // Pré-remplir les coordonnées si le client a déjà commandé
  try {
    const savedCustomer = JSON.parse(localStorage.getItem('3dcraft_customer_info') || '{}');
    if (savedCustomer.name && !document.getElementById('orderName').value) {
      document.getElementById('orderName').value = savedCustomer.name;
    }
    if (savedCustomer.phone && !document.getElementById('orderPhone').value) {
      document.getElementById('orderPhone').value = savedCustomer.phone;
    }
    if (savedCustomer.address && !document.getElementById('orderAddress').value) {
      document.getElementById('orderAddress').value = savedCustomer.address;
    }
  } catch(e){}

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

function submitCustomerOrder(e, isDirectWhatsApp = false) {
  if (e && e.preventDefault) e.preventDefault();
  if (!currentModalProduct) return;

  const nameInput = document.getElementById('orderName');
  const phoneInput = document.getElementById('orderPhone');
  const addrInput = document.getElementById('orderAddress');
  const qtyInput = document.getElementById('orderQty');
  const notesInput = document.getElementById('orderComment');

  const name = nameInput ? nameInput.value.trim() : '';
  const phone = phoneInput ? phoneInput.value.trim() : '';
  const address = addrInput ? addrInput.value.trim() : '';
  const qty = Math.max(1, parseInt(qtyInput ? qtyInput.value : 1, 10) || 1);
  const notes = notesInput ? notesInput.value.trim() : '';

  if (!name || !phone || !address) {
    alert('Veuillez remplir votre nom, numéro de téléphone et adresse de livraison.');
    return;
  }

  // Sauvegarde des coordonnées du client pour sa prochaine visite
  try {
    localStorage.setItem('3dcraft_customer_info', JSON.stringify({ name, phone, address }));
  } catch(e){}

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

  // Enregistrement dans OrderStore (localStorage + Cloud GitHub)
  const created = OrderStore.add(order);

  // Message WhatsApp formaté pour l'artisan 3D Craft
  const waMsg = encodeURIComponent(
    `Bonjour 3D Craft! 👋\n` +
    `Je souhaite commander la référence *#${created.id}* passée sur votre boutique en ligne :\n` +
    `----------------------------------\n` +
    `📦 *Produit :* ${created.productName}\n` +
    `🔢 *Quantité :* ${qty}\n` +
    `💰 *Montant Total :* ${total} TND\n` +
    `----------------------------------\n` +
    `👤 *Nom Client :* ${name}\n` +
    `📞 *Téléphone :* ${phone}\n` +
    `📍 *Adresse Livraison :* ${address}\n` +
    (notes ? `🎨 *Personnalisation / Remarques :* ${notes}\n` : '') +
    `----------------------------------\n` +
    `Merci de me confirmer la prise en charge et le délai de fabrication !`
  );

  const waUrl = `https://wa.me/${STORE_PHONE}?text=${waMsg}`;

  // Si l'utilisateur a choisi la commande directe WhatsApp
  if (isDirectWhatsApp) {
    window.open(waUrl, '_blank');
  }

  // Affichage de la vue de succès
  const orderView = document.getElementById('modalOrderView');
  const successView = document.getElementById('modalSuccessView');
  if (orderView) orderView.style.display = 'none';
  if (successView) successView.style.display = 'block';

  const refEl = document.getElementById('successOrderRef');
  if (refEl) refEl.textContent = '#' + created.id;
  const prodEl = document.getElementById('successProdName');
  if (prodEl) prodEl.textContent = `${qty}x ${created.productName}`;
  const totEl = document.getElementById('successTotal');
  if (totEl) totEl.textContent = total + ' TND';
  const cliEl = document.getElementById('successClient');
  if (cliEl) cliEl.textContent = `${name} (${phone})`;

  const waLink = document.getElementById('successWaLink');
  if (waLink) waLink.href = waUrl;

  toast('🎉 Commande enregistrée avec succès !');
}

function directOrderWA() {
  submitCustomerOrder(null, true);
}

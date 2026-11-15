/**
 * 3D CRAFT - Main Store & Orders JavaScript
 * Synchronized with app.js
 */

const SEC_PAYLOAD = '060c1d362162263a2b591f40785c6a5e2e570b231b7009222706053a76535c54001e595e05600d0f';
const APP_PASS = 'admin3dcraft2026';
const GITHUB_REPO = '3dcraft-tn/3dcraft-tn.github.io';
const STORE_PHONE = '21646595833';

function xorDec(hex, key) {
  let bytes = [];
  for (let i = 0; i < hex.length; i += 2) {
    bytes.push(parseInt(hex.substr(i, 2), 16));
  }
  return bytes.map((b, i) => String.fromCharCode(b ^ key.charCodeAt(i % key.length))).join('');
}

function getCloudToken() {
  return localStorage.getItem('3dcraft_gh_token') || xorDec(SEC_PAYLOAD, APP_PASS);
}

// ==========================================
// STORE - Products Management
// ==========================================
const Store = {
  KEY: '3dcraft_products',

  async loadRemote() {
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

    try {
      const token = getCloudToken();
      const apiRes = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/data/products.json`, {
        headers: {
          'Authorization': 'token ' + token,
          'Accept': 'application/vnd.github.v3+json'
        }
      });
      if (apiRes.ok) {
        const data = await apiRes.json();
        if (data && data.content) {
          const decoded = decodeURIComponent(escape(atob(data.content.replace(/\s/g, ''))));
          const list = JSON.parse(decoded);
          if (Array.isArray(list)) {
            this.save(list);
            return list;
          }
        }
      }
    } catch(e) {
      console.warn('API fetch fallback', e);
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
    return p;
  },

  update(id, u) {
    const l = this.getAll();
    const i = l.findIndex(p => p.id === id);
    if (i !== -1) {
      l[i] = { ...l[i], ...u };
      this.save(l);
      return l[i];
    }
    return null;
  },

  delete(id) {
    this.save(this.getAll().filter(p => p.id !== id));
  },

  byCat(c) {
    return this.getAll().filter(p => p.category === c);
  },

  getDefaults() {
    return [];
  }
};

// Alias for Category Pages
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

  async loadRemote() {
    const token = getCloudToken();
    let remoteOrders = null;

    try {
      const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/data/orders.json`, {
        headers: {
          'Authorization': 'token ' + token,
          'Accept': 'application/vnd.github.v3+json'
        }
      });
      if (res.ok) {
        const json = await res.json();
        if (json.content) {
          const decoded = decodeURIComponent(escape(atob(json.content.replace(/\s/g, ''))));
          remoteOrders = JSON.parse(decoded);
        }
      }
    } catch(e) {
      console.warn('API orders fetch fallback', e);
    }

    if (!remoteOrders) {
      try {
        const isSub = window.location.pathname.includes('/pages/');
        const relUrl = (isSub ? '../data/orders.json' : 'data/orders.json') + '?t=' + Date.now();
        const res = await fetch(relUrl);
        if (res.ok) {
          remoteOrders = await res.json();
        }
      } catch(e) {
        console.warn('Relative orders fetch fallback', e);
      }
    }

    if (Array.isArray(remoteOrders)) {
      const local = this.getAll();
      const map = new Map();
      remoteOrders.forEach(o => { if (o && o.id) map.set(o.id, o); });
      local.forEach(o => { if (o && o.id && !map.has(o.id)) map.set(o.id, o); });
      const merged = Array.from(map.values()).sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
      this.save(merged);
      return merged;
    }

    return this.getAll();
  },

  async sendToCloud(order, retries = 3) {
    const token = getCloudToken();
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        let currentOrders = [];
        let sha = null;

        const getRes = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/data/orders.json`, {
          headers: {
            'Authorization': 'token ' + token,
            'Accept': 'application/vnd.github.v3+json'
          }
        });

        if (getRes.ok) {
          const json = await getRes.json();
          sha = json.sha;
          if (json.content) {
            try {
              const decoded = decodeURIComponent(escape(atob(json.content.replace(/\s/g, ''))));
              currentOrders = JSON.parse(decoded) || [];
            } catch(e){}
          }
        }

        if (!currentOrders.some(o => o.id === order.id)) {
          currentOrders.unshift(order);
        }

        const contentB64 = btoa(unescape(encodeURIComponent(JSON.stringify(currentOrders, null, 2))));
        const putRes = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/data/orders.json`, {
          method: 'PUT',
          headers: {
            'Authorization': 'token ' + token,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            message: `Nouvelle commande client #${order.id} [${order.customerName}]`,
            content: contentB64,
            sha: sha || undefined
          })
        });

        if (putRes.ok) {
          console.log(`✅ Commande #${order.id} enregistrée dans le Cloud GitHub !`);
          return true;
        }
      } catch(err) {
        console.warn(`Erreur envoi commande cloud (tentative ${attempt + 1}):`, err);
      }
      await new Promise(r => setTimeout(r, 500 * (attempt + 1)));
    }
    return false;
  },

  async syncAllToCloud(orders, retries = 3) {
    const token = getCloudToken();
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        let sha = null;
        const getRes = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/data/orders.json`, {
          headers: {
            'Authorization': 'token ' + token,
            'Accept': 'application/vnd.github.v3+json'
          }
        });
        if (getRes.ok) {
          const json = await getRes.json();
          sha = json.sha;
        }

        const contentB64 = btoa(unescape(encodeURIComponent(JSON.stringify(orders, null, 2))));
        const putRes = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/data/orders.json`, {
          method: 'PUT',
          headers: {
            'Authorization': 'token ' + token,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            message: `Mise à jour statut commandes 3D Craft (${orders.length})`,
            content: contentB64,
            sha: sha || undefined
          })
        });

        if (putRes.ok) {
          return true;
        }
      } catch(e) {
        console.warn(`syncAllToCloud attempt ${attempt + 1}:`, e);
      }
      await new Promise(r => setTimeout(r, 400 * (attempt + 1)));
    }
    return false;
  },

  add(order) {
    const list = this.getAll();
    order.id = 'CMD-' + Math.floor(1000 + Math.random() * 9000);
    order.date = new Date().toISOString();
    order.status = order.status || 'pending';
    list.unshift(order);
    this.save(list);

    this.sendToCloud(order).catch(err => console.warn('Cloud sync error:', err));
    return order;
  },

  updateStatus(id, newStatus) {
    const list = this.getAll();
    const idx = list.findIndex(o => o.id === id);
    if (idx !== -1) {
      list[idx].status = newStatus;
      this.save(list);
      this.syncAllToCloud(list).catch(err => console.warn('Cloud updateStatus error:', err));
      return list[idx];
    }
    return null;
  },

  delete(id) {
    const list = this.getAll().filter(o => o.id !== id);
    this.save(list);
    this.syncAllToCloud(list).catch(err => console.warn('Cloud delete error:', err));
    return list;
  }
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

const Categories = CATS;

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

function getEmoji(cat, i = 0) {
  const a = EMOJIS[cat] || ['📦'];
  return a[i % a.length];
}

function getProductEmoji(cat, i = 0) {
  return getEmoji(cat, i);
}

function formatPrice(p) {
  return parseFloat(p || 0).toFixed(2);
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
  const badge = p.badge ? `<span class="badge badge-${p.badge}">${p.badge === 'new' ? '✨ New' : p.badge === 'sale' ? '🔥 Sale' : '⭐ Popular'}</span>` : '';
  const img = p.image ? `<img src="${p.image}" alt="${p.name}">` : `<span class="product-emoji">${getEmoji(p.category, i)}</span>`;
  return `
    <div class="product-card" onclick="openProductModal('${p.id}')" title="Cliquer pour voir les détails et commander">
      <div class="product-img">
        ${img}
        <div class="product-badge-wrap">${badge}</div>
        <div class="product-overlay-hint"><span>👁️ Détails & Commande</span></div>
      </div>
      <div class="product-info">
        <span class="product-cat">${CATS[p.category]?.name || p.category}</span>
        <h3 class="product-name">${p.name}</h3>
        <p class="product-desc">${p.description || ''}</p>
        <div class="product-foot">
          <div class="product-price">${parseFloat(p.price).toFixed(2)} <span>TND</span></div>
          <button class="product-order-btn" title="Commander" onclick="event.stopPropagation(); openProductModal('${p.id}')">🛒 Commander</button>
        </div>
      </div>
    </div>
  `;
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

  const created = OrderStore.add(order);

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

  if (isDirectWhatsApp) {
    window.open(waUrl, '_blank');
  }

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

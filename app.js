const Store = {
  KEY: '3dcraft_products',
  CLEARED_FLAG: '3dcraft_mock_cleared_v2',
  async loadRemote() {
    // 1. Essai via GitHub API directe (temps réel immédiat sans cache CDN)
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

    // 2. Secours via raw.githubusercontent.com avec brise-cache
    try {
      const rawUrl = 'https://raw.githubusercontent.com/3dcraft-tn/3dcraft-tn.github.io/main/data/products.json?t=' + Date.now();
      const res = await fetch(rawUrl);
      if (res.ok) {
        const remote = await res.json();
        if (Array.isArray(remote) && remote.length > 0) {
          this.save(remote);
          return remote;
        }
      }
    } catch(e) {
      console.log('Using local products cache');
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
    localStorage.setItem(this.CLEARED_FLAG, 'true');
  },
  add(p) {
    const l = this.getAll();
    p.id = Date.now().toString();
    l.unshift(p);
    this.save(l);
    return p;
  },
  update(id, u) {
    const l = this.getAll(), i = l.findIndex(p => p.id === id);
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
  },
  init() {
    this.save([]);
    return [];
  }
};

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

function getEmoji(cat, i = 0) {
  const a = EMOJIS[cat] || ['📦'];
  return a[i % a.length];
}

function orderWA(n, p) {
  const msg = encodeURIComponent(`Bonjour 3D Craft! 👋\nJe souhaite commander:\n📦 Produit: ${n}\n💰 Prix: ${p} TND\n\nMerci de me confirmer la disponibilité.`);
  window.open(`https://wa.me/21646595833?text=${msg}`, '_blank');
}

function toast(m) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = m;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2800);
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

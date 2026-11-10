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
    <div class="product-card">
      <div class="product-img">
        ${img}
        <div class="product-badge-wrap">${badge}</div>
      </div>
      <div class="product-info">
        <span class="product-cat">${CATS[p.category]?.name || p.category}</span>
        <h3 class="product-name">${p.name}</h3>
        <p class="product-desc">${p.description || ''}</p>
        <div class="product-foot">
          <div class="product-price">${parseFloat(p.price).toFixed(2)} <span>TND</span></div>
          <button class="product-order-btn" title="Commander via WhatsApp" onclick="orderWA('${p.name}', '${p.price}')">💬</button>
        </div>
      </div>
    </div>
  `;
}

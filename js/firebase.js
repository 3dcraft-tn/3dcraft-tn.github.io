/**
 * 3D CRAFT - Firebase Firestore Cloud Sync
 * Project: dcraft-9aa3d
 */

const firebaseConfig = {
  apiKey: "AIzaSyBu2Mfv7nKNVyjI9ltopJnDzEDOHC7nX_0",
  authDomain: "dcraft-9aa3d.firebaseapp.com",
  projectId: "dcraft-9aa3d",
  storageBucket: "dcraft-9aa3d.firebasestorage.app",
  messagingSenderId: "347480331200",
  appId: "1:347480331200:web:20787545322ddc8a72ae25",
  measurementId: "G-JHMD784EEF"
};

let db = null;
let isFirebaseReady = false;

try {
  if (typeof firebase !== 'undefined' && firebase.initializeApp) {
    if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
    }
    db = firebase.firestore();
    isFirebaseReady = true;
    console.log('✅ Firebase Firestore connecté en temps réel (dcraft-9aa3d) !');
  }
} catch (e) {
  console.warn('Initialisation Firebase Firestore:', e);
}

const CloudStore = {
  isReady() {
    return isFirebaseReady && db !== null;
  },

  // ================= PRODUCTS =================
  listenProducts(callback) {
    if (!this.isReady()) return () => {};
    try {
      return db.collection('products').onSnapshot(
        snapshot => {
          const list = [];
          snapshot.forEach(doc => {
            list.push({ id: doc.id, ...doc.data() });
          });
          callback(list);
        },
        err => console.warn('Firestore listenProducts error:', err)
      );
    } catch(e) {
      return () => {};
    }
  },

  async getProducts() {
    if (!this.isReady()) return null;
    try {
      const snap = await db.collection('products').get();
      const list = [];
      snap.forEach(doc => list.push({ id: doc.id, ...doc.data() }));
      return list;
    } catch(e) {
      console.warn('Firestore getProducts error:', e);
      return null;
    }
  },

  async addProduct(product) {
    if (!this.isReady()) return null;
    try {
      const id = product.id || Date.now().toString();
      await db.collection('products').doc(id).set({
        ...product,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
      return { id, ...product };
    } catch(e) {
      console.warn('Firestore addProduct error:', e);
      return null;
    }
  },

  async updateProduct(id, data) {
    if (!this.isReady()) return null;
    try {
      await db.collection('products').doc(id).set({
        ...data,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
      return { id, ...data };
    } catch(e) {
      console.warn('Firestore updateProduct error:', e);
      return null;
    }
  },

  async deleteProduct(id) {
    if (!this.isReady()) return false;
    try {
      await db.collection('products').doc(id).delete();
      return true;
    } catch(e) {
      console.warn('Firestore deleteProduct error:', e);
      return false;
    }
  },

  // ================= ORDERS =================
  listenOrders(callback) {
    if (!this.isReady()) return () => {};
    try {
      return db.collection('orders').orderBy('date', 'desc').onSnapshot(
        snapshot => {
          const orders = [];
          snapshot.forEach(doc => {
            orders.push({ id: doc.id, ...doc.data() });
          });
          callback(orders);
        },
        err => {
          // Si l'index orderBy échoue, tenter sans orderBy
          db.collection('orders').onSnapshot(snap => {
            const list = [];
            snap.forEach(doc => list.push({ id: doc.id, ...doc.data() }));
            list.sort((a,b) => new Date(b.date||0) - new Date(a.date||0));
            callback(list);
          }, e => console.warn('Firestore listenOrders fallback error:', e));
        }
      );
    } catch(e) {
      return () => {};
    }
  },

  async getOrders() {
    if (!this.isReady()) return null;
    try {
      const snap = await db.collection('orders').get();
      const list = [];
      snap.forEach(doc => list.push({ id: doc.id, ...doc.data() }));
      list.sort((a,b) => new Date(b.date||0) - new Date(a.date||0));
      return list;
    } catch(e) {
      console.warn('Firestore getOrders error:', e);
      return null;
    }
  },

  async addOrder(order) {
    if (!this.isReady()) return null;
    try {
      const id = order.id || ('CMD-' + Math.floor(1000 + Math.random() * 9000));
      order.id = id;
      await db.collection('orders').doc(id).set({
        ...order,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      console.log('✅ Commande enregistrée dans Firebase Firestore:', id);
      return order;
    } catch(e) {
      console.warn('Firestore addOrder error:', e);
      return null;
    }
  },

  async updateOrderStatus(id, newStatus) {
    if (!this.isReady()) return null;
    try {
      await db.collection('orders').doc(id).update({
        status: newStatus,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      return true;
    } catch(e) {
      console.warn('Firestore updateOrderStatus error:', e);
      return false;
    }
  },

  async deleteOrder(id) {
    if (!this.isReady()) return false;
    try {
      await db.collection('orders').doc(id).delete();
      return true;
    } catch(e) {
      console.warn('Firestore deleteOrder error:', e);
      return false;
    }
  }
};

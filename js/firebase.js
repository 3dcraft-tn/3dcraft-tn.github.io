/**
 * 3D CRAFT - Configuration et Synchronisation Cloud Firebase Firestore
 */

// Configuration Firebase (sera complétée avec vos identifiants)
const firebaseConfig = {
  apiKey: "VOTRE_API_KEY",
  authDomain: "VOTRE_PROJECT_ID.firebaseapp.com",
  projectId: "VOTRE_PROJECT_ID",
  storageBucket: "VOTRE_PROJECT_ID.appspot.com",
  messagingSenderId: "VOTRE_SENDER_ID",
  appId: "VOTRE_APP_ID"
};

// Initialisation conditionnelle
let db = null;
let isFirebaseReady = false;

try {
  if (typeof firebase !== 'undefined' && firebaseConfig.apiKey !== 'VOTRE_API_KEY') {
    firebase.initializeApp(firebaseConfig);
    db = firebase.firestore();
    isFirebaseReady = true;
    console.log('✅ Firebase Firestore connecté avec succès !');
  } else {
    console.log('ℹ️ Firebase en attente de configuration. Utilisation du cache local.');
  }
} catch (e) {
  console.warn('Erreur initialisation Firebase:', e);
}

const CloudStore = {
  isReady() {
    return isFirebaseReady && db !== null;
  },

  // Écouter les produits en temps réel (pour index.html et pages catégories)
  listenProducts(callback) {
    if (!this.isReady()) return () => {};
    return db.collection('products').orderBy('createdAt', 'desc').onSnapshot(
      snapshot => {
        const products = [];
        snapshot.forEach(doc => {
          products.push({ id: doc.id, ...doc.data() });
        });
        callback(products);
      },
      error => {
        console.error('Erreur écoute Firestore:', error);
      }
    );
  },

  // Obtenir tous les produits une fois
  async getAll() {
    if (!this.isReady()) return null;
    try {
      const snap = await db.collection('products').orderBy('createdAt', 'desc').get();
      const list = [];
      snap.forEach(doc => list.push({ id: doc.id, ...doc.data() }));
      return list;
    } catch (e) {
      console.error('Erreur getAll Firestore:', e);
      return null;
    }
  },

  // Ajouter un produit
  async add(product) {
    if (!this.isReady()) return null;
    product.createdAt = firebase.firestore.FieldValue.serverTimestamp();
    const docRef = await db.collection('products').add(product);
    return { id: docRef.id, ...product };
  },

  // Modifier un produit
  async update(id, data) {
    if (!this.isReady()) return null;
    data.updatedAt = firebase.firestore.FieldValue.serverTimestamp();
    await db.collection('products').doc(id).update(data);
    return { id, ...data };
  },

  // Supprimer un produit
  async delete(id) {
    if (!this.isReady()) return false;
    await db.collection('products').doc(id).delete();
    return true;
  },

  // Initialiser les 19 produits par défaut dans Firestore s'il est vide
  async seedDefaults(defaults) {
    if (!this.isReady()) return;
    try {
      const snap = await db.collection('products').limit(1).get();
      if (snap.empty) {
        console.log('🌱 Initialisation du catalogue Firestore avec les produits de base...');
        const batch = db.batch();
        defaults.forEach(p => {
          const ref = db.collection('products').doc(p.id);
          batch.set(ref, {
            ...p,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
          });
        });
        await batch.commit();
        console.log('✅ 19 produits de base synchronisés dans Firestore !');
      }
    } catch (e) {
      console.warn('Erreur seedDefaults:', e);
    }
  }
};

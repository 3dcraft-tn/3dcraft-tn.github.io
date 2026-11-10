# 3D Craft - 3D Print Shop Tunisie 🌿🖨️

Une boutique en ligne moderne, élégante et conviviale dédiée à l'artisanat et à l'impression 3D en Tunisie (décoration d'intérieur, setup gaming, figurines anime, gadgets & jouets, accessoires de bureau).

Inspiré de l'expérience e-commerce de référence [Infinite Dimensions](https://infinitedimensions.tn/), repensé avec un thème épuré **blanc doux et vert pastel**, des pages dédiées par catégorie, et un **espace d'administration secret et sécurisé** pour gérer les produits et les prix en temps réel.

---

## ✨ Fonctionnalités Clés

### 🏪 1. Boutique Publique Conviviale
- **Thème Soft White & Light Green** : Design moderne, lumineux et relaxant avec ombres douces et accents vert émeraude.
- **Section "Nos Services" avec visuels immersifs** : 6 cartes de services (Modélisation 3D, Impression FDM haute résolution, Résine haute précision, Peinture artisanale, Prototypage rapide, Commandes sur mesure) avec arrière-plans photographiques et dégradés élégants.
- **Bouton flottant WhatsApp** : Commande directe en 1 clic préremplie avec le nom et le prix de l'article via WhatsApp (+216).
- **Statistiques en direct** : Compteurs d'articles par catégorie, création de badges promotionnels (*Nouveau*, *Populaire*, *Promo*).

### 📂 2. Pages Dédiées par Catégorie
Chaque catégorie possède sa propre vue et sa propre page avec filtres dynamiques (*Tous*, *Nouveautés*, *Populaires*, *Promotions*) :
1. 🏠 **Décoration Maison** (`pages/home-decor.html` & `#home-decor`) : Vases géométriques, veilleuses lithophanie, serre-livres dragons.
2. 🎮 **Gaming Setup** (`pages/gaming.html` & `#gaming`) : Supports de manettes, supports de casques, touches artisanales personnalisées.
3. ⚔️ **Anime & Figurines** (`pages/anime.html` & `#anime`) : Statuettes haute définition, personnages chibi, répliques d'épées.
4. 🧸 **Jouets & Gadgets** (`pages/toys.html` & `#toys`) : Figurines articulées print-in-place, dinosaures flexibles, puzzles 3D.
5. 🎧 **Accessoires de Bureau** (`pages/accessories.html` & `#accessories`) : Supports de téléphones, organisateurs de câbles magnétiques, ranges-stylos.
6. 🔧 **Outils & Atelier** (`pages/tools.html` & `#tools`) : Rangements d'embouts, gabarits et calibres de précision.
7. 🎁 **Idées Cadeaux** (`pages/gifts.html` & `#gifts`) : Lithophanies personnalisées, boîtes cryptex et surprises 3D.
8. 🔑 **Porte-clés Custom** (`pages/keychains.html` & `#keychains`) : Prénoms bicolores, emblèmes de voitures et codes Spotify.

### 🔐 3. Espace Admin Secret (Gestion Produits & Prix)
- **Totalement invisible du public** : Aucun lien dans la navigation du site pour garantir une discrétion absolue.
- **Accès protégé par mot de passe** :
  - **URL :** `/admin.html` (ou `/pages/admin.html`)
  - **Mot de passe :** `admin3dcraft2026`
- **Gestion Complète (CRUD en direct)** :
  - Ajouter un nouveau produit avec nom, catégorie, prix en TND, badge et description.
  - Modifier le prix ou les détails d'un article existant à tout moment.
  - Supprimer un produit obsolète avec confirmation.
  - Statistiques en direct du catalogue (Nombre d'articles, prix moyen, articles en vedette).
- **Sauvegarde & Restauration JSON** : Exportez tout votre catalogue en fichier `.json` en 1 clic pour garder une sauvegarde locale, ou importez-le sur un autre appareil.

---

## 📁 Structure du Répertoire (Single Repository)

```
3dcraft-shop/
├── index.html            # Boutique principale complète (Accueil + navigation par catégories)
├── admin.html            # Panneau d'administration secret protégé
├── style.css             # Feuille de style principale (Thème Soft White & Light Green)
├── app.js                # Logique du magasin, persistance locale & commande WhatsApp
├── vercel.json           # Configuration de déploiement automatique Vercel
├── .gitignore            # Fichiers ignorés par Git
├── README.md             # Documentation officielle du projet
├── assets/
│   ├── icon.png          # Logo officiel 3D Craft
│   └── icon.png          # Logo format PNG
├── css/
│   └── style.css         # Styles modulaires pour les sous-pages
├── js/
│   ├── main.js           # Moteur partagé du catalogue
│   └── admin.js          # Moteur du dashboard d'administration
└── pages/
    ├── home-decor.html   # Page dédiée Décoration
    ├── gaming.html       # Page dédiée Gaming
    ├── anime.html        # Page dédiée Anime & Figurines
    ├── toys.html         # Page dédiée Jouets & Gadgets
    ├── accessories.html  # Page dédiée Accessoires
    ├── tools.html        # Page dédiée Outils & Bricolage
    ├── gifts.html        # Page dédiée Idées Cadeaux
    ├── keychains.html    # Page dédiée Porte-clés Custom
    └── admin.html        # Version alternative du dashboard secret
```

---

## 🚀 Comment Lancer le Projet

### En Local (Sans aucun serveur requis)
Double-cliquez simplement sur `index.html` pour ouvrir la boutique dans votre navigateur (Chrome, Edge, Firefox, Safari).

### Déploiement sur GitHub Pages (Gratuit)
1. Créez un dépôt sur GitHub (ex: `3dcraft-shop`).
2. Poussez ce dossier sur la branche `main`.
3. Dans **Settings > Pages**, choisissez `Deploy from a branch` (branche `main`, dossier `/root`).
4. Votre site sera instantanément en ligne sur `https://<votre-compte>.github.io/3dcraft-shop/` !

### Déploiement sur Vercel (En 1 Clic)
1. Allez sur [vercel.com](https://vercel.com) > **Add New Project**.
2. Sélectionnez votre dépôt GitHub `3dcraft-shop`.
3. Cliquez sur **Deploy** (aucun réglage nécessaire grâce à `vercel.json`).

---

## 🔑 Identifiants d'Administration

- **Page Admin :** `admin.html`
- **Mot de passe :** `admin3dcraft2026`
- **Numéro WhatsApp de commande :** `+216 46 595 833`
- **Instagram :** [@3dcraft_services](https://www.instagram.com/3dcraft_services/)

---

© 2026 3D Craft - Tous droits réservés.

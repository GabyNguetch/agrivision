# 🌿 AgriVision

Plateforme web moderne de cartographie interactive pour visualiser et analyser les données de production agricole, pastorale et halieutique du Cameroun.

## ✨ Fonctionnalités

- 🗺️ **Carte Interactive** - Visualisation des divisions administratives (régions, départements, communes)
- 🌾 **Filières Agricoles** - Exploration des différentes filières et leurs produits
- 📊 **Statistiques Détaillées** - Données de production avec filtres multiples
- 🎨 **Design Moderne** - Interface élégante avec support du mode sombre/clair
- ⚡ **Performance Optimale** - Chargement rapide avec skeleton screens
- 📱 **Responsive** - Interface adaptée à tous les écrans
- 🔍 **Recherche Avancée** - Recherche et filtrage par filière, catégorie, produit, année
- 🗺️ **Zoom Intelligent** - Zoom automatique sur les zones sélectionnées
- 📈 **Visualisations** - Graphiques et statistiques en temps réel

## 🚀 Technologies

- **Next.js 14** - Framework React avec App Router
- **TypeScript** - Typage statique
- **Tailwind CSS** - Framework CSS utilitaire
- **Leaflet** - Bibliothèque de cartographie
- **Lucide React** - Icônes modernes
- **API Backend** - https://apiti.onrender.com

## 📦 Installation

### Prérequis

- Node.js 18+ 
- npm ou yarn

### Installation des dépendances

```bash
npm install
# ou
yarn install
```

### Lancement en développement

```bash
npm run dev
# ou
yarn dev
```

Ouvrez [http://localhost:3000](http://localhost:3000) dans votre navigateur.

### Build de production

```bash
npm run build
npm start
# ou
yarn build
yarn start
```

## 🎨 Structure du Projet

```
cameroun-agro-map/
├── app/                      # Pages Next.js (App Router)
│   ├── layout.tsx           # Layout principal
│   ├── page.tsx             # Page d'accueil
│   ├── map/                 # Page de la carte
│   │   └── page.tsx
│   └── globals.css          # Styles globaux
├── components/               # Composants réutilisables
│   ├── MapView.tsx          # Composant de la carte Leaflet
│   ├── Sidebar.tsx          # Barre latérale avec filtres
│   ├── Skeleton.tsx         # Composants de chargement
│   └── ThemeToggle.tsx      # Bouton de changement de thème
├── lib/                      # Utilitaires et services
│   └── api.ts               # Service API avec logging
├── types/                    # Types TypeScript
│   └── api.ts               # Types pour l'API
├── public/                   # Fichiers statiques
├── tailwind.config.js       # Configuration Tailwind
├── tsconfig.json            # Configuration TypeScript
└── package.json             # Dépendances
```

## 🔧 Configuration

### API Backend

L'application utilise l'API backend à l'adresse : `https://apiti.onrender.com`

Pour modifier l'URL de l'API, éditez le fichier `lib/api.ts` :

```typescript
const API_BASE_URL = 'https://apiti.onrender.com';
```

### Thème de couleurs

Le thème principal utilise des tons de vert. Pour personnaliser, modifiez `tailwind.config.js` :

```javascript
colors: {
  primary: {
    50: '#f0fdf4',
    // ... autres nuances
  },
}
```

## 📚 Utilisation

### Page d'accueil

- Affiche les statistiques globales
- Présente les fonctionnalités principales
- Liens vers la carte interactive

### Carte Interactive

1. **Filtres** - Sélectionnez une filière, catégorie ou produit
2. **Niveau de carte** - Choisissez entre régions, départements ou communes
3. **Recherche** - Recherchez des éléments spécifiques
4. **Interaction** - Cliquez sur une zone pour voir les détails
5. **Zoom** - La carte zoome automatiquement sur la sélection

### Logging

Toutes les requêtes API sont loggées dans la console du navigateur avec :
- 🔗 URL de la requête
- 📋 Méthode HTTP
- ✅ Réponse (en cas de succès)
- ❌ Erreur (en cas d'échec)

## 🎯 Routes API Principales

- `/api/v1/regions/` - Liste des régions
- `/api/v1/departements/` - Liste des départements
- `/api/v1/communes/` - Liste des communes
- `/api/v1/filieres/` - Liste des filières
- `/api/v1/produits/` - Liste des produits
- `/api/v1/productions/` - Données de production
- `/api/v1/geojson/regions` - GeoJSON des régions
- `/api/v1/statistiques/globales` - Statistiques globales

Voir la documentation Swagger complète : [https://apiti.onrender.com/docs](https://apiti.onrender.com/docs)

## 🌙 Mode Sombre

L'application détecte automatiquement les préférences du navigateur et s'adapte au mode clair/sombre. 
Un bouton de basculement est disponible dans l'en-tête.

## 🤝 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à ouvrir une issue ou une pull request.

## 📄 Licence

Ce projet est développé dans le cadre du projet 5GI 2025-2026.

## 👥 Auteurs

Projet réalisé par un groupe d'étudiants pour la cartographie des bassins de production du Cameroun.

---

**Note** : Cette application utilise les données ouvertes des organismes publics camerounais et est destinée à des fins éducatives et de visualisation.
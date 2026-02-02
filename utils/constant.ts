// Constantes de l'application

export const APP_NAME = 'AgriVision';
export const APP_DESCRIPTION = 'Plateforme de cartographie des données agricoles du Cameroun';

// Configuration de la carte
export const MAP_CONFIG = {
  DEFAULT_CENTER: [7.3697, 12.3547] as [number, number], // Centre du Cameroun
  DEFAULT_ZOOM: 6,
  MIN_ZOOM: 5,
  MAX_ZOOM: 18,
  TILE_URL: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  ATTRIBUTION: '© OpenStreetMap contributors',
} as const;

// Couleurs des niveaux de carte
export const MAP_LEVEL_COLORS = {
  regions: {
    fill: '#86efac',
    border: '#16a34a',
    selected: '#22c55e',
  },
  departements: {
    fill: '#6ee7b7',
    border: '#059669',
    selected: '#10b981',
  },
  communes: {
    fill: '#5eead4',
    border: '#0d9488',
    selected: '#14b8a6',
  },
} as const;

// Limites de pagination
export const PAGINATION = {
  DEFAULT_LIMIT: 100,
  MAX_LIMIT: 500,
  DEFAULT_SKIP: 0,
} as const;

// Délais pour les opérations asynchrones
export const DELAYS = {
  DEBOUNCE_SEARCH: 500,
  AUTO_REFRESH: 60000, // 1 minute
  TOAST_DURATION: 3000,
  ANIMATION_DURATION: 300,
} as const;

// Messages d'erreur
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Erreur de connexion. Veuillez vérifier votre connexion internet.',
  API_ERROR: 'Erreur lors de la récupération des données. Veuillez réessayer.',
  NOT_FOUND: 'Ressource non trouvée.',
  UNKNOWN_ERROR: 'Une erreur inattendue s\'est produite.',
  EMPTY_RESULT: 'Aucun résultat trouvé.',
} as const;

// Messages de succès
export const SUCCESS_MESSAGES = {
  DATA_LOADED: 'Données chargées avec succès',
  FILTER_APPLIED: 'Filtres appliqués',
  COPIED: 'Copié dans le presse-papiers',
} as const;

// Types de filières (exemples)
export const FILIERE_TYPES = [
  'Agriculture',
  'Élevage',
  'Pêche',
  'Foresterie',
] as const;

// Types de communes
export const COMMUNE_TYPES = [
  'urbaine',
  'rurale',
] as const;

// Types de zones halieutiques
export const ZONE_HALIEUTIQUE_TYPES = [
  'maritime',
  'fluviale',
  'lacustre',
] as const;

// Types d'infrastructures
export const INFRASTRUCTURE_TYPES = [
  'marché',
  'entrepôt',
  'coopérative',
  'usine_transformation',
  'point_collecte',
] as const;

// Unités de mesure
export const UNITES_MESURE = [
  'kg',
  'tonne',
  'litre',
  'unité',
  'sac',
] as const;

// Niveaux de fiabilité
export const NIVEAUX_FIABILITE = [
  'haute',
  'moyenne',
  'faible',
] as const;

// Saisons
export const SAISONS = [
  'saison_sèche',
  'saison_pluies',
  'toute_année',
] as const;

// Régions du Cameroun (pour référence)
export const CAMEROUN_REGIONS = [
  'Adamaoua',
  'Centre',
  'Est',
  'Extrême-Nord',
  'Littoral',
  'Nord',
  'Nord-Ouest',
  'Ouest',
  'Sud',
  'Sud-Ouest',
] as const;

// Routes de l'application
export const ROUTES = {
  HOME: '/',
  MAP: '/map',
  ABOUT: '/about',
  STATS: '/stats',
} as const;

// Configuration du thème
export const THEME = {
  COLORS: {
    primary: {
      50: '#f0fdf4',
      100: '#dcfce7',
      200: '#bbf7d0',
      300: '#86efac',
      400: '#4ade80',
      500: '#22c55e',
      600: '#16a34a',
      700: '#15803d',
      800: '#166534',
      900: '#14532d',
      950: '#052e16',
    },
  },
  FONTS: {
    display: 'Montserrat, system-ui, sans-serif',
    body: 'Open Sans, system-ui, sans-serif',
  },
} as const;

// Tailles d'écran (breakpoints Tailwind)
export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

// Configuration du cache
export const CACHE_CONFIG = {
  ENABLED: true,
  TTL: 300000, // 5 minutes
  MAX_SIZE: 100, // nombre maximum d'entrées
} as const;

// Formats d'export
export const EXPORT_FORMATS = [
  'json',
  'csv',
  'geojson',
  'pdf',
] as const;

// Configuration des animations
export const ANIMATION_CONFIG = {
  EASE: 'ease-out',
  DURATION: {
    fast: 150,
    normal: 300,
    slow: 500,
  },
} as const;

// Icônes par filière (mapping)
export const FILIERE_ICONS: Record<string, string> = {
  agriculture: '🌾',
  elevage: '🐄',
  peche: '🐟',
  foresterie: '🌳',
} as const;

// Emojis pour les statistiques
export const STAT_EMOJIS = {
  production: '📊',
  superficie: '📏',
  producteurs: '👥',
  valeur: '💰',
  rendement: '📈',
} as const;
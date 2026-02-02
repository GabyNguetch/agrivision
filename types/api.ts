// Types pour l'API Cameroun WebMapping

export interface Region {
  id: number;
  nom: string;
  code_region: string;
  chef_lieu: string | null;
  superficie_km2: number | null;
  population: number | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface Departement {
  id: number;
  nom: string;
  code_departement: string;
  chef_lieu: string | null;
  superficie_km2: number | null;
  population: number | null;
  region_id: number;
  created_at: string | null;
  updated_at: string | null;
}

export interface Commune {
  id: number;
  nom: string;
  code_commune: string;
  departement_id: number;
  type_commune: string | null;
  population: number | null;
  superficie_km2: number | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface Filiere {
  id: number;
  nom: string;
  code: string;
  description: string | null;
  couleur: string | null;
  icone: string | null;
  created_at: string | null;
}

export interface CategorieProduit {
  id: number;
  nom: string;
  code: string;
  filiere_id: number;
  description: string | null;
  icone: string | null;
  created_at: string | null;
}

export interface Produit {
  id: number;
  nom: string;
  code: string;
  categorie_id: number;
  nom_scientifique: string | null;
  unite_mesure: string | null;
  description: string | null;
  icone: string | null;
  couleur: string | null;
  created_at: string | null;
}

export interface Production {
  id: number;
  produit_id: number;
  annee: number;
  region_id: number | null;
  departement_id: number | null;
  commune_id: number | null;
  saison: string | null;
  quantite: number | null;
  valeur_fcfa: number | null;
  superficie_ha: number | null;
  rendement: number | null;
  nombre_producteurs: number | null;
  source_donnees: string | null;
  fiabilite: string | null;
  notes: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface Infrastructure {
  id: number;
  nom: string;
  type_infrastructure: string | null;
  commune_id: number | null;
  capacite: string | null;
  adresse: string | null;
  contact: string | null;
  created_at: string | null;
}

export interface ZoneHalieutique {
  id: number;
  nom: string;
  type_zone: string | null;
  superficie_km2: number | null;
  departements_concernes: string[] | null;
  especes_principales: string[] | null;
  created_at: string | null;
}

export interface BassinProduction {
  id: number;
  nom: string;
  code: string;
  filiere_id: number;
  description: string | null;
  produits_dominants: string[] | null;
  importance: string | null;
  created_at: string | null;
}

export interface GeoJSONFeature {
  type: 'Feature';
  geometry: {
    type: string;
    coordinates: any;
  };
  properties: Record<string, any>;
}

export interface GeoJSONFeatureCollection {
  type: 'FeatureCollection';
  features: GeoJSONFeature[];
}

export interface ApiResponse<T> {
  total: number;
  items: T[];
}

export interface StatistiquesGlobales {
  total_regions: number;
  total_departements: number;
  total_communes: number;
  total_filieres: number;
  total_produits: number;
  total_productions: number;
}

export type MapLevel = 'regions' | 'departements' | 'communes';

export interface FilterState {
  filiere_id: number | null;
  categorie_id: number | null;
  produit_id: number | null;
  annee: number | null;
  region_id: number | null;
  departement_id: number | null;
  commune_id: number | null;
  mapLevel: MapLevel;
}
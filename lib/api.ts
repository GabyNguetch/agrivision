// Service API avec cache en mémoire
import type {
  Region,
  Departement,
  Commune,
  Filiere,
  CategorieProduit,
  Produit,
  Production,
  Infrastructure,
  ApiResponse,
  GeoJSONFeatureCollection,
  StatistiquesGlobales,
} from '@/types/api';

const API_BASE_URL = 'https://apiti.onrender.com';

// ─── Cache en mémoire ─────────────────────────────────────────────────────────
// TTL = 5 minutes. Les données géographiques et les listes de référence
// (filières, catégories, produits) ne changent pas fréquemment :
// on les cache pour éviter des allers-retours réseau inutiles.
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes en ms

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const cache = new Map<string, CacheEntry<any>>();

function getFromCache<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL) {
    cache.delete(key); // expiré
    return null;
  }
  return entry.data as T;
}

function setInCache<T>(key: string, data: T): void {
  cache.set(key, { data, timestamp: Date.now() });
}

// ─── Fonction générique avec cache optionnel ─────────────────────────────────
async function fetchAPI<T>(endpoint: string, options?: RequestInit & { useCache?: boolean }): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const useCache = options?.useCache ?? false;

  // Vérifier le cache d'abord
  if (useCache) {
    const cached = getFromCache<T>(endpoint);
    if (cached) return cached;
  }

  try {
    const { useCache: _, ...fetchOptions } = options || {};
    const response = await fetch(url, {
      ...fetchOptions,
      headers: {
        'Content-Type': 'application/json',
        ...fetchOptions?.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    // Stocker dans le cache si demandé
    if (useCache) {
      setInCache(endpoint, data);
    }

    return data;
  } catch (error) {
    console.error(`[API] Erreur sur ${endpoint}:`, error);
    throw error;
  }
}

// ─── RÉGIONS ──────────────────────────────────────────────────────────────────
export const getRegions = (skip: number = 0, limit: number = 100) =>
  fetchAPI<ApiResponse<Region>>(`/api/v1/regions/?skip=${skip}&limit=${limit}`, { useCache: true });

export const searchRegions = (query: string, limit: number = 10) =>
  fetchAPI<Region[]>(`/api/v1/regions/search?q=${encodeURIComponent(query)}&limit=${limit}`);

export const getRegion = (regionId: number) =>
  fetchAPI<Region>(`/api/v1/regions/${regionId}`, { useCache: true });

export const getRegionDepartements = (regionId: number) =>
  fetchAPI<Departement[]>(`/api/v1/regions/${regionId}/departements`, { useCache: true });

export const getRegionProductions = (
  regionId: number,
  annee?: number,
  produitId?: number,
  limit: number = 100
) => {
  let url = `/api/v1/regions/${regionId}/productions?limit=${limit}`;
  if (annee) url += `&annee=${annee}`;
  if (produitId) url += `&produit_id=${produitId}`;
  return fetchAPI<Production[]>(url);
};

// ─── DÉPARTEMENTS ────────────────────────────────────────────────────────────
export const getDepartements = (skip: number = 0, limit: number = 100, regionId?: number) => {
  let url = `/api/v1/departements/?skip=${skip}&limit=${limit}`;
  if (regionId) url += `&region_id=${regionId}`;
  return fetchAPI<ApiResponse<Departement>>(url, { useCache: true });
};

export const searchDepartements = (query: string, limit: number = 10) =>
  fetchAPI<Departement[]>(`/api/v1/departements/search?q=${encodeURIComponent(query)}&limit=${limit}`);

export const getDepartement = (departementId: number) =>
  fetchAPI<Departement>(`/api/v1/departements/${departementId}`, { useCache: true });

export const getDepartementCommunes = (departementId: number) =>
  fetchAPI<Commune[]>(`/api/v1/departements/${departementId}/communes`, { useCache: true });

export const getDepartementProductions = (
  departementId: number,
  annee?: number,
  produitId?: number,
  limit: number = 100
) => {
  let url = `/api/v1/departements/${departementId}/productions?limit=${limit}`;
  if (annee) url += `&annee=${annee}`;
  if (produitId) url += `&produit_id=${produitId}`;
  return fetchAPI<Production[]>(url);
};

// ─── COMMUNES ─────────────────────────────────────────────────────────────────
export const getCommunes = (
  skip: number = 0,
  limit: number = 100,
  departementId?: number,
  typeCommune?: string
) => {
  let url = `/api/v1/communes/?skip=${skip}&limit=${limit}`;
  if (departementId) url += `&departement_id=${departementId}`;
  if (typeCommune) url += `&type_commune=${typeCommune}`;
  return fetchAPI<ApiResponse<Commune>>(url, { useCache: true });
};

export const searchCommunes = (query: string, limit: number = 10, departementId?: number) => {
  let url = `/api/v1/communes/search?q=${encodeURIComponent(query)}&limit=${limit}`;
  if (departementId) url += `&departement_id=${departementId}`;
  return fetchAPI<Commune[]>(url);
};

export const getCommune = (communeId: number) =>
  fetchAPI<Commune>(`/api/v1/communes/${communeId}`, { useCache: true });

export const getCommuneInfrastructures = (communeId: number) =>
  fetchAPI<Infrastructure[]>(`/api/v1/communes/${communeId}/infrastructures`, { useCache: true });

export const getCommuneProductions = (
  communeId: number,
  annee?: number,
  produitId?: number,
  limit: number = 100
) => {
  let url = `/api/v1/communes/${communeId}/productions?limit=${limit}`;
  if (annee) url += `&annee=${annee}`;
  if (produitId) url += `&produit_id=${produitId}`;
  return fetchAPI<Production[]>(url);
};

export const getCommuneResume = (communeId: number) =>
  fetchAPI<any>(`/api/v1/communes/${communeId}/resume`, { useCache: true });

// ─── FILIÈRES ─────────────────────────────────────────────────────────────────
export const getFilieres = (skip: number = 0, limit: number = 100) =>
  fetchAPI<ApiResponse<Filiere>>(`/api/v1/filieres/?skip=${skip}&limit=${limit}`, { useCache: true });

export const searchFilieres = (query: string, limit: number = 10) =>
  fetchAPI<Filiere[]>(`/api/v1/filieres/search?q=${encodeURIComponent(query)}&limit=${limit}`);

export const getFiliere = (filiereId: number) =>
  fetchAPI<Filiere>(`/api/v1/filieres/${filiereId}`, { useCache: true });

export const getFiliereCategories = (filiereId: number) =>
  fetchAPI<CategorieProduit[]>(`/api/v1/filieres/${filiereId}/categories`, { useCache: true });

export const getFiliereProduits = (filiereId: number) =>
  fetchAPI<Produit[]>(`/api/v1/filieres/${filiereId}/produits`, { useCache: true });

// ─── CATÉGORIES ───────────────────────────────────────────────────────────────
export const getCategories = (skip: number = 0, limit: number = 100, filiereId?: number) => {
  let url = `/api/v1/categories/?skip=${skip}&limit=${limit}`;
  if (filiereId) url += `&filiere_id=${filiereId}`;
  return fetchAPI<ApiResponse<CategorieProduit>>(url, { useCache: true });
};

export const getCategorie = (categorieId: number) =>
  fetchAPI<CategorieProduit>(`/api/v1/categories/${categorieId}`, { useCache: true });

export const getCategorieProduits = (categorieId: number) =>
  fetchAPI<Produit[]>(`/api/v1/categories/${categorieId}/produits`, { useCache: true });

// ─── PRODUITS ─────────────────────────────────────────────────────────────────
export const getProduits = (
  skip: number = 0,
  limit: number = 100,
  categorieId?: number,
  filiereId?: number
) => {
  let url = `/api/v1/produits/?skip=${skip}&limit=${limit}`;
  if (categorieId) url += `&categorie_id=${categorieId}`;
  if (filiereId) url += `&filiere_id=${filiereId}`;
  return fetchAPI<ApiResponse<Produit>>(url, { useCache: true });
};

export const searchProduits = (
  query: string,
  limit: number = 10,
  categorieId?: number,
  filiereId?: number
) => {
  let url = `/api/v1/produits/search?q=${encodeURIComponent(query)}&limit=${limit}`;
  if (categorieId) url += `&categorie_id=${categorieId}`;
  if (filiereId) url += `&filiere_id=${filiereId}`;
  return fetchAPI<Produit[]>(url);
};

export const getProduit = (produitId: number) =>
  fetchAPI<Produit>(`/api/v1/produits/${produitId}`, { useCache: true });

export const getProduitResume = (produitId: number, annee?: number) => {
  let url = `/api/v1/produits/${produitId}/resume`;
  if (annee) url += `?annee=${annee}`;
  return fetchAPI<any>(url);
};

// ─── PRODUCTIONS ──────────────────────────────────────────────────────────────
export const getProductions = (params: {
  skip?: number;
  limit?: number;
  annee?: number;
  annee_debut?: number;
  annee_fin?: number;
  produit_id?: number;
  categorie_id?: number;
  filiere_id?: number;
  region_id?: number;
  departement_id?: number;
  commune_id?: number;
  saison?: string;
}) => {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      searchParams.append(key, String(value));
    }
  });
  return fetchAPI<ApiResponse<Production>>(`/api/v1/productions/?${searchParams.toString()}`);
};

export const getAnneesDisponibles = () =>
  fetchAPI<number[]>(`/api/v1/productions/annees`, { useCache: true });

export const getSaisonsDisponibles = () =>
  fetchAPI<string[]>(`/api/v1/productions/saisons`, { useCache: true });

export const getProductionsParAnnee = (
  produitId?: number,
  regionId?: number,
  anneeDebut?: number,
  anneeFin?: number
) => {
  let url = `/api/v1/productions/par-annee`;
  const params = new URLSearchParams();
  if (produitId) params.append('produit_id', String(produitId));
  if (regionId) params.append('region_id', String(regionId));
  if (anneeDebut) params.append('annee_debut', String(anneeDebut));
  if (anneeFin) params.append('annee_fin', String(anneeFin));
  if (params.toString()) url += `?${params.toString()}`;
  return fetchAPI<any>(url);
};

export const getProductionsParRegion = (annee?: number, produitId?: number) => {
  let url = `/api/v1/productions/par-region`;
  const params = new URLSearchParams();
  if (annee) params.append('annee', String(annee));
  if (produitId) params.append('produit_id', String(produitId));
  if (params.toString()) url += `?${params.toString()}`;
  return fetchAPI<any>(url);
};

export const getProductionsParProduit = (annee?: number, regionId?: number) => {
  let url = `/api/v1/productions/par-produit`;
  const params = new URLSearchParams();
  if (annee) params.append('annee', String(annee));
  if (regionId) params.append('region_id', String(regionId));
  if (params.toString()) url += `?${params.toString()}`;
  return fetchAPI<any>(url);
};

// ─── STATISTIQUES ─────────────────────────────────────────────────────────────
export const getStatistiquesGlobales = () =>
  fetchAPI<StatistiquesGlobales>(`/api/v1/statistiques/globales`, { useCache: true });

export const getStatistiquesProduction = (annee?: number) => {
  let url = `/api/v1/statistiques/production`;
  if (annee) url += `?annee=${annee}`;
  return fetchAPI<any>(url);
};

export const getEvolutionProduction = (
  produitId?: number,
  regionId?: number,
  anneeDebut?: number,
  anneeFin?: number
) => {
  let url = `/api/v1/statistiques/evolution`;
  const params = new URLSearchParams();
  if (produitId) params.append('produit_id', String(produitId));
  if (regionId) params.append('region_id', String(regionId));
  if (anneeDebut) params.append('annee_debut', String(anneeDebut));
  if (anneeFin) params.append('annee_fin', String(anneeFin));
  if (params.toString()) url += `?${params.toString()}`;
  return fetchAPI<any>(url);
};

export const getTopRegions = (annee?: number, produitId?: number, limit: number = 10) => {
  let url = `/api/v1/statistiques/top-regions?limit=${limit}`;
  if (annee) url += `&annee=${annee}`;
  if (produitId) url += `&produit_id=${produitId}`;
  return fetchAPI<any>(url);
};

export const getTopProduits = (annee?: number, regionId?: number, limit: number = 10) => {
  let url = `/api/v1/statistiques/top-produits?limit=${limit}`;
  if (annee) url += `&annee=${annee}`;
  if (regionId) url += `&region_id=${regionId}`;
  return fetchAPI<any>(url);
};

// ─── GEOJSON (toujours cacné — données géographiques stables) ────────────────
export const getRegionsGeoJSON = () =>
  fetchAPI<GeoJSONFeatureCollection>(`/api/v1/geojson/regions`, { useCache: true });

export const getDepartementsGeoJSON = (regionId?: number) => {
  let url = `/api/v1/geojson/departements`;
  if (regionId) url += `?region_id=${regionId}`;
  return fetchAPI<GeoJSONFeatureCollection>(url, { useCache: true });
};

export const getCommunesGeoJSON = (departementId?: number) => {
  let url = `/api/v1/geojson/communes`;
  if (departementId) url += `?departement_id=${departementId}`;
  return fetchAPI<GeoJSONFeatureCollection>(url, { useCache: true });
};

export const getInfrastructuresGeoJSON = (typeInfrastructure?: string, communeId?: number) => {
  let url = `/api/v1/geojson/infrastructures`;
  const params = new URLSearchParams();
  if (typeInfrastructure) params.append('type_infrastructure', typeInfrastructure);
  if (communeId) params.append('commune_id', String(communeId));
  if (params.toString()) url += `?${params.toString()}`;
  return fetchAPI<GeoJSONFeatureCollection>(url, { useCache: true });
};
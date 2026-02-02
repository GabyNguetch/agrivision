// Service API avec logging détaillé
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

// Fonction de logging
const logApiCall = (endpoint: string, method: string = 'GET', response?: any, error?: any) => {
  const timestamp = new Date().toISOString();
  const url = `${API_BASE_URL}${endpoint}`;
  
  console.group(`%c[API Call] ${method} ${endpoint}`, 'color: #22c55e; font-weight: bold');
  console.log('🕐 Timestamp:', timestamp);
  console.log('🔗 URL:', url);
  console.log('📋 Method:', method);
  
  if (response) {
    console.log('✅ Response:', response);
  }
  
  if (error) {
    console.error('❌ Error:', error);
  }
  
  console.groupEnd();
};

// Fonction générique pour les appels API
async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      logApiCall(endpoint, options?.method || 'GET', null, { status: response.status, message: errorText });
      throw new Error(`API Error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    logApiCall(endpoint, options?.method || 'GET', data);
    
    return data;
  } catch (error) {
    logApiCall(endpoint, options?.method || 'GET', null, error);
    throw error;
  }
}

// ========== RÉGIONS ==========
export const getRegions = (skip: number = 0, limit: number = 100) =>
  fetchAPI<ApiResponse<Region>>(`/api/v1/regions/?skip=${skip}&limit=${limit}`);

export const searchRegions = (query: string, limit: number = 10) =>
  fetchAPI<Region[]>(`/api/v1/regions/search?q=${encodeURIComponent(query)}&limit=${limit}`);

export const getRegion = (regionId: number) =>
  fetchAPI<Region>(`/api/v1/regions/${regionId}`);

export const getRegionDepartements = (regionId: number) =>
  fetchAPI<Departement[]>(`/api/v1/regions/${regionId}/departements`);

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

// ========== DÉPARTEMENTS ==========
export const getDepartements = (skip: number = 0, limit: number = 100, regionId?: number) => {
  let url = `/api/v1/departements/?skip=${skip}&limit=${limit}`;
  if (regionId) url += `&region_id=${regionId}`;
  return fetchAPI<ApiResponse<Departement>>(url);
};

export const searchDepartements = (query: string, limit: number = 10) =>
  fetchAPI<Departement[]>(`/api/v1/departements/search?q=${encodeURIComponent(query)}&limit=${limit}`);

export const getDepartement = (departementId: number) =>
  fetchAPI<Departement>(`/api/v1/departements/${departementId}`);

export const getDepartementCommunes = (departementId: number) =>
  fetchAPI<Commune[]>(`/api/v1/departements/${departementId}/communes`);

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

// ========== COMMUNES ==========
export const getCommunes = (
  skip: number = 0,
  limit: number = 100,
  departementId?: number,
  typeCommune?: string
) => {
  let url = `/api/v1/communes/?skip=${skip}&limit=${limit}`;
  if (departementId) url += `&departement_id=${departementId}`;
  if (typeCommune) url += `&type_commune=${typeCommune}`;
  return fetchAPI<ApiResponse<Commune>>(url);
};

export const searchCommunes = (query: string, limit: number = 10, departementId?: number) => {
  let url = `/api/v1/communes/search?q=${encodeURIComponent(query)}&limit=${limit}`;
  if (departementId) url += `&departement_id=${departementId}`;
  return fetchAPI<Commune[]>(url);
};

export const getCommune = (communeId: number) =>
  fetchAPI<Commune>(`/api/v1/communes/${communeId}`);

export const getCommuneInfrastructures = (communeId: number) =>
  fetchAPI<Infrastructure[]>(`/api/v1/communes/${communeId}/infrastructures`);

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
  fetchAPI<any>(`/api/v1/communes/${communeId}/resume`);

// ========== FILIÈRES ==========
export const getFilieres = (skip: number = 0, limit: number = 100) =>
  fetchAPI<ApiResponse<Filiere>>(`/api/v1/filieres/?skip=${skip}&limit=${limit}`);

export const searchFilieres = (query: string, limit: number = 10) =>
  fetchAPI<Filiere[]>(`/api/v1/filieres/search?q=${encodeURIComponent(query)}&limit=${limit}`);

export const getFiliere = (filiereId: number) =>
  fetchAPI<Filiere>(`/api/v1/filieres/${filiereId}`);

export const getFiliereCategories = (filiereId: number) =>
  fetchAPI<CategorieProduit[]>(`/api/v1/filieres/${filiereId}/categories`);

export const getFiliereProduits = (filiereId: number) =>
  fetchAPI<Produit[]>(`/api/v1/filieres/${filiereId}/produits`);

// ========== CATÉGORIES ==========
export const getCategories = (skip: number = 0, limit: number = 100, filiereId?: number) => {
  let url = `/api/v1/categories/?skip=${skip}&limit=${limit}`;
  if (filiereId) url += `&filiere_id=${filiereId}`;
  return fetchAPI<ApiResponse<CategorieProduit>>(url);
};

export const getCategorie = (categorieId: number) =>
  fetchAPI<CategorieProduit>(`/api/v1/categories/${categorieId}`);

export const getCategorieProduits = (categorieId: number) =>
  fetchAPI<Produit[]>(`/api/v1/categories/${categorieId}/produits`);

// ========== PRODUITS ==========
export const getProduits = (
  skip: number = 0,
  limit: number = 100,
  categorieId?: number,
  filiereId?: number
) => {
  let url = `/api/v1/produits/?skip=${skip}&limit=${limit}`;
  if (categorieId) url += `&categorie_id=${categorieId}`;
  if (filiereId) url += `&filiere_id=${filiereId}`;
  return fetchAPI<ApiResponse<Produit>>(url);
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
  fetchAPI<Produit>(`/api/v1/produits/${produitId}`);

export const getProduitResume = (produitId: number, annee?: number) => {
  let url = `/api/v1/produits/${produitId}/resume`;
  if (annee) url += `?annee=${annee}`;
  return fetchAPI<any>(url);
};

// ========== PRODUCTIONS ==========
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
  fetchAPI<number[]>(`/api/v1/productions/annees`);

export const getSaisonsDisponibles = () =>
  fetchAPI<string[]>(`/api/v1/productions/saisons`);

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

// ========== STATISTIQUES ==========
export const getStatistiquesGlobales = () =>
  fetchAPI<StatistiquesGlobales>(`/api/v1/statistiques/globales`);

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

// ========== GEOJSON ==========
export const getRegionsGeoJSON = () =>
  fetchAPI<GeoJSONFeatureCollection>(`/api/v1/geojson/regions`);

export const getDepartementsGeoJSON = (regionId?: number) => {
  let url = `/api/v1/geojson/departements`;
  if (regionId) url += `?region_id=${regionId}`;
  return fetchAPI<GeoJSONFeatureCollection>(url);
};

export const getCommunesGeoJSON = (departementId?: number) => {
  let url = `/api/v1/geojson/communes`;
  if (departementId) url += `?departement_id=${departementId}`;
  return fetchAPI<GeoJSONFeatureCollection>(url);
};

export const getInfrastructuresGeoJSON = (typeInfrastructure?: string, communeId?: number) => {
  let url = `/api/v1/geojson/infrastructures`;
  const params = new URLSearchParams();
  if (typeInfrastructure) params.append('type_infrastructure', typeInfrastructure);
  if (communeId) params.append('commune_id', String(communeId));
  if (params.toString()) url += `?${params.toString()}`;
  return fetchAPI<GeoJSONFeatureCollection>(url);
};
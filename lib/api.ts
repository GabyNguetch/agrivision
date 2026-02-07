// ─── Service API avec cache optimisé + console logging ──────────────────────
import type {
  Region, Departement, Commune, Filiere, CategorieProduit, Produit,
  Production, Infrastructure, ApiResponse, GeoJSONFeatureCollection,
  StatistiquesGlobales, ZoneHalieutique, BassinProduction, SourceDonnees,
} from '@/types/api';

const API_BASE_URL = 'https://apiti.onrender.com';

// ─── Cache amélioré (TTL 10 min pour GeoJSON, 5 min pour le reste) ──────────
const CACHE_TTL_GEOJSON = 10 * 60 * 1000; // 10 minutes pour GeoJSON
const CACHE_TTL_DEFAULT = 5 * 60 * 1000;  // 5 minutes pour le reste

interface CacheEntry<T> { data: T; timestamp: number; }
const cache = new Map<string, CacheEntry<any>>();

function getFromCache<T>(key: string, ttl: number = CACHE_TTL_DEFAULT): T | null {
  const e = cache.get(key);
  if (!e) return null;
  if (Date.now() - e.timestamp > ttl) { 
    cache.delete(key); 
    return null; 
  }
  return e.data as T;
}

function setInCache<T>(key: string, data: T) { 
  cache.set(key, { data, timestamp: Date.now() }); 
}

// ─── Nettoyage périodique du cache ───────────────────────────────────────────
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of cache.entries()) {
    if (now - entry.timestamp > CACHE_TTL_GEOJSON) {
      cache.delete(key);
    }
  }
}, 60000); // Nettoie toutes les minutes

// ─── Core fetch optimisé ─────────────────────────────────────────────────────
async function fetchAPI<T>(
  endpoint: string, 
  options?: RequestInit & { useCache?: boolean; cacheTTL?: number }
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const useCache = options?.useCache ?? false;
  const cacheTTL = options?.cacheTTL ?? CACHE_TTL_DEFAULT;

  if (useCache) {
    const cached = getFromCache<T>(endpoint, cacheTTL);
    if (cached) {
      console.log('%c[API ⚡ CACHE] %c' + endpoint, 'color:#10b981;font-weight:700', 'color:#6b7280');
      return cached;
    }
  }

  console.log('%c[API →] %c' + endpoint, 'color:#3b82f6;font-weight:700', 'color:#6b7280');
  const start = performance.now();

  try {
    const { useCache: _, cacheTTL: __, ...fetchOpts } = options || {};
    const response = await fetch(url, { 
      ...fetchOpts, 
      headers: { 
        'Content-Type': 'application/json', 
        ...fetchOpts?.headers 
      },
      // Ajout de timeout
      signal: AbortSignal.timeout(15000) // 15 secondes max
    });
    
    const elapsed = (performance.now() - start).toFixed(1);

    if (!response.ok) {
      const errText = await response.text();
      console.error('%c[API ✕] %c' + endpoint + ' — ' + response.status, 'color:#ef4444;font-weight:700', 'color:#6b7280', errText);
      throw new Error(`API Error: ${response.status} - ${errText}`);
    }

    const data = await response.json();
    console.log('%c[API ✓] %c' + endpoint + ' %c(' + elapsed + ' ms)', 'color:#22c55e;font-weight:700', 'color:#6b7280', 'color:#9ca3af');
    
    if (useCache) setInCache(endpoint, data);
    return data;
  } catch (error) {
    if (error instanceof Error && error.name === 'TimeoutError') {
      console.error('%c[API ⏱️  TIMEOUT] %c' + endpoint, 'color:#f59e0b;font-weight:700', 'color:#6b7280');
    } else {
      console.error('%c[API ✕] %c' + endpoint, 'color:#ef4444;font-weight:700', 'color:#6b7280', error);
    }
    throw error;
  }
}

// ─── RÉGIONS ─────────────────────────────────────────────────────────────────
export const getRegions = (skip=0, limit=100) => 
  fetchAPI<ApiResponse<Region>>(`/api/v1/regions/?skip=${skip}&limit=${limit}`, {useCache:true});

export const searchRegions = (q:string, limit=10) => 
  fetchAPI<Region[]>(`/api/v1/regions/search?q=${encodeURIComponent(q)}&limit=${limit}`);

export const getRegion = (id:number) => 
  fetchAPI<Region>(`/api/v1/regions/${id}`, {useCache:true});

export const getRegionDepartements = (id:number) => 
  fetchAPI<Departement[]>(`/api/v1/regions/${id}/departements`, {useCache:true});

export const getRegionProductions = (id:number, annee?:number, produitId?:number, limit=100) => {
  let u = `/api/v1/regions/${id}/productions?limit=${limit}`;
  if(annee) u+=`&annee=${annee}`; 
  if(produitId) u+=`&produit_id=${produitId}`;
  return fetchAPI<Production[]>(u);
};

// ─── DÉPARTEMENTS ───────────────────────────────────────────────────────────
export const getDepartements = (skip=0, limit=100, regionId?:number) => {
  let u = `/api/v1/departements/?skip=${skip}&limit=${limit}`;
  if(regionId) u+=`&region_id=${regionId}`;
  return fetchAPI<ApiResponse<Departement>>(u, {useCache:true});
};

export const searchDepartements = (q:string, limit=10) => 
  fetchAPI<Departement[]>(`/api/v1/departements/search?q=${encodeURIComponent(q)}&limit=${limit}`);

export const getDepartement = (id:number) => 
  fetchAPI<Departement>(`/api/v1/departements/${id}`, {useCache:true});

export const getDepartementCommunes = (id:number) => 
  fetchAPI<Commune[]>(`/api/v1/departements/${id}/communes`, {useCache:true});

export const getDepartementProductions = (id:number, annee?:number, produitId?:number, limit=100) => {
  let u = `/api/v1/departements/${id}/productions?limit=${limit}`;
  if(annee) u+=`&annee=${annee}`; 
  if(produitId) u+=`&produit_id=${produitId}`;
  return fetchAPI<Production[]>(u);
};

// ─── COMMUNES ────────────────────────────────────────────────────────────────
export const getCommunes = (skip=0, limit=100, deptId?:number, type?:string) => {
  let u = `/api/v1/communes/?skip=${skip}&limit=${limit}`;
  if(deptId) u+=`&departement_id=${deptId}`; 
  if(type) u+=`&type_commune=${type}`;
  return fetchAPI<ApiResponse<Commune>>(u, {useCache:true});
};

export const searchCommunes = (q:string, limit=10, deptId?:number) => {
  let u = `/api/v1/communes/search?q=${encodeURIComponent(q)}&limit=${limit}`;
  if(deptId) u+=`&departement_id=${deptId}`;
  return fetchAPI<Commune[]>(u);
};

export const getCommune = (id:number) => 
  fetchAPI<Commune>(`/api/v1/communes/${id}`, {useCache:true});

export const getCommuneInfrastructures = (id:number) => 
  fetchAPI<Infrastructure[]>(`/api/v1/communes/${id}/infrastructures`, {useCache:true});

export const getCommuneProductions = (id:number, annee?:number, produitId?:number, limit=100) => {
  let u = `/api/v1/communes/${id}/productions?limit=${limit}`;
  if(annee) u+=`&annee=${annee}`; 
  if(produitId) u+=`&produit_id=${produitId}`;
  return fetchAPI<Production[]>(u);
};

export const getCommuneResume = (id:number) => 
  fetchAPI<any>(`/api/v1/communes/${id}/resume`, {useCache:true});

// ─── FILIÈRES ────────────────────────────────────────────────────────────────
export const getFilieres = (skip=0, limit=100) => 
  fetchAPI<ApiResponse<Filiere>>(`/api/v1/filieres/?skip=${skip}&limit=${limit}`, {useCache:true});

export const searchFilieres = (q:string, limit=10) => 
  fetchAPI<Filiere[]>(`/api/v1/filieres/search?q=${encodeURIComponent(q)}&limit=${limit}`);

export const getFiliere = (id:number) => 
  fetchAPI<Filiere>(`/api/v1/filieres/${id}`, {useCache:true});

export const getFiliereCategories = (id:number) => 
  fetchAPI<CategorieProduit[]>(`/api/v1/filieres/${id}/categories`, {useCache:true});

export const getFiliereProduits = (id:number) => 
  fetchAPI<Produit[]>(`/api/v1/filieres/${id}/produits`, {useCache:true});

// ─── CATÉGORIES ──────────────────────────────────────────────────────────────
export const getCategories = (skip=0, limit=100, filiereId?:number) => {
  let u = `/api/v1/categories/?skip=${skip}&limit=${limit}`;
  if(filiereId) u+=`&filiere_id=${filiereId}`;
  return fetchAPI<ApiResponse<CategorieProduit>>(u, {useCache:true});
};

export const getCategorie = (id:number) => 
  fetchAPI<CategorieProduit>(`/api/v1/categories/${id}`, {useCache:true});

export const getCategorieProduits = (id:number) => 
  fetchAPI<Produit[]>(`/api/v1/categories/${id}/produits`, {useCache:true});

// ─── PRODUITS ────────────────────────────────────────────────────────────────
export const getProduits = (skip=0, limit=100, catId?:number, filId?:number) => {
  let u = `/api/v1/produits/?skip=${skip}&limit=${limit}`;
  if(catId) u+=`&categorie_id=${catId}`; 
  if(filId) u+=`&filiere_id=${filId}`;
  return fetchAPI<ApiResponse<Produit>>(u, {useCache:true});
};

export const searchProduits = (q:string, limit=10, catId?:number, filId?:number) => {
  let u = `/api/v1/produits/search?q=${encodeURIComponent(q)}&limit=${limit}`;
  if(catId) u+=`&categorie_id=${catId}`; 
  if(filId) u+=`&filiere_id=${filId}`;
  return fetchAPI<Produit[]>(u);
};

export const getProduit = (id:number) => 
  fetchAPI<Produit>(`/api/v1/produits/${id}`, {useCache:true});

export const getProduitResume = (id:number, annee?:number) => {
  let u = `/api/v1/produits/${id}/resume`; 
  if(annee) u+=`?annee=${annee}`;
  return fetchAPI<any>(u);
};

// ─── PRODUCTIONS ─────────────────────────────────────────────────────────────
export const getProductions = (params: Record<string,any>) => {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k,v])=> { 
    if(v!=null) sp.append(k,String(v)); 
  });
  return fetchAPI<ApiResponse<Production>>(`/api/v1/productions/?${sp}`);
};

export const getAnneesDisponibles = () => 
  fetchAPI<number[]>(`/api/v1/productions/annees`, {useCache:true, cacheTTL: CACHE_TTL_GEOJSON});

export const getSaisonsDisponibles = () => 
  fetchAPI<string[]>(`/api/v1/productions/saisons`, {useCache:true, cacheTTL: CACHE_TTL_GEOJSON});

export const getProductionsResume = (annee?:number) => 
  fetchAPI<any>(`/api/v1/productions/resume${annee?'?annee='+annee:''}`);

export const getProductionsParAnnee = (produitId?:number, regionId?:number, anneeDebut?:number, anneeFin?:number) => {
  const p = new URLSearchParams();
  if(produitId) p.append('produit_id',String(produitId));
  if(regionId) p.append('region_id',String(regionId));
  if(anneeDebut) p.append('annee_debut',String(anneeDebut));
  if(anneeFin) p.append('annee_fin',String(anneeFin));
  return fetchAPI<any>(`/api/v1/productions/par-annee${p.toString()?'?'+p:''}`);
};

export const getProductionsParRegion = (annee?:number, produitId?:number) => {
  const p=new URLSearchParams(); 
  if(annee) p.append('annee',String(annee)); 
  if(produitId) p.append('produit_id',String(produitId));
  return fetchAPI<any>(`/api/v1/productions/par-region${p.toString()?'?'+p:''}`);
};

export const getProductionsParProduit = (annee?:number, regionId?:number) => {
  const p=new URLSearchParams(); 
  if(annee) p.append('annee',String(annee)); 
  if(regionId) p.append('region_id',String(regionId));
  return fetchAPI<any>(`/api/v1/productions/par-produit${p.toString()?'?'+p:''}`);
};

// ─── BASSINS ─────────────────────────────────────────────────────────────────
export const getBassins = (skip=0,limit=100,filId?:number) => {
  let u=`/api/v1/bassins/?skip=${skip}&limit=${limit}`; 
  if(filId) u+=`&filiere_id=${filId}`;
  return fetchAPI<ApiResponse<BassinProduction>>(u,{useCache:true});
};

export const searchBassins = (q:string,limit=10) => 
  fetchAPI<BassinProduction[]>(`/api/v1/bassins/search?q=${encodeURIComponent(q)}&limit=${limit}`);

export const getBassin = (id:number) => 
  fetchAPI<BassinProduction>(`/api/v1/bassins/${id}`,{useCache:true});

export const getBassinGeoJSON = (id:number) => 
  fetchAPI<GeoJSONFeatureCollection>(`/api/v1/bassins/${id}/geojson`,{useCache:true, cacheTTL: CACHE_TTL_GEOJSON});

export const getBassinsFilierGeoJSON = (id:number)=> 
  fetchAPI<GeoJSONFeatureCollection>(`/api/v1/bassins/filiere/${id}/geojson`,{useCache:true, cacheTTL: CACHE_TTL_GEOJSON});

// ─── ZONES HALIEUTIQUES ──────────────────────────────────────────────────────
export const getZonesHalieutiques = (skip=0,limit=100,type?:string) => {
  let u=`/api/v1/zones-halieutiques/?skip=${skip}&limit=${limit}`; 
  if(type) u+=`&type_zone=${type}`;
  return fetchAPI<ApiResponse<ZoneHalieutique>>(u,{useCache:true});
};

export const getTypesZones = () => 
  fetchAPI<string[]>(`/api/v1/zones-halieutiques/types`,{useCache:true, cacheTTL: CACHE_TTL_GEOJSON});

export const getZoneHalieutique = (id:number) => 
  fetchAPI<ZoneHalieutique>(`/api/v1/zones-halieutiques/${id}`,{useCache:true});

export const getZoneHalieutiqueGeoJSON = (id:number) => 
  fetchAPI<GeoJSONFeatureCollection>(`/api/v1/zones-halieutiques/${id}/geojson`,{useCache:true, cacheTTL: CACHE_TTL_GEOJSON});

// ─── INFRASTRUCTURES ────────────────────────────────────────────────────────
export const getInfrastructures = (skip=0,limit=100,type?:string,communeId?:number) => {
  let u=`/api/v1/infrastructures/?skip=${skip}&limit=${limit}`;
  if(type) u+=`&type_infrastructure=${type}`; 
  if(communeId) u+=`&commune_id=${communeId}`;
  return fetchAPI<ApiResponse<Infrastructure>>(u,{useCache:true});
};

export const getTypesInfrastructures = () => 
  fetchAPI<string[]>(`/api/v1/infrastructures/types`,{useCache:true, cacheTTL: CACHE_TTL_GEOJSON});

export const getStatsInfrastructures = () => 
  fetchAPI<any>(`/api/v1/infrastructures/stats`,{useCache:true});

export const getInfrastructure = (id:number) => 
  fetchAPI<Infrastructure>(`/api/v1/infrastructures/${id}`,{useCache:true});

export const getInfrastructureGeoJSON = (id:number) => 
  fetchAPI<GeoJSONFeatureCollection>(`/api/v1/infrastructures/${id}/geojson`,{useCache:true, cacheTTL: CACHE_TTL_GEOJSON});

// ─── STATISTIQUES ────────────────────────────────────────────────────────────
export const getStatistiquesGlobales = () => 
  fetchAPI<StatistiquesGlobales>(`/api/v1/statistiques/globales`,{useCache:true, cacheTTL: CACHE_TTL_GEOJSON});

export const getStatistiquesProduction = (annee?:number) => 
  fetchAPI<any>(`/api/v1/statistiques/production${annee?'?annee='+annee:''}`);

export const getEvolutionProduction = (produitId?:number,regionId?:number,anneeDebut?:number,anneeFin?:number) => {
  const p=new URLSearchParams();
  if(produitId) p.append('produit_id',String(produitId)); 
  if(regionId) p.append('region_id',String(regionId));
  if(anneeDebut) p.append('annee_debut',String(anneeDebut)); 
  if(anneeFin) p.append('annee_fin',String(anneeFin));
  return fetchAPI<any>(`/api/v1/statistiques/evolution${p.toString()?'?'+p:''}`);
};

export const getTopRegions = (annee?:number,produitId?:number,limit=10) => {
  let u=`/api/v1/statistiques/top-regions?limit=${limit}`;
  if(annee) u+=`&annee=${annee}`; 
  if(produitId) u+=`&produit_id=${produitId}`;
  return fetchAPI<any>(u);
};

export const getTopProduits = (annee?:number,regionId?:number,limit=10) => {
  let u=`/api/v1/statistiques/top-produits?limit=${limit}`;
  if(annee) u+=`&annee=${annee}`; 
  if(regionId) u+=`&region_id=${regionId}`;
  return fetchAPI<any>(u);
};

export const comparerAnnees = (ref:number,cmp:number,produitId?:number,regionId?:number) => {
  let u=`/api/v1/statistiques/comparaison/annees?annee_reference=${ref}&annee_comparaison=${cmp}`;
  if(produitId) u+=`&produit_id=${produitId}`; 
  if(regionId) u+=`&region_id=${regionId}`;
  return fetchAPI<any>(u);
};

// ─── SOURCES ─────────────────────────────────────────────────────────────────
export const getSources = (skip=0,limit=100) => 
  fetchAPI<ApiResponse<SourceDonnees>>(`/api/v1/sources/?skip=${skip}&limit=${limit}`,{useCache:true});

export const getSource = (id:number) => 
  fetchAPI<SourceDonnees>(`/api/v1/sources/${id}`,{useCache:true});

// ─── GEOJSON (Cache long - 10 min) ──────────────────────────────────────────
export const getRegionsGeoJSON = () => 
  fetchAPI<GeoJSONFeatureCollection>(`/api/v1/geojson/regions`,{useCache:true, cacheTTL: CACHE_TTL_GEOJSON});

export const getDepartementsGeoJSON = (regionId?:number) => 
  fetchAPI<GeoJSONFeatureCollection>(
    `/api/v1/geojson/departements${regionId?'?region_id='+regionId:''}`,
    {useCache:true, cacheTTL: CACHE_TTL_GEOJSON}
  );

export const getCommunesGeoJSON = (deptId?:number) => 
  fetchAPI<GeoJSONFeatureCollection>(
    `/api/v1/geojson/communes${deptId?'?departement_id='+deptId:''}`,
    {useCache:true, cacheTTL: CACHE_TTL_GEOJSON}
  );

export const getZonesHalieutiquesGeoJSON = (type?:string) => 
  fetchAPI<GeoJSONFeatureCollection>(
    `/api/v1/geojson/zones-halieutiques${type?'?type_zone='+type:''}`,
    {useCache:true, cacheTTL: CACHE_TTL_GEOJSON}
  );

export const getBassinsGeoJSON = (filId?:number) => 
  fetchAPI<GeoJSONFeatureCollection>(
    `/api/v1/geojson/bassins${filId?'?filiere_id='+filId:''}`,
    {useCache:true, cacheTTL: CACHE_TTL_GEOJSON}
  );

export const getInfrastructuresGeoJSON = (type?:string,communeId?:number) => {
  const p=new URLSearchParams(); 
  if(type) p.append('type_infrastructure',type); 
  if(communeId) p.append('commune_id',String(communeId));
  return fetchAPI<GeoJSONFeatureCollection>(
    `/api/v1/geojson/infrastructures${p.toString()?'?'+p:''}`,
    {useCache:true, cacheTTL: CACHE_TTL_GEOJSON}
  );
};
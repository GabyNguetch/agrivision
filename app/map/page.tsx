'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { ArrowLeft, Leaf, BarChart3 } from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';
import type { GeoJSONFeatureCollection, MapLevel } from '@/types/api';
import {
  getRegionsGeoJSON, getDepartementsGeoJSON, getCommunesGeoJSON,
  getRegion, getDepartement, getCommuneResume,
  getRegionProductions, getDepartementProductions,
  getProductions,
} from '@/lib/api';

// ✨ Chargement dynamique sans SSR
const MapView = dynamic(() => import('@/components/MapView'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-900 dark:to-gray-950 flex items-center justify-center rounded-xl">
      <div className="text-center">
        <div className="inline-block w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-gray-600 dark:text-gray-400 text-base font-semibold animate-pulse">
          Chargement de la carte…
        </p>
      </div>
    </div>
  ),
});

const Sidebar = dynamic(() => import('@/components/Sidebar'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-white dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800 flex items-center justify-center">
      <div className="inline-block w-8 h-8 border-3 border-green-500 border-t-transparent rounded-full animate-spin" />
    </div>
  ),
});

export default function MapPage() {
  const [mapLevel, setMapLevel] = useState<MapLevel>('regions');
  const [geoData, setGeoData] = useState<GeoJSONFeatureCollection | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedEntity, setSelectedEntity] = useState<any>(null);
  const [selectedFeatureId, setSelectedFeatureId] = useState<number | null>(null);

  const [filters, setFilters] = useState({
    filiere_id: null as number | null,
    categorie_id: null as number | null,
    produit_id: null as number | null,
    annee: null as number | null,
  });

  // Cache pour GeoJSON de base (sans enrichissement)
  const baseGeoDataCache = useRef<Map<MapLevel, GeoJSONFeatureCollection>>(new Map());
  
  // Debounce timer
  const debounceTimer = useRef<NodeJS.Timeout>();

  // ── Load GeoJSON optimisé avec cache local ──────────────────────────────────
  const loadGeoData = useCallback(async () => {
    const startTime = performance.now();
    console.log(
      `%c🗺️  [MapPage] Loading GeoJSON for level: ${mapLevel}`,
      'color: #3b82f6; font-weight: bold',
      filters
    );
    
    setLoading(true);
    
    try {
      let baseData: GeoJSONFeatureCollection;
      
      // Vérifier le cache local d'abord
      const cached = baseGeoDataCache.current.get(mapLevel);
      if (cached && !filters.produit_id && !filters.filiere_id && !filters.annee) {
        console.log('%c⚡ Using cached base GeoJSON', 'color: #10b981; font-weight: bold');
        baseData = cached;
      } else {
        // Charger depuis l'API (avec cache HTTP)
        switch (mapLevel) {
          case 'regions':
            baseData = await getRegionsGeoJSON();
            break;
          case 'departements':
            baseData = await getDepartementsGeoJSON(filters.filiere_id || undefined);
            break;
          case 'communes':
            baseData = await getCommunesGeoJSON();
            break;
          default:
            baseData = await getRegionsGeoJSON();
        }
        
        // Mettre en cache si pas de filtres
        if (!filters.produit_id && !filters.filiere_id && !filters.annee) {
          baseGeoDataCache.current.set(mapLevel, baseData);
        }
      }

      // Enrichir avec les productions seulement si nécessaire
      if (filters.produit_id || filters.filiere_id || filters.annee) {
        console.log('%c📊 Enriching with production data...', 'color: #8b5cf6; font-weight: bold');
        
        const productionsData = await getProductions({
          filiere_id: filters.filiere_id,
          categorie_id: filters.categorie_id,
          produit_id: filters.produit_id,
          annee: filters.annee,
          limit: 500,
        });

        const productions = productionsData.items || [];

        // Grouper par zone de manière optimisée
        const productionsByZone = new Map<number, {total: number; count: number}>();
        
        for (const prod of productions) {
          let zoneId: number | null = null;
          
          if (mapLevel === 'regions') zoneId = prod.region_id;
          else if (mapLevel === 'departements') zoneId = prod.departement_id;
          else if (mapLevel === 'communes') zoneId = prod.commune_id;

          if (!zoneId) continue;

          const existing = productionsByZone.get(zoneId) || { total: 0, count: 0 };
          existing.total += prod.quantite || 0;
          existing.count += 1;
          productionsByZone.set(zoneId, existing);
        }

        // Enrichir features de manière optimisée
        baseData = {
          ...baseData,
          features: baseData.features.map(feature => {
            const prodData = productionsByZone.get(feature.properties.id);
            return {
              ...feature,
              properties: {
                ...feature.properties,
                production_total: prodData?.total || 0,
                production_count: prodData?.count || 0,
              },
            };
          }),
        };

        console.log(`%c✅ Enriched ${baseData.features.length} features`, 'color: #22c55e; font-weight: bold');
      }

      setGeoData(baseData);
      
      const elapsed = (performance.now() - startTime).toFixed(1);
      console.log(`%c✅ GeoJSON ready in ${elapsed}ms`, 'color: #22c55e; font-weight: bold');
    } catch (e) {
      console.error('%c❌ GeoJSON load failed:', 'color: #ef4444; font-weight: bold', e);
    } finally {
      setLoading(false);
    }
  }, [mapLevel, filters]);

  // Debounced load
  useEffect(() => {
    // Clear existing timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Si changement de niveau, charger immédiatement
    if (!filters.produit_id && !filters.filiere_id && !filters.annee) {
      loadGeoData();
    } else {
      // Sinon, debounce de 300ms pour les filtres
      debounceTimer.current = setTimeout(() => {
        loadGeoData();
      }, 300);
    }

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [mapLevel, filters, loadGeoData]);

  // ── Feature click ─────────────────────────────────────────────────────────
  const handleFeatureClick = useCallback(async (properties: any) => {
    console.log(`%c🖱️  Feature clicked:`, 'color: #8b5cf6; font-weight: bold', properties);
    setSelectedFeatureId(properties.id);
    
    try {
      let entityData: any;
      
      switch (mapLevel) {
        case 'regions': {
          entityData = await getRegion(properties.id);
          if (filters.produit_id || filters.annee) {
            const prods = await getRegionProductions(
              properties.id,
              filters.annee || undefined,
              filters.produit_id || undefined
            );
            entityData = { ...entityData, productions: prods };
          }
          break;
        }
        case 'departements': {
          entityData = await getDepartement(properties.id);
          if (filters.produit_id || filters.annee) {
            const prods = await getDepartementProductions(
              properties.id,
              filters.annee || undefined,
              filters.produit_id || undefined
            );
            entityData = { ...entityData, productions: prods };
          }
          break;
        }
        case 'communes':
          entityData = await getCommuneResume(properties.id);
          break;
        default:
          entityData = properties;
      }
      
      setSelectedEntity(entityData);
      console.log('%c✅ Entity loaded', 'color: #22c55e; font-weight: bold');
    } catch (e) {
      console.error('%c❌ Detail fetch failed:', 'color: #ef4444; font-weight: bold', e);
      setSelectedEntity(properties);
    }
  }, [mapLevel, filters]);

  const handleFilterChange = useCallback((nf: any) => {
    console.log('%c🔄 Filters changing:', 'color: #f59e0b; font-weight: bold', nf);
    setFilters(nf);
  }, []);

  const handleMapLevelChange = useCallback((level: MapLevel) => {
    console.log(`%c🗺️  Map level changing to: ${level}`, 'color: #3b82f6; font-weight: bold');
    setMapLevel(level);
    setSelectedEntity(null);
    setSelectedFeatureId(null);
  }, []);

  // Mémoriser le nombre de zones
  const zoneCount = useMemo(() => geoData?.features.length || 0, [geoData]);

  return (
    <div className="h-screen flex flex-col bg-white dark:bg-gray-950">
      {/* Header */}
      <header className="flex-shrink-0 bg-white/95 dark:bg-gray-950/95 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 z-10">
        <div className="px-4 md:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all">
              <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </Link>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-gradient-to-br from-green-400 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                <Leaf className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-base font-display font-bold text-gray-900 dark:text-white leading-tight">
                  AgriVision
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400 capitalize flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  {mapLevel}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/stats"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-lg text-sm font-medium transition-all shadow-md hover:shadow-lg"
            >
              <BarChart3 className="w-4 h-4" /> Stats
            </Link>
            <div className="px-3 py-1 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg border border-green-200 dark:border-green-800">
              <span className="text-xs font-semibold">
                {loading ? '…' : `${zoneCount} zones`}
              </span>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div className="w-80 lg:w-96 flex-shrink-0 overflow-hidden border-r border-gray-200 dark:border-gray-800">
          <Sidebar
            onFilterChange={handleFilterChange}
            onMapLevelChange={handleMapLevelChange}
            selectedEntity={selectedEntity}
            currentMapLevel={mapLevel}
          />
        </div>

        {/* Map */}
        <div className="flex-1 p-3 md:p-5 overflow-hidden bg-gradient-to-br from-gray-50 to-white dark:from-gray-950 dark:to-gray-900">
          <MapView
            geoData={geoData}
            loading={loading}
            mapLevel={mapLevel}
            onFeatureClick={handleFeatureClick}
            selectedFeatureId={selectedFeatureId}
          />
        </div>
      </div>
    </div>
  );
}
'use client';

import { useState, useEffect, useCallback } from 'react';
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

// ✨ Chargement dynamique sans SSR pour performance maximale ✨
const MapView = dynamic(() => import('@/components/MapView'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-900 dark:to-gray-950 flex items-center justify-center rounded-xl">
      <div className="text-center">
        <div className="inline-block w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-gray-600 dark:text-gray-400 text-base font-semibold animate-pulse">
          Chargement de la carte MapTiler…
        </p>
        <p className="text-gray-400 dark:text-gray-500 text-xs mt-2">
          Initialisation des tuiles haute performance
        </p>
      </div>
    </div>
  ),
});

// Chargement différé du Sidebar (non visible initialement sur mobile)
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

  // ── Load GeoJSON + Filter (avec cache et optimisation) ────────────────────
  const loadGeoData = useCallback(async () => {
    const startTime = performance.now();
    console.log(
      `%c🗺️  [MapPage] Loading GeoJSON for level: ${mapLevel}`,
      'color: #3b82f6; font-weight: bold',
      filters
    );
    
    setLoading(true);
    
    try {
      let data: GeoJSONFeatureCollection;
      
      switch (mapLevel) {
        case 'regions':
          data = await getRegionsGeoJSON();
          break;
        case 'departements':
          data = await getDepartementsGeoJSON(filters.filiere_id || undefined);
          break;
        case 'communes':
          data = await getCommunesGeoJSON();
          break;
        default:
          data = await getRegionsGeoJSON();
      }

      // Enrichir avec les productions si filtrées
      if (filters.produit_id || filters.filiere_id || filters.annee) {
        console.log('%c📊 [MapPage] Enriching GeoJSON with production data...', 'color: #8b5cf6; font-weight: bold');
        
        const productionsData = await getProductions({
          filiere_id: filters.filiere_id,
          categorie_id: filters.categorie_id,
          produit_id: filters.produit_id,
          annee: filters.annee,
          limit: 500,
        });

        const productions = productionsData.items || [];

        // Grouper par zone
        const productionsByZone = productions.reduce((acc: any, prod: any) => {
          let zoneId: number | null = null;
          
          if (mapLevel === 'regions') zoneId = prod.region_id;
          else if (mapLevel === 'departements') zoneId = prod.departement_id;
          else if (mapLevel === 'communes') zoneId = prod.commune_id;

          if (!zoneId) return acc;

          if (!acc[zoneId]) {
            acc[zoneId] = { total: 0, count: 0 };
          }
          acc[zoneId].total += prod.quantite || 0;
          acc[zoneId].count += 1;
          return acc;
        }, {});

        // Enrichir features
        data.features = data.features.map(feature => ({
          ...feature,
          properties: {
            ...feature.properties,
            production_total: productionsByZone[feature.properties.id]?.total || 0,
            production_count: productionsByZone[feature.properties.id]?.count || 0,
          },
        }));

        console.log(`%c✅ [MapPage] Enriched ${data.features.length} features with production data`, 'color: #22c55e; font-weight: bold');
      }

      setGeoData(data);
      
      const elapsed = (performance.now() - startTime).toFixed(1);
      console.log(`%c✅ [MapPage] GeoJSON loaded in ${elapsed}ms — ${data.features.length} features`, 'color: #22c55e; font-weight: bold');
    } catch (e) {
      console.error('%c❌ [MapPage] GeoJSON load failed:', 'color: #ef4444; font-weight: bold', e);
    } finally {
      setLoading(false);
    }
  }, [mapLevel, filters]);

  useEffect(() => {
    loadGeoData();
  }, [loadGeoData]);

  // ── Feature click ─────────────────────────────────────────────────────────
  const handleFeatureClick = useCallback(async (properties: any) => {
    console.log(`%c🖱️  [MapPage] Feature clicked:`, 'color: #8b5cf6; font-weight: bold', properties);
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
      console.log('%c✅ [MapPage] Entity data loaded', 'color: #22c55e; font-weight: bold');
    } catch (e) {
      console.error('%c❌ [MapPage] Detail fetch failed:', 'color: #ef4444; font-weight: bold', e);
      setSelectedEntity(properties);
    }
  }, [mapLevel, filters]);

  const handleFilterChange = useCallback((nf: any) => {
    console.log('%c🔄 [MapPage] Filters changed:', 'color: #f59e0b; font-weight: bold', nf);
    setFilters(nf);
  }, []);

  const handleMapLevelChange = useCallback((level: MapLevel) => {
    console.log(`%c🗺️  [MapPage] Map level changed to: ${level}`, 'color: #3b82f6; font-weight: bold');
    setMapLevel(level);
    setSelectedEntity(null);
    setSelectedFeatureId(null);
  }, []);

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
                {geoData ? `${geoData.features.length} zones` : '…'}
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
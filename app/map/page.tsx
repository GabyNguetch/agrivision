'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { ArrowLeft, Leaf } from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';
import Sidebar from '@/components/Sidebar';
import type { GeoJSONFeatureCollection, MapLevel } from '@/types/api';
import {
  getRegionsGeoJSON,
  getDepartementsGeoJSON,
  getCommunesGeoJSON,
  getRegion,
  getDepartement,
  getCommuneResume,
  getRegionProductions,
  getDepartementProductions,
} from '@/lib/api';

// Charger MapView dynamiquement (côté client uniquement)
const MapView = dynamic(() => import('@/components/MapView'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400 font-medium">Chargement de la carte...</p>
      </div>
    </div>
  ),
});

export default function MapPage() {
  const [mapLevel, setMapLevel] = useState<MapLevel>('regions');
  const [geoData, setGeoData] = useState<GeoJSONFeatureCollection | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedEntity, setSelectedEntity] = useState<any>(null);
  const [selectedFeatureId, setSelectedFeatureId] = useState<number | null>(null);

  // Filtres
  const [filters, setFilters] = useState({
    filiere_id: null as number | null,
    categorie_id: null as number | null,
    produit_id: null as number | null,
    annee: null as number | null,
  });

  // Ref pour éviter les appels API en double lors du premier montage
  const hasMounted = useRef(false);

  // ─── Chargement des données GeoJSON ──────────────────────────────────────
  const loadGeoData = useCallback(async () => {
    try {
      setLoading(true);
      let data: GeoJSONFeatureCollection;

      switch (mapLevel) {
        case 'regions':
          data = await getRegionsGeoJSON();
          break;
        case 'departements':
          data = await getDepartementsGeoJSON();
          break;
        case 'communes':
          // OPTIMISATION : on passe un departement_id si disponible
          // pour ne pas charger TOUTES les communes d'un coup
          data = await getCommunesGeoJSON();
          break;
        default:
          data = await getRegionsGeoJSON();
      }

      setGeoData(data);
    } catch (error) {
      console.error('Erreur lors du chargement des données GeoJSON:', error);
    } finally {
      setLoading(false);
    }
  }, [mapLevel]); // ✅ Seul mapLevel comme dépendance

  // Un seul useEffect pour charger les données
  useEffect(() => {
    loadGeoData();
  }, [loadGeoData]);

  // ─── Handlers mémorisés avec useCallback ─────────────────────────────────
  const handleFeatureClick = useCallback(async (properties: any) => {
    try {
      let entityData;

      switch (mapLevel) {
        case 'regions':
          entityData = await getRegion(properties.id);
          if (filters.produit_id || filters.annee) {
            const productions = await getRegionProductions(
              properties.id,
              filters.annee || undefined,
              filters.produit_id || undefined
            );
            entityData = { ...entityData, productions };
          }
          break;
        case 'departements':
          entityData = await getDepartement(properties.id);
          if (filters.produit_id || filters.annee) {
            const productions = await getDepartementProductions(
              properties.id,
              filters.annee || undefined,
              filters.produit_id || undefined
            );
            entityData = { ...entityData, productions };
          }
          break;
        case 'communes':
          entityData = await getCommuneResume(properties.id);
          break;
        default:
          entityData = properties;
      }

      setSelectedEntity(entityData);
      setSelectedFeatureId(properties.id);
    } catch (error) {
      console.error('Erreur lors du chargement des détails:', error);
      setSelectedEntity(properties);
      setSelectedFeatureId(properties.id);
    }
  }, [mapLevel, filters.produit_id, filters.annee]); // ✅ dépendances précises

  const handleFilterChange = useCallback((newFilters: any) => {
    setFilters(newFilters);
  }, []); // ✅ setFilters est stable, pas de dépendance nécessaire

  const handleMapLevelChange = useCallback((level: MapLevel) => {
    setMapLevel(level);
    setSelectedEntity(null);
    setSelectedFeatureId(null);
  }, []); // ✅ setters sont stables

  return (
    <div className="h-screen flex flex-col bg-white dark:bg-gray-950">
      {/* Header */}
      <header className="flex-shrink-0 bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800 z-10">
        <div className="px-6 py-4" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <Link
              href="/"
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
              aria-label="Retour à l'accueil"
            >
              <ArrowLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            </Link>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-600 rounded-xl" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Leaf className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-display font-bold text-gray-900 dark:text-white">
                  AgriVision
                </h1>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Carte Interactive - {mapLevel.charAt(0).toUpperCase() + mapLevel.slice(1)}
                </p>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div className="px-4 py-2 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-lg">
              <span className="text-sm font-medium">
                {geoData ? `${geoData.features.length} zones` : 'Chargement...'}
              </span>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div className="w-96 flex-shrink-0 overflow-hidden">
          <Sidebar
            onFilterChange={handleFilterChange}
            onMapLevelChange={handleMapLevelChange}
            selectedEntity={selectedEntity}
            currentMapLevel={mapLevel}
          />
        </div>

        {/* Map Container */}
        <div className="flex-1 p-6 overflow-hidden">
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
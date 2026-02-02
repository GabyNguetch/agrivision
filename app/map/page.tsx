'use client';

import { useState, useEffect } from 'react';
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
  getCommune,
  getCommuneResume,
  getRegionProductions,
  getDepartementProductions,
  getCommuneProductions,
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

  // Charger les données géographiques au montage
  useEffect(() => {
    loadGeoData();
  }, [mapLevel]);

  // Recharger les données quand les filtres changent
  useEffect(() => {
    if (filters.filiere_id || filters.categorie_id || filters.produit_id) {
      loadGeoData();
    }
  }, [filters]);

  const loadGeoData = async () => {
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
          data = await getCommunesGeoJSON();
          break;
        default:
          data = await getRegionsGeoJSON();
      }

      setGeoData(data);
      console.log(`%c[MAP PAGE] Données GeoJSON chargées pour ${mapLevel}`, 'color: #22c55e; font-weight: bold', {
        featuresCount: data.features.length,
      });
    } catch (error) {
      console.error('Erreur lors du chargement des données GeoJSON:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFeatureClick = async (properties: any) => {
    console.log('%c[MAP PAGE] Zone sélectionnée', 'color: #22c55e; font-weight: bold', properties);
    
    try {
      let entityData;
      let productions;

      switch (mapLevel) {
        case 'regions':
          entityData = await getRegion(properties.id);
          if (filters.produit_id || filters.annee) {
            productions = await getRegionProductions(
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
            productions = await getDepartementProductions(
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
  };

  const handleFilterChange = (newFilters: any) => {
    console.log('%c[MAP PAGE] Filtres mis à jour', 'color: #22c55e; font-weight: bold', newFilters);
    setFilters(newFilters);
  };

  const handleMapLevelChange = (level: MapLevel) => {
    console.log('%c[MAP PAGE] Niveau de carte changé', 'color: #22c55e; font-weight: bold', level);
    setMapLevel(level);
    setSelectedEntity(null);
    setSelectedFeatureId(null);
  };

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
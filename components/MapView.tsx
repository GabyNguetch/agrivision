'use client';

import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { GeoJSONFeatureCollection, MapLevel } from '@/types/api';
import { SkeletonMap } from './Skeleton';

interface MapViewProps {
  geoData: GeoJSONFeatureCollection | null;
  loading: boolean;
  mapLevel: MapLevel;
  onFeatureClick?: (properties: any) => void;
  selectedFeatureId?: number | null;
}

export default function MapView({
  geoData,
  loading,
  mapLevel,
  onFeatureClick,
  selectedFeatureId,
}: MapViewProps) {
  const mapRef = useRef<L.Map | null>(null);
  const geoJsonLayerRef = useRef<L.GeoJSON | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [mapReady, setMapReady] = useState(false);

  // Initialiser la carte immédiatement au montage
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    try {
      // Configuration optimisée pour un chargement rapide
      const map = L.map(mapContainerRef.current, {
        center: [7.3697, 12.3547],
        zoom: 6,
        zoomControl: false,
        preferCanvas: true, // Utiliser Canvas au lieu de SVG (plus rapide)
        fadeAnimation: false, // Désactiver les animations de fade
        zoomAnimation: true,
        markerZoomAnimation: false,
      });

      // Ajouter le contrôle de zoom
      L.control.zoom({ position: 'topright' }).addTo(map);

      // Tuiles optimisées avec cache
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap',
        maxZoom: 19,
        minZoom: 5,
        updateWhenIdle: true, // Mettre à jour uniquement quand l'utilisateur arrête de zoomer
        updateWhenZooming: false, // Ne pas mettre à jour pendant le zoom
        keepBuffer: 2, // Garder plus de tuiles en cache
      }).addTo(map);

      mapRef.current = map;
      setMapReady(true);

      console.log('%c[MAP] ⚡ Carte initialisée rapidement', 'color: #22c55e; font-weight: bold');
    } catch (error) {
      console.error('[MAP] Erreur:', error);
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        setMapReady(false);
      }
    };
  }, []);

  // Mettre à jour les données GeoJSON avec optimisations
  useEffect(() => {
    if (!mapRef.current || !mapReady || !geoData) return;

    // Supprimer l'ancienne couche
    if (geoJsonLayerRef.current) {
      mapRef.current.removeLayer(geoJsonLayerRef.current);
    }

    console.log('%c[MAP] 📍 Chargement GeoJSON', 'color: #3b82f6', {
      features: geoData.features.length,
    });

    // Style optimisé (fonction simple)
    const getStyle = (feature: any) => {
      const isSelected = feature?.properties?.id === selectedFeatureId;
      return {
        fillColor: isSelected ? '#22c55e' : '#86efac',
        weight: isSelected ? 3 : 1,
        opacity: 1,
        color: isSelected ? '#15803d' : '#16a34a',
        fillOpacity: isSelected ? 0.7 : 0.5,
      };
    };

    // Créer la couche GeoJSON avec options de performance
    const geoJsonLayer = L.geoJSON(geoData, {
      style: getStyle,
      // Utiliser onEachFeature de manière optimisée
      onEachFeature: (feature, layer) => {
        const props = feature.properties;
        if (!props) return;

        const name = props.nom || props.name || 'Sans nom';

        // Tooltip léger
        layer.bindTooltip(name, {
          permanent: false,
          direction: 'center',
          className: 'map-tooltip',
          opacity: 0.9,
        });

        // Events optimisés
        layer.on('click', () => {
          if (onFeatureClick) {
            onFeatureClick(props);
          }
        });

        // Hover effects légers
        if (props.id !== selectedFeatureId) {
          layer.on('mouseover', function() {
            this.setStyle({ fillOpacity: 0.7, weight: 2 });
          });
          layer.on('mouseout', function() {
            this.setStyle({ fillOpacity: 0.5, weight: 1 });
          });
        }
      },
    });

    geoJsonLayer.addTo(mapRef.current);
    geoJsonLayerRef.current = geoJsonLayer;

    // Ajuster la vue rapidement
    try {
      const bounds = geoJsonLayer.getBounds();
      if (bounds.isValid()) {
        mapRef.current.fitBounds(bounds, { 
          padding: [50, 50],
          animate: false, // Pas d'animation pour un ajustement instantané
        });
      }
    } catch (error) {
      console.error('[MAP] Erreur bounds:', error);
    }
  }, [geoData, mapReady, selectedFeatureId, mapLevel, onFeatureClick]);

  // Zoom optimisé sur sélection
  useEffect(() => {
    if (!mapRef.current || !geoJsonLayerRef.current || !selectedFeatureId) return;

    geoJsonLayerRef.current.eachLayer((layer: any) => {
      const feature = layer.feature;
      if (feature?.properties?.id === selectedFeatureId) {
        const bounds = layer.getBounds();
        if (bounds.isValid()) {
          mapRef.current!.fitBounds(bounds, { 
            padding: [100, 100],
            maxZoom: 10,
            animate: true, // Animation seulement pour le zoom utilisateur
            duration: 0.5,
          });
        }
      }
    });
  }, [selectedFeatureId]);

  // Afficher skeleton pendant le chargement
  if (loading) {
    return <SkeletonMap />;
  }

  return (
    <div className="relative w-full h-full">
      <div
        ref={mapContainerRef}
        className="w-full h-full rounded-xl overflow-hidden border-2 border-gray-200 dark:border-gray-800 shadow-2xl"
      />
      
      {!geoData && !loading && mapReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100/80 dark:bg-gray-900/80 rounded-xl backdrop-blur-sm pointer-events-none">
          <div className="text-center p-8">
            <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            <p className="text-gray-600 dark:text-gray-400 text-lg font-medium">
              Sélectionnez des filtres pour afficher les données
            </p>
          </div>
        </div>
      )}

      <style jsx global>{`
        /* Optimisations CSS pour performance */
        .leaflet-container {
          font-family: inherit;
        }
        
        .map-tooltip {
          background: rgba(255, 255, 255, 0.95) !important;
          border: 2px solid #22c55e !important;
          border-radius: 8px !important;
          padding: 6px 10px !important;
          font-weight: 600 !important;
          font-size: 13px !important;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15) !important;
          backdrop-filter: blur(4px) !important;
          pointer-events: none !important;
        }
        
        .dark .map-tooltip {
          background: rgba(31, 41, 55, 0.95) !important;
          border-color: #16a34a !important;
          color: white !important;
        }
        
        /* Supprimer les attributions pour gagner de l'espace */
        .leaflet-control-attribution {
          font-size: 10px !important;
          background: rgba(255, 255, 255, 0.7) !important;
          padding: 2px 5px !important;
        }
        
        .dark .leaflet-control-attribution {
          background: rgba(0, 0, 0, 0.5) !important;
          color: rgba(255, 255, 255, 0.7) !important;
        }
        
        /* Optimiser les transitions */
        .leaflet-tile {
          will-change: opacity;
        }
        
        .leaflet-zoom-anim .leaflet-zoom-animated {
          will-change: transform;
        }
      `}</style>
    </div>
  );
}
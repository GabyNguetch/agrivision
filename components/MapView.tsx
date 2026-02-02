'use client';

import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
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

  // ✅ OPTIMISATION : stocker onFeatureClick dans un ref
  // Ça évite de relancer le useEffect chaque fois que la fonction change
  const onFeatureClickRef = useRef(onFeatureClick);
  useEffect(() => {
    onFeatureClickRef.current = onFeatureClick;
  }, [onFeatureClick]);

  // ─── Initialisation de la carte (une seule fois) ─────────────────────────
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    try {
      const map = L.map(mapContainerRef.current, {
        center: [7.3697, 12.3547],
        zoom: 6,
        zoomControl: false,
        preferCanvas: true,
        fadeAnimation: false,
        zoomAnimation: true,
        markerZoomAnimation: false,
      });

      L.control.zoom({ position: 'topright' }).addTo(map);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap',
        maxZoom: 19,
        minZoom: 5,
        updateWhenIdle: true,
        updateWhenZooming: false,
        keepBuffer: 2,
      }).addTo(map);

      mapRef.current = map;
      setMapReady(true);
    } catch (error) {
      console.error('[MAP] Erreur d\'initialisation:', error);
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        setMapReady(false);
      }
    };
  }, []); // ✅ Pas de dépendance — s'exécute une seule fois

  // ─── Mise à jour du GeoJSON sur la carte ──────────────────────────────────
  useEffect(() => {
    if (!mapRef.current || !mapReady || !geoData) return;

    // Supprimer l'ancienne couche
    if (geoJsonLayerRef.current) {
      mapRef.current.removeLayer(geoJsonLayerRef.current);
      geoJsonLayerRef.current = null;
    }

    // ✅ Style calculé une seule fois pour la couche courante
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

    const geoJsonLayer = L.geoJSON(geoData, {
      style: getStyle,
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

        // ✅ On utilise le REF pour le callback — pas de re-rendu
        layer.on('click', () => {
          if (onFeatureClickRef.current) {
            onFeatureClickRef.current(props);
          }
        });

        // Hover
        layer.on('mouseover', function (this: L.GeoJSON) {
          this.setStyle({ fillOpacity: 0.7, weight: 2 });
        });
        layer.on('mouseout', function (this: L.GeoJSON) {
          const isSelected = props.id === selectedFeatureId;
          this.setStyle({
            fillOpacity: isSelected ? 0.7 : 0.5,
            weight: isSelected ? 3 : 1,
          });
        });
      },
    });

    geoJsonLayer.addTo(mapRef.current);
    geoJsonLayerRef.current = geoJsonLayer;

    // Ajuster la vue sur les données
    try {
      const bounds = geoJsonLayer.getBounds();
      if (bounds.isValid()) {
        mapRef.current.fitBounds(bounds, {
          padding: [50, 50],
          animate: false,
        });
      }
    } catch (error) {
      console.error('[MAP] Erreur bounds:', error);
    }
  }, [geoData, mapReady, selectedFeatureId, mapLevel]);
  // ✅ onFeatureClick n'est PLUS dans les dépendances

  // ─── Zoom sur la sélection ────────────────────────────────────────────────
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
            animate: true,
            duration: 0.4,
          });
        }
      }
    });
  }, [selectedFeatureId]);

  // ─── Rendu ────────────────────────────────────────────────────────────────
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
        .leaflet-control-attribution {
          font-size: 10px !important;
          background: rgba(255, 255, 255, 0.7) !important;
          padding: 2px 5px !important;
        }
        .dark .leaflet-control-attribution {
          background: rgba(0, 0, 0, 0.5) !important;
          color: rgba(255, 255, 255, 0.7) !important;
        }
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
'use client';

import { useEffect, useRef, useState, memo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { GeoJSONFeatureCollection, MapLevel } from '@/types/api';

const MAPTILER_API_KEY = "Lr72DkH8TYyjpP7RNZS9";

interface MapViewProps {
  geoData: GeoJSONFeatureCollection | null;
  loading: boolean;
  mapLevel: MapLevel;
  onFeatureClick?: (properties: any) => void;
  selectedFeatureId?: number | null;
}

// Skeleton intégré pour éviter une dépendance externe
const MapSkeleton = () => (
  <div className="w-full h-full bg-gray-100 dark:bg-gray-900 flex items-center justify-center rounded-xl">
    <div className="text-center">
      <div className="inline-block w-14 h-14 border-4 border-green-500 border-t-transparent rounded-full animate-spin mb-3" />
      <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Chargement de la carte…</p>
    </div>
  </div>
);

// Memoize le composant pour éviter les re-renders inutiles
export default memo(function MapView({
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
  const onFeatureClickRef = useRef(onFeatureClick);

  useEffect(() => {
    onFeatureClickRef.current = onFeatureClick;
  }, [onFeatureClick]);

  // ── Initialisation carte (une seule fois) avec MapTiler ──────────────────
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    console.log('%c🗺️  [MapView] Initializing MapTiler map...', 'color: #22c55e; font-weight: bold');
    
    try {
      const map = L.map(mapContainerRef.current, {
        center: [7.3697, 12.3547],
        zoom: 6,
        zoomControl: false,
        preferCanvas: true,
        fadeAnimation: false,
        zoomAnimation: true,
        markerZoomAnimation: false,
        attributionControl: false,
      });

      // Contrôle de zoom
      L.control.zoom({ position: 'topright' }).addTo(map);

      // Attribution personnalisée
      L.control.attribution({
        position: 'bottomright',
        prefix: false,
      }).addAttribution(
        '<a href="https://www.maptiler.com/copyright/" target="_blank">© MapTiler</a> ' +
        '<a href="https://www.openstreetmap.org/copyright" target="_blank">© OpenStreetMap</a>'
      ).addTo(map);

      // ✨ MapTiler Streets (Haute Performance) ✨
      L.tileLayer(
        `https://api.maptiler.com/maps/streets-v2/{z}/{x}/{y}.png?key=${MAPTILER_API_KEY}`,
        {
          tileSize: 512,
          zoomOffset: -1,
          minZoom: 1,
          maxZoom: 19,
          crossOrigin: true,
          updateWhenIdle: true,
          updateWhenZooming: false,
          keepBuffer: 4,
        }
      ).addTo(map);

      mapRef.current = map;
      setMapReady(true);
      console.log('%c✅ [MapView] MapTiler initialized successfully', 'color: #22c55e; font-weight: bold');
    } catch (error) {
      console.error('%c❌ [MapView] Map initialization failed:', 'color: #ef4444; font-weight: bold', error);
    }

    return () => {
      if (mapRef.current) {
        console.log('%c🗑️  [MapView] Cleaning up map instance', 'color: #f59e0b');
        mapRef.current.remove();
        mapRef.current = null;
        setMapReady(false);
      }
    };
  }, []);

  // ── Mise à jour GeoJSON (Ultra-optimisé) ──────────────────────────────────
  useEffect(() => {
    if (!mapRef.current || !mapReady || !geoData) return;

    const startTime = performance.now();
    console.log(`%c🔄 [MapView] Updating GeoJSON layer - ${geoData.features.length} features`, 'color: #3b82f6; font-weight: bold');

    // Supprimer l'ancienne couche
    if (geoJsonLayerRef.current) {
      mapRef.current.removeLayer(geoJsonLayerRef.current);
      geoJsonLayerRef.current = null;
    }

    // Palette de couleurs par filière
    const filiereColors: Record<string, string> = {
      'agriculture': '#22c55e',
      'élevage': '#f59e0b',
      'pêche': '#3b82f6',
      'foresterie': '#10b981',
      'default': '#86efac'
    };

    const getStyle = (feature: any) => {
      const isSelected = feature?.properties?.id === selectedFeatureId;
      const filiere = feature?.properties?.filiere_principale?.toLowerCase() || 'default';
      const baseColor = filiereColors[filiere] || filiereColors.default;

      return {
        fillColor: isSelected ? '#22c55e' : baseColor,
        weight: isSelected ? 3 : 1.5,
        opacity: 1,
        color: isSelected ? '#15803d' : '#16a34a',
        fillOpacity: isSelected ? 0.85 : 0.65,
      };
    };

    const geoJsonLayer = L.geoJSON(geoData, {
      style: getStyle,
      onEachFeature: (feature, layer) => {
        const props = feature.properties;
        if (!props) return;

        const name = props.nom || props.name || 'Sans nom';

        // Tooltip enrichi
        const tooltipContent = `
          <div class="font-semibold text-base">${name}</div>
          ${props.population ? `<div class="text-xs mt-1">👥 ${new Intl.NumberFormat('fr-FR').format(props.population)} hab.</div>` : ''}
          ${props.superficie_km2 ? `<div class="text-xs">📏 ${new Intl.NumberFormat('fr-FR').format(props.superficie_km2)} km²</div>` : ''}
          ${props.production_count ? `<div class="text-xs">🌾 ${props.production_count} production(s)</div>` : ''}
        `;

        layer.bindTooltip(tooltipContent, {
          permanent: false,
          direction: 'center',
          className: 'map-tooltip',
          opacity: 0.95,
        });

        // Click handler
        layer.on('click', () => {
          console.log('%c🖱️  [MapView] Feature clicked:', 'color: #8b5cf6', props);
          if (onFeatureClickRef.current) {
            onFeatureClickRef.current(props);
          }
        });

        // Hover effects
        layer.on('mouseover', function (this: L.GeoJSON) {
          this.setStyle({ fillOpacity: 0.9, weight: 2.5 });
        });
        layer.on('mouseout', function (this: L.GeoJSON) {
          const isSelected = props.id === selectedFeatureId;
          this.setStyle({
            fillOpacity: isSelected ? 0.85 : 0.65,
            weight: isSelected ? 3 : 1.5,
          });
        });
      },
    });

    geoJsonLayer.addTo(mapRef.current);
    geoJsonLayerRef.current = geoJsonLayer;

    // Ajuster la vue
    try {
      const bounds = geoJsonLayer.getBounds();
      if (bounds.isValid()) {
        mapRef.current.fitBounds(bounds, {
          padding: [50, 50],
          animate: true,
          duration: 0.4,
        });
      }
    } catch (error) {
      console.error('%c❌ [MapView] Bounds error:', 'color: #ef4444', error);
    }

    const elapsed = (performance.now() - startTime).toFixed(1);
    console.log(`%c✅ [MapView] GeoJSON rendered in ${elapsed}ms`, 'color: #22c55e; font-weight: bold');
  }, [geoData, mapReady, selectedFeatureId, mapLevel]);

  // ── Zoom sur sélection ────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current || !geoJsonLayerRef.current || !selectedFeatureId) return;

    console.log(`%c🔍 [MapView] Zooming to feature ID: ${selectedFeatureId}`, 'color: #06b6d4; font-weight: bold');

    geoJsonLayerRef.current.eachLayer((layer: any) => {
      const feature = layer.feature;
      if (feature?.properties?.id === selectedFeatureId) {
        const bounds = layer.getBounds();
        if (bounds.isValid()) {
          mapRef.current!.fitBounds(bounds, {
            padding: [100, 100],
            maxZoom: 12,
            animate: true,
            duration: 0.6,
          });
        }
      }
    });
  }, [selectedFeatureId]);

  if (loading) {
    return <MapSkeleton />;
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
          background: #f3f4f6;
        }
        
        .dark .leaflet-container {
          background: #111827;
        }
        
        .map-tooltip {
          background: rgba(255, 255, 255, 0.98) !important;
          border: 2px solid #22c55e !important;
          border-radius: 10px !important;
          padding: 8px 12px !important;
          font-weight: 600 !important;
          font-size: 13px !important;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
          backdrop-filter: blur(8px) !important;
          pointer-events: none !important;
          line-height: 1.4 !important;
        }
        
        .dark .map-tooltip {
          background: rgba(31, 41, 55, 0.98) !important;
          border-color: #16a34a !important;
          color: white !important;
        }
        
        .leaflet-control-attribution {
          font-size: 9px !important;
          background: rgba(255, 255, 255, 0.8) !important;
          padding: 2px 6px !important;
          border-radius: 4px !important;
        }
        
        .dark .leaflet-control-attribution {
          background: rgba(0, 0, 0, 0.6) !important;
          color: rgba(255, 255, 255, 0.8) !important;
        }
        
        .leaflet-control-attribution a {
          color: #22c55e !important;
          text-decoration: none !important;
        }
        
        .dark .leaflet-control-attribution a {
          color: #86efac !important;
        }
        
        /* Performance optimizations */
        .leaflet-tile {
          will-change: opacity;
        }
        
        .leaflet-zoom-anim .leaflet-zoom-animated {
          will-change: transform;
        }
        
        /* Zoom control styling */
        .leaflet-control-zoom {
          border: none !important;
          border-radius: 8px !important;
          overflow: hidden !important;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15) !important;
        }
        
        .leaflet-control-zoom a {
          width: 36px !important;
          height: 36px !important;
          line-height: 36px !important;
          font-size: 18px !important;
          background: white !important;
          color: #374151 !important;
          border: none !important;
        }
        
        .dark .leaflet-control-zoom a {
          background: #1f2937 !important;
          color: #e5e7eb !important;
        }
        
        .leaflet-control-zoom a:hover {
          background: #f3f4f6 !important;
          color: #22c55e !important;
        }
        
        .dark .leaflet-control-zoom a:hover {
          background: #374151 !important;
          color: #86efac !important;
        }
      `}</style>
    </div>
  );
});
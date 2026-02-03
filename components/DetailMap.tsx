'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const MAPTILER_API_KEY = "Lr72DkH8TYyjpP7RNZS9";

interface DetailMapProps {
  geoData: any;
  targetId: number;
}

export default function DetailMap({ geoData, targetId }: DetailMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!containerRef.current || !geoData) return;

    // Destroy previous instance
    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    console.log('%c🗺️  [DetailMap] Initializing detail map with MapTiler', 'color: #22c55e; font-weight: bold');

    const map = L.map(containerRef.current, {
      center: [7.3697, 12.3547],
      zoom: 6,
      zoomControl: true,
      preferCanvas: true,
      fadeAnimation: true,
      attributionControl: false,
    });

    // Attribution
    L.control.attribution({
      position: 'bottomright',
      prefix: false,
    }).addAttribution(
      '<a href="https://www.maptiler.com/copyright/" target="_blank">© MapTiler</a>'
    ).addTo(map);

    // MapTiler Satellite Hybrid (Pour les détails)
    L.tileLayer(
      `https://api.maptiler.com/maps/hybrid/{z}/{x}/{y}.jpg?key=${MAPTILER_API_KEY}`,
      {
        tileSize: 512,
        zoomOffset: -1,
        minZoom: 1,
        maxZoom: 20,
        crossOrigin: true,
      }
    ).addTo(map);

    let targetBounds: L.LatLngBounds | null = null;

    L.geoJSON(geoData, {
      style: (feature: any) => {
        const isTarget = feature?.properties?.id === targetId;
        return {
          fillColor: isTarget ? '#22c55e' : '#d1fae5',
          weight: isTarget ? 4 : 1.5,
          opacity: 1,
          color: isTarget ? '#15803d' : '#86efac',
          fillOpacity: isTarget ? 0.75 : 0.3,
        };
      },
      onEachFeature: (feature, layer) => {
        const name = feature.properties?.nom || feature.properties?.name || '';
        if (name) {
          layer.bindTooltip(name, {
            permanent: feature.properties?.id === targetId,
            direction: 'center',
            className: 'detail-map-tooltip',
          });
        }
        if (feature.properties?.id === targetId) {
          try {
            targetBounds = (layer as any).getBounds();
          } catch (_) {}
        }
      },
    }).addTo(map);

    // Zoom into target
    if (targetBounds && (targetBounds as L.LatLngBounds).isValid()) {
      map.fitBounds(targetBounds as L.LatLngBounds, {
        padding: [40, 40],
        maxZoom: 13,
        animate: true,
        duration: 0.8,
      });
    }

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [geoData, targetId]);

  return (
    <>
      <div ref={containerRef} className="w-full h-full" />
      <style jsx global>{`
        .detail-map-tooltip {
          background: rgba(34, 197, 94, 0.95) !important;
          border: 2px solid #15803d !important;
          border-radius: 8px !important;
          padding: 8px 12px !important;
          font-weight: 700 !important;
          font-size: 14px !important;
          color: white !important;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2) !important;
        }
      `}</style>
    </>
  );
}
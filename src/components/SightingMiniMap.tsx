import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { cn } from '@/lib/utils';
import type { SightingLocation } from '@/lib/sightings';

interface SightingMiniMapProps {
  location: SightingLocation;
  className?: string;
}

const SightingMiniMap = ({ location, className }: SightingMiniMapProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      dragging: false,
      touchZoom: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      zoomControl: false,
      keyboard: false,
      attributionControl: false,
    }).setView([location.lat, location.lng], 17);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

    const icon = L.divIcon({
      className: '',
      html: `<div style="width:32px;height:32px;display:flex;align-items:center;justify-content:center;background:hsl(36,100%,50%);border-radius:50%;color:white;font-size:16px;">🐾</div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });

    L.marker([location.lat, location.lng], { icon }).addTo(map);
    mapRef.current = map;

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [location.lat, location.lng]);

  return (
    <div
      ref={containerRef}
      className={cn('rounded-xl overflow-hidden', className)}
      style={{ height: '120px' }}
    />
  );
};

export default SightingMiniMap;

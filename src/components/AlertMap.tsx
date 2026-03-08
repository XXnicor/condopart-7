import { useEffect, useRef, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Sighting } from '@/lib/sightings';
import { GOLDEN_PARK_CONDO } from '@/lib/constants';

// Fix default marker icons
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface AlertMapProps {
  sightings: Sighting[];
  className?: string;
}

const AlertMap = ({ sightings, className }: AlertMapProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const groupRef = useRef<L.LayerGroup | null>(null);

  const mapped = useMemo(
    () => sightings.filter((s): s is Sighting & { location: NonNullable<Sighting['location']> } => s.location !== null),
    [sightings],
  );

  // Init map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const centerLat = mapped.length > 0
      ? mapped.reduce((sum, s) => sum + s.location.lat, 0) / mapped.length
      : GOLDEN_PARK_CONDO.lat;
    const centerLng = mapped.length > 0
      ? mapped.reduce((sum, s) => sum + s.location.lng, 0) / mapped.length
      : GOLDEN_PARK_CONDO.lng;

    const map = L.map(containerRef.current).setView([centerLat, centerLng], 16);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
    }).addTo(map);

    mapRef.current = map;

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
      groupRef.current = null;
    };
  }, [mapped.length > 0]); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map || mapped.length === 0) return;

    if (groupRef.current) {
      groupRef.current.clearLayers();
    } else {
      groupRef.current = L.layerGroup().addTo(map);
    }

    mapped.forEach((s) => {
      L.marker([s.location.lat, s.location.lng])
        .addTo(groupRef.current!)
        .bindPopup(
          `<strong>${s.location.label}</strong>${s.notes ? `<br/>${s.notes}` : ''}`,
        );
    });
  }, [mapped]);

  return (
    <div className={cn('rounded-2xl border border-border/50 bg-card shadow-md overflow-hidden', className)}>
      <div className="flex items-center justify-between px-4 py-2.5">
        <div className="flex items-center gap-1.5">
          <MapPin className="h-4 w-4 text-primary" />
          <span className="font-display text-sm font-bold">Avistamentos no mapa</span>
        </div>
        <span className="text-xs text-muted-foreground">
          {mapped.length} {mapped.length === 1 ? 'local' : 'locais'}
        </span>
      </div>
      <div ref={containerRef} style={{ height: '240px' }} />
    </div>
  );
};

export default AlertMap;

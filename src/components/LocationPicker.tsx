import { useEffect, useRef, useState, useCallback } from 'react';

import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { PawPrint, MapPin, Loader2, LocateFixed, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface LocationPickerProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

const NOMINATIM_URL =
  `https://nominatim.openstreetmap.org/search` +
  `?q=${encodeURIComponent('Rua Gilson Castilho e Silva, Sorocaba, SP, Brasil')}` +
  `&countrycodes=br&format=json&limit=1`;

const LocationPicker = ({ value, onChange, error }: LocationPickerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const [mapStatus, setMapStatus] = useState<'loading' | 'ready'>('loading');
  const [dragging, setDragging] = useState(false);
  const [pendingCoords, setPendingCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [confirmedCoords, setConfirmedCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [resolvedLabel, setResolvedLabel] = useState('');
  const [labelInput, setLabelInput] = useState('');
  const [resolving, setResolving] = useState(false);

  useEffect(() => {
    if (!containerRef.current || mapInstanceRef.current) return;

    const map = L.map(containerRef.current, { zoomControl: false });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
    }).addTo(map);
    mapInstanceRef.current = map;
    map.setView([-23.5015, -47.4526], 15);

    fetch(NOMINATIM_URL)
      .then((r) => r.json())
      .then((data) => {
        const lat = data[0] ? parseFloat(data[0].lat) : -23.5015;
        const lng = data[0] ? parseFloat(data[0].lon) : -47.4526;
        map.setView([lat, lng], 18);
        setPendingCoords({ lat, lng });
        setMapStatus('ready');
      })
      .catch(() => {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            map.setView([pos.coords.latitude, pos.coords.longitude], 18);
            setPendingCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
            setMapStatus('ready');
          },
          () => {
            map.setView([-23.5015, -47.4526], 18);
            setPendingCoords({ lat: -23.5015, lng: -47.4526 });
            setMapStatus('ready');
          },
          { timeout: 5000 },
        );
      });

    map.on('dragstart', () => setDragging(true));
    map.on('dragend', () => {
      setDragging(false);
      const center = map.getCenter();
      setPendingCoords({ lat: center.lat, lng: center.lng });
    });
    map.on('moveend', () => {
      const center = map.getCenter();
      setPendingCoords({ lat: center.lat, lng: center.lng });
    });

    return () => {
      mapInstanceRef.current?.remove();
      mapInstanceRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleConfirm = useCallback(async () => {
    if (!pendingCoords) return;
    setResolving(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse` +
          `?lat=${pendingCoords.lat}&lon=${pendingCoords.lng}` +
          `&format=json&accept-language=pt-BR`,
      );
      const data = await res.json();
      const label = data.display_name
        ? data.display_name.split(',').slice(0, 3).join(',').trim()
        : `${pendingCoords.lat.toFixed(5)}, ${pendingCoords.lng.toFixed(5)}`;
      setResolvedLabel(label);
      setLabelInput(label);
      setConfirmedCoords(pendingCoords);
    } catch {
      const fallback = `${pendingCoords.lat.toFixed(5)}, ${pendingCoords.lng.toFixed(5)}`;
      setResolvedLabel(fallback);
      setLabelInput(fallback);
      setConfirmedCoords(pendingCoords);
    } finally {
      setResolving(false);
    }
  }, [pendingCoords]);

  // Keep a ref to onChange to avoid infinite loops
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  // Serialization
  useEffect(() => {
    if (!confirmedCoords) return;
    const location = {
      lat: confirmedCoords.lat,
      lng: confirmedCoords.lng,
      label: labelInput.trim() || resolvedLabel,
    };
    onChangeRef.current(JSON.stringify(location));
  }, [confirmedCoords, labelInput, resolvedLabel]);

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-foreground">
        Onde o pet foi visto por último?
      </label>

      {/* Map wrapper */}
      <div className="relative" style={{ height: '260px', width: '100%' }}>
        {/* Leaflet container */}
        <div
          ref={containerRef}
          style={{ height: '260px', width: '100%' }}
          className={`rounded-2xl overflow-hidden shadow-sm border ${error ? 'border-destructive' : 'border-border'}`}
        />

        {/* Loading overlay */}
        {mapStatus === 'loading' && (
          <div className="absolute inset-0 z-[1000] flex items-center justify-center rounded-2xl bg-background/80">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <span className="ml-2 text-sm text-muted-foreground">Carregando mapa...</span>
          </div>
        )}

        {/* Fixed center pin — Uber style */}
        {mapStatus === 'ready' && (
          <div className="pointer-events-none absolute inset-0 z-[1000] flex items-center justify-center">
            <div
              className="flex flex-col items-center transition-transform duration-200"
              style={{
                transform: dragging
                  ? 'translateY(-16px) scale(1.15)'
                  : 'translateY(-8px) scale(1)',
              }}
            >
              {/* Pin body */}
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary shadow-lg">
                <PawPrint className="h-5 w-5 text-primary-foreground" />
              </div>
              {/* Pin shadow */}
              <div
                className="mt-1 rounded-full bg-foreground/20 transition-all duration-200"
                style={{
                  width: dragging ? '12px' : '20px',
                  height: dragging ? '4px' : '6px',
                }}
              />
            </div>
          </div>
        )}

        {/* Floating instruction */}
        {mapStatus === 'ready' && !confirmedCoords && (
          <div className="absolute left-0 right-0 top-3 z-[1000] flex justify-center">
            <div className="rounded-full bg-background/90 px-3 py-1.5 text-xs font-medium text-foreground shadow-sm backdrop-blur-sm">
              Arraste o mapa até o local
            </div>
          </div>
        )}

        {/* Confirmed address overlay */}
        {confirmedCoords && resolvedLabel && (
          <div className="absolute left-2 right-2 top-2 z-[1000] flex items-center gap-2 rounded-xl bg-background/95 px-3 py-2 shadow-sm backdrop-blur-sm">
            <MapPin className="h-4 w-4 shrink-0 text-primary" />
            <p className="min-w-0 flex-1 truncate text-xs text-foreground">{resolvedLabel}</p>
            <button
              type="button"
              onClick={() => {
                setConfirmedCoords(null);
                setResolvedLabel('');
                setLabelInput('');
                onChange('');
              }}
              className="ml-auto shrink-0 text-xs font-medium text-primary"
            >
              Alterar
            </button>
          </div>
        )}

        {/* GPS button */}
        {mapStatus === 'ready' && (
          <button
            type="button"
            onClick={() => {
              navigator.geolocation.getCurrentPosition(
                (pos) => {
                  mapInstanceRef.current?.setView(
                    [pos.coords.latitude, pos.coords.longitude],
                    18,
                  );
                  setPendingCoords({
                    lat: pos.coords.latitude,
                    lng: pos.coords.longitude,
                  });
                },
                () => toast.error('Não foi possível obter sua localização.'),
              );
            }}
            className="absolute bottom-14 right-3 z-[1000] flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background shadow-md transition-transform active:scale-95"
          >
            <LocateFixed className="h-5 w-5 text-foreground" />
          </button>
        )}
      </div>

      {/* Confirm button */}
      {mapStatus === 'ready' && !confirmedCoords && (
        <Button
          type="button"
          onClick={handleConfirm}
          disabled={resolving || !pendingCoords}
          className="w-full font-semibold"
        >
          {resolving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Confirmando...
            </>
          ) : (
            <>
              <MapPin className="mr-2 h-4 w-4" />
              Confirmar local
            </>
          )}
        </Button>
      )}

      {/* Label input — only after confirm */}
      {confirmedCoords && (
        <Input
          placeholder="Ex: Próximo ao portão, perto da churrasqueira..."
          value={labelInput}
          onChange={(e) => setLabelInput(e.target.value)}
          className="rounded-xl text-sm"
          maxLength={200}
        />
      )}

      {/* Validation error */}
      {error && (
        <p className="flex items-center gap-1 text-xs text-destructive">
          <AlertCircle className="h-3 w-3" />
          {error}
        </p>
      )}
    </div>
  );
};

export default LocationPicker;

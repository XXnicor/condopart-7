import { useState, useCallback, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Eye, Loader2, LocateFixed, MapPin, PawPrint, Send } from 'lucide-react';
import { useCreateSighting } from '@/hooks/useSightings';
import { toast } from 'sonner';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { SightingLocation } from '@/lib/sightings';
import { GOLDEN_PARK_CONDO } from '@/lib/constants';

interface SightingFormProps {
  alertId: string;
}

interface FormErrors {
  notes?: string;
  location?: string;
}

const SightingForm = ({ alertId }: SightingFormProps) => {
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const { createSighting, isCreating } = useCreateSighting();

  // Map state
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [pendingCoords, setPendingCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [confirmedCoords, setConfirmedCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [resolvedLabel, setResolvedLabel] = useState('');
  const [labelInput, setLabelInput] = useState('');
  const [resolving, setResolving] = useState(false);

  // Init map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, { zoomControl: false, minZoom: 14 });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
    }).addTo(map);
    mapRef.current = map;

    map.setView([GOLDEN_PARK_CONDO.lat, GOLDEN_PARK_CONDO.lng], GOLDEN_PARK_CONDO.zoom);
    setPendingCoords({ lat: GOLDEN_PARK_CONDO.lat, lng: GOLDEN_PARK_CONDO.lng });

    const refIcon = L.divIcon({
      className: '',
      html: `<div style="width:28px;height:28px;display:flex;align-items:center;justify-content:center;background:#f59e0b;border-radius:50%;color:white;font-size:13px;border:2px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.3);">🏢</div>`,
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    });
    L.marker([GOLDEN_PARK_CONDO.lat, GOLDEN_PARK_CONDO.lng], { icon: refIcon, interactive: true })
      .addTo(map)
      .bindPopup(GOLDEN_PARK_CONDO.name);


    setMapReady(true);
    setTimeout(() => map.invalidateSize(), 100);

    map.on('dragstart', () => setDragging(true));
    map.on('dragend', () => {
      setDragging(false);
      const c = map.getCenter();
      setPendingCoords({ lat: c.lat, lng: c.lng });
    });
    map.on('moveend', () => {
      const c = map.getCenter();
      setPendingCoords({ lat: c.lat, lng: c.lng });
    });

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  const handleConfirmLocation = useCallback(async () => {
    if (!pendingCoords) return;
    setResolving(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${pendingCoords.lat}&lon=${pendingCoords.lng}&format=json&accept-language=pt-BR`,
      );
      const data = await res.json();
      const label = data.display_name
        ? data.display_name.split(',').slice(0, 3).join(',').trim()
        : `${pendingCoords.lat.toFixed(5)}, ${pendingCoords.lng.toFixed(5)}`;
      setResolvedLabel(label);
      setLabelInput(label);
      setConfirmedCoords(pendingCoords);
      setErrors((p) => ({ ...p, location: undefined }));
    } catch {
      const fallback = `${pendingCoords.lat.toFixed(5)}, ${pendingCoords.lng.toFixed(5)}`;
      setResolvedLabel(fallback);
      setLabelInput(fallback);
      setConfirmedCoords(pendingCoords);
    } finally {
      setResolving(false);
    }
  }, [pendingCoords]);

  const handleResetLocation = () => {
    setConfirmedCoords(null);
    setResolvedLabel('');
    setLabelInput('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: FormErrors = {};

    if (!notes.trim()) errs.notes = 'Descreva o que você viu';
    else if (notes.trim().length < 5) errs.notes = 'Descrição muito curta';

    if (!confirmedCoords) errs.location = 'Selecione o local no mapa';

    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      setTimeout(() => mapRef.current?.invalidateSize(), 50);
      return;
    }

    const location: SightingLocation = {
      lat: confirmedCoords!.lat,
      lng: confirmedCoords!.lng,
      label: labelInput.trim() || resolvedLabel,
    };

    createSighting(
      { alert_id: alertId, notes: notes.trim(), location },
      {
        onSuccess: () => {
          setNotes('');
          handleResetLocation();
          setErrors({});
        },
      },
    );
  };

  return (
    <Card className="rounded-2xl border-primary/20 bg-primary/5 shadow-md">
      <CardContent className="p-4">
        <h3 className="mb-3 font-display text-sm font-bold flex items-center gap-1.5">
          <Eye className="h-4 w-4 text-primary" /> Relatar Avistamento
        </h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Notes */}
          <div className="space-y-1.5">
            <Label className="text-xs">Descrição *</Label>
            <Textarea
              placeholder="O que você viu?"
              value={notes}
              onChange={(e) => {
                setNotes(e.target.value);
                setErrors((p) => ({ ...p, notes: undefined }));
              }}
              rows={2}
              maxLength={500}
              className={`text-base min-h-[44px] ${errors.notes ? 'border-destructive' : ''}`}
              autoCorrect="off"
            />
            {errors.notes && <p className="text-xs text-destructive">{errors.notes}</p>}
          </div>

          {/* Mini-map picker */}
          <div className="space-y-1.5">
            <Label className="text-xs">Local do avistamento *</Label>

            <div className="relative" style={{ height: '180px', width: '100%' }}>
              <div
                ref={containerRef}
                style={{ height: '180px', width: '100%' }}
                className={`rounded-xl overflow-hidden border ${errors.location ? 'border-destructive' : 'border-border'}`}
              />

              {!mapReady && (
                <div className="absolute inset-0 z-[1000] flex items-center justify-center rounded-xl bg-background/80">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <span className="ml-2 text-xs text-muted-foreground">Carregando mapa…</span>
                </div>
              )}

              {mapReady && (
                <div className="pointer-events-none absolute inset-0 z-[1000] flex items-center justify-center">
                  <div
                    className="flex flex-col items-center transition-transform duration-200"
                    style={{
                      transform: dragging ? 'translateY(-12px) scale(1.12)' : 'translateY(-6px) scale(1)',
                    }}
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary shadow-lg">
                      <PawPrint className="h-4 w-4 text-primary-foreground" />
                    </div>
                    <div
                      className="mt-0.5 rounded-full bg-foreground/20 transition-all duration-200"
                      style={{ width: dragging ? '8px' : '14px', height: dragging ? '3px' : '5px' }}
                    />
                  </div>
                </div>
              )}

              {mapReady && !confirmedCoords && (
                <div className="absolute left-0 right-0 top-2 z-[1000] flex justify-center">
                  <div className="rounded-full bg-background/90 px-2.5 py-1 text-[10px] font-medium text-foreground shadow-sm backdrop-blur-sm">
                    Arraste o mapa até o local
                  </div>
                </div>
              )}

              {confirmedCoords && resolvedLabel && (
                <div className="absolute left-2 right-2 top-2 z-[1000] flex items-center gap-1.5 rounded-lg bg-background/95 px-2.5 py-1.5 shadow-sm backdrop-blur-sm">
                  <MapPin className="h-3.5 w-3.5 shrink-0 text-primary" />
                  <p className="min-w-0 flex-1 truncate text-[11px] text-foreground">{resolvedLabel}</p>
                  <button
                    type="button"
                    onClick={handleResetLocation}
                    className="ml-auto shrink-0 text-[11px] font-medium text-primary"
                  >
                    Alterar
                  </button>
                </div>
              )}

              {mapReady && (
                <button
                  type="button"
                  onClick={() => {
                    navigator.geolocation.getCurrentPosition(
                      (pos) => {
                        mapRef.current?.setView([pos.coords.latitude, pos.coords.longitude], 17);
                        setPendingCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                      },
                      () => toast.error('Não foi possível obter sua localização.'),
                    );
                  }}
                  className="absolute bottom-2 right-2 z-[1000] flex h-8 w-8 items-center justify-center rounded-full border border-border bg-background shadow-md transition-transform active:scale-95"
                >
                  <LocateFixed className="h-4 w-4 text-foreground" />
                </button>
              )}
            </div>

            {errors.location && <p className="text-xs text-destructive">{errors.location}</p>}
          </div>

          {mapReady && !confirmedCoords && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleConfirmLocation}
              disabled={resolving || !pendingCoords}
              className="w-full"
            >
              {resolving ? (
                <>
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> Confirmando…
                </>
              ) : (
                <>
                  <MapPin className="mr-1.5 h-3.5 w-3.5" /> Confirmar local
                </>
              )}
            </Button>
          )}

          {confirmedCoords && (
            <Input
              placeholder="Ex: Próximo ao portão 2"
              value={labelInput}
              onChange={(e) => setLabelInput(e.target.value)}
              maxLength={200}
              className="text-base min-h-[44px] rounded-lg"
              autoComplete="off"
              autoCorrect="off"
            />
          )}

          <Button type="submit" size="sm" className="w-full" disabled={isCreating}>
            {isCreating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Enviando…
              </>
            ) : (
              <>
                <Send className="mr-1.5 h-3.5 w-3.5" /> Enviar Avistamento
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default SightingForm;

/*
 * Migration (already applied):
 * ALTER TABLE sightings
 *   ADD COLUMN IF NOT EXISTS photo_urls text[] DEFAULT '{}',
 *   ADD COLUMN IF NOT EXISTS video_url text;
 */

import { supabase } from '@/integrations/supabase/client';

export interface SightingLocation {
  lat: number;
  lng: number;
  label: string;
}

export interface Sighting {
  id: string;
  alert_id: string;
  user_id: string;
  notes: string | null;
  location: SightingLocation | null;
  photo_urls: string[];
  video_url: string | null;
  created_at: string;
}

export interface CreateSightingPayload {
  alert_id: string;
  notes?: string;
  location?: SightingLocation;
}

export function tryParseLocation(raw: string | null): SightingLocation | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SightingLocation;
  } catch {
    return null;
  }
}

function asStringArray(val: unknown): string[] {
  return Array.isArray(val) ? val.filter((v): v is string => typeof v === 'string') : [];
}

function asStringOrNull(val: unknown): string | null {
  return typeof val === 'string' ? val : null;
}

export async function getSightingsByAlert(alertId: string): Promise<Sighting[]> {
  const { data, error } = await supabase
    .from('sightings')
    .select('id, alert_id, user_id, notes, location, photo_urls, video_url, created_at')
    .eq('alert_id', alertId)
    .order('created_at', { ascending: false });

  if (error) throw new Error('Erro ao buscar avistamentos.');

  return (data ?? []).map((row) => ({
    id: row.id,
    alert_id: row.alert_id,
    user_id: row.user_id,
    notes: row.notes,
    location: tryParseLocation(row.location),
    photo_urls: asStringArray(row.photo_urls),
    video_url: asStringOrNull(row.video_url),
    created_at: row.created_at,
  }));
}

export async function createSighting(
  payload: CreateSightingPayload,
  userId: string,
): Promise<Sighting> {
  const locationStr = payload.location ? JSON.stringify(payload.location) : null;

  const { data, error } = await supabase
    .from('sightings')
    .insert({
      alert_id: payload.alert_id,
      user_id: userId,
      notes: payload.notes ?? '',
      location: locationStr,
    })
    .select('id, alert_id, user_id, notes, location, created_at')
    .single();

  if (error || !data) throw new Error('Erro ao registrar avistamento.');

  return {
    id: data.id,
    alert_id: data.alert_id,
    user_id: data.user_id,
    notes: data.notes,
    location: tryParseLocation(data.location),
    photo_urls: [],
    video_url: null,
    created_at: data.created_at,
  };
}

export async function deleteSighting(sightingId: string): Promise<void> {
  const { error } = await supabase
    .from('sightings')
    .delete()
    .eq('id', sightingId);

  if (error) throw new Error('Erro ao remover avistamento.');
}

export function subscribeSightings(
  alertId: string,
  onNew: (sighting: Sighting) => void,
): () => void {
  const channel = supabase
    .channel(`sightings:alert_id=eq.${alertId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'sightings',
        filter: `alert_id=eq.${alertId}`,
      },
      (payload) => {
        const row = payload.new as Record<string, unknown>;
        onNew({
          id: row.id as string,
          alert_id: row.alert_id as string,
          user_id: row.user_id as string,
          notes: (row.notes as string) ?? null,
          location: tryParseLocation(row.location as string | null),
          photo_urls: asStringArray(row.photo_urls),
          video_url: asStringOrNull(row.video_url),
          created_at: row.created_at as string,
        });
      },
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

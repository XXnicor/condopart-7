import { supabase } from '@/integrations/supabase/client';

export type AlertStatus = 'active' | 'found' | 'cancelled';

export interface Alert {
  id: string;
  title: string;
  description: string;
  status: AlertStatus;
  reporter_id: string;
  condominium_id: string | null;
  photo_url: string | null;
  location_label: string;
  location_lat: number | null;
  location_lng: number | null;
  type: string;
  created_at: string;
  updated_at: string;
  resolution_note?: string | null;
  resolved_at?: string | null;
  resolved_by?: string | null;
}

export async function resolveAlert(alertId: string, note: string): Promise<void> {
  if (!note || note.trim().length < 10) {
    throw new Error('A nota de encerramento deve ter pelo menos 10 caracteres');
  }

  // Fetch alert for realtime payload
  const { data: alert, error: fetchError } = await supabase
    .from('alerts')
    .select('condominium_id, title')
    .eq('id', alertId)
    .single();

  if (fetchError || !alert) {
    throw new Error('Alerta não encontrado.');
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuário não autenticado.');

  const now = new Date().toISOString();

  const { error } = await supabase
    .from('alerts')
    .update({
      status: 'found',
      resolution_note: note.trim(),
      resolved_at: now,
      resolved_by: user.id,
      updated_at: now,
    } as any)
    .eq('id', alertId);

  if (error) throw new Error('Não foi possível encerrar o alerta. Tente novamente.');

  // Broadcast realtime event
  if (alert.condominium_id) {
    const channel = supabase.channel(`condo-${alert.condominium_id}`);
    await channel.send({
      type: 'broadcast',
      event: 'alert-resolved',
      payload: {
        alertId,
        petName: alert.title,
        resolvedAt: now,
      },
    });
    supabase.removeChannel(channel);
  }
}

export async function cancelAlert(alertId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuário não autenticado.');

  // Verify ownership
  const { data: alert, error: fetchError } = await supabase
    .from('alerts')
    .select('reporter_id')
    .eq('id', alertId)
    .single();

  if (fetchError || !alert) {
    throw new Error('Alerta não encontrado.');
  }

  if (alert.reporter_id !== user.id) {
    throw new Error('Apenas o dono do alerta pode cancelá-lo');
  }

  const { error } = await supabase
    .from('alerts')
    .update({ status: 'cancelled', updated_at: new Date().toISOString() })
    .eq('id', alertId);

  if (error) throw new Error('Não foi possível cancelar o alerta. Tente novamente.');
}

export async function getFoundAlerts(condoId: string): Promise<Alert[]> {
  const { data, error } = await supabase
    .from('alerts')
    .select('*')
    .eq('condominium_id', condoId)
    .eq('status', 'found')
    .order('resolved_at' as any, { ascending: false });

  if (error) throw new Error('Erro ao buscar alertas encontrados.');
  return (data ?? []) as unknown as Alert[];
}

export async function getActiveAlerts(condoId: string): Promise<Alert[]> {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from('alerts')
    .select('*')
    .eq('condominium_id', condoId)
    .or(`status.eq.active,and(status.eq.found,updated_at.gt.${oneHourAgo})`)
    .order('created_at', { ascending: false });

  if (error) throw new Error('Erro ao buscar alertas ativos.');
  return (data ?? []) as unknown as Alert[];
}

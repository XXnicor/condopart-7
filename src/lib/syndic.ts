import { supabase } from '@/integrations/supabase/client';
import { format, startOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// ── Types ──────────────────────────────────────────────

export type DashboardStats = {
  activeAlerts: number;
  foundAlerts: number;
  totalMembers: number;
  alertsThisMonth: number;
  avgResolutionHours: number | null;
};

export type AlertWithProfile = {
  id: string;
  title: string;
  status: 'active' | 'found' | 'cancelled';
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  resolution_note: string | null;
  reporter_name: string | null;
};

export type ChartDataPoint = {
  month: string;
  total: number;
  found: number;
};

// ── getDashboardStats ──────────────────────────────────

export async function getDashboardStats(condoId: string): Promise<DashboardStats> {
  const monthStart = startOfMonth(new Date()).toISOString();

  const [activeRes, foundRes, membersRes, monthRes] = await Promise.all([
    supabase
      .from('alerts')
      .select('id', { count: 'exact', head: true })
      .eq('condominium_id', condoId)
      .eq('status', 'active'),
    supabase
      .from('alerts')
      .select('created_at, resolved_at')
      .eq('condominium_id', condoId)
      .eq('status', 'found')
      .not('resolved_at', 'is', null),
    supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('condominium_id', condoId),
    supabase
      .from('alerts')
      .select('id', { count: 'exact', head: true })
      .eq('condominium_id', condoId)
      .gte('created_at', monthStart),
  ]);

  // Compute average resolution hours client-side
  let avgResolutionHours: number | null = null;
  const foundAlerts = foundRes.data ?? [];
  if (foundAlerts.length > 0) {
    const totalHours = foundAlerts.reduce((sum, a) => {
      const created = new Date(a.created_at).getTime();
      const resolved = new Date(a.resolved_at!).getTime();
      return sum + (resolved - created) / (1000 * 60 * 60);
    }, 0);
    avgResolutionHours = Math.round((totalHours / foundAlerts.length) * 10) / 10;
  }

  return {
    activeAlerts: activeRes.count ?? 0,
    foundAlerts: foundAlerts.length,
    totalMembers: membersRes.count ?? 0,
    alertsThisMonth: monthRes.count ?? 0,
    avgResolutionHours,
  };
}

// ── getAllAlerts ────────────────────────────────────────

export async function getAllAlerts(condoId: string): Promise<AlertWithProfile[]> {
  const { data: alerts, error } = await supabase
    .from('alerts')
    .select('id, title, status, created_at, updated_at, resolved_at, resolution_note, reporter_id')
    .eq('condominium_id', condoId)
    .order('created_at', { ascending: false });

  if (error) throw new Error('Erro ao buscar alertas.');
  if (!alerts || alerts.length === 0) return [];

  // Batch-fetch reporter names
  const reporterIds = [...new Set(alerts.map((a) => a.reporter_id))];
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name')
    .in('id', reporterIds);

  const nameMap = new Map<string, string | null>();
  (profiles ?? []).forEach((p) => nameMap.set(p.id, p.full_name));

  return alerts.map((a) => ({
    id: a.id,
    title: a.title,
    status: a.status as AlertWithProfile['status'],
    created_at: a.created_at,
    updated_at: a.updated_at,
    resolved_at: a.resolved_at,
    resolution_note: a.resolution_note,
    reporter_name: nameMap.get(a.reporter_id) ?? null,
  }));
}

// ── getAlertsChartData ─────────────────────────────────

export async function getAlertsChartData(condoId: string): Promise<ChartDataPoint[]> {
  const { data, error } = await supabase.rpc('get_alerts_chart_data', {
    _condo_id: condoId,
  });

  if (error) throw new Error('Erro ao buscar dados do gráfico.');

  return ((data as any[]) ?? []).map((row) => ({
    month: row.month as string,
    total: Number(row.total),
    found: Number(row.found),
  }));
}

// ── exportAlertsToCsv ──────────────────────────────────

const STATUS_LABELS: Record<string, string> = {
  active: 'Ativo',
  found: 'Encontrado',
  cancelled: 'Cancelado',
};

function escapeCsv(value: string | null | undefined): string {
  if (!value) return '';
  const escaped = value.replace(/"/g, '""');
  return /[",\n\r]/.test(escaped) ? `"${escaped}"` : escaped;
}

export async function exportAlertsToCsv(condoId: string): Promise<void> {
  const alerts = await getAllAlerts(condoId);

  const header = 'ID,Pet,Status,Reportado por,Criado em,Encerrado em,Nota de encerramento';

  const rows = alerts.map((a) => {
    const status = STATUS_LABELS[a.status] ?? a.status;
    const createdAt = format(new Date(a.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR });
    const resolvedAt = a.resolved_at
      ? format(new Date(a.resolved_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })
      : '';

    return [
      a.id,
      escapeCsv(a.title),
      status,
      escapeCsv(a.reporter_name),
      createdAt,
      resolvedAt,
      escapeCsv(a.resolution_note),
    ].join(',');
  });

  const csv = [header, ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `alertas-${condoId}-${format(new Date(), 'yyyy-MM-dd')}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Admin types ────────────────────────────────────────

export type Member = {
  id: string;
  full_name: string | null;
  role: 'morador' | 'syndic' | 'admin';
  created_at: string;
};

export type AlertWithCondo = {
  id: string;
  title: string;
  status: string;
  condo_name: string | null;
  reporter_name: string | null;
  created_at: string;
};

// ── getCondoMembers ────────────────────────────────────

export async function getCondoMembers(condoId: string): Promise<Member[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, role, created_at')
    .eq('condominium_id', condoId)
    .order('full_name', { ascending: true });

  if (error) throw new Error('Erro ao buscar membros.');
  return (data ?? []).map((p) => ({
    id: p.id,
    full_name: p.full_name,
    role: (p.role ?? 'morador') as Member['role'],
    created_at: p.created_at,
  }));
}

// ── updateMemberRole ───────────────────────────────────

export async function updateMemberRole(
  memberId: string,
  newRole: 'morador' | 'syndic',
  currentUserId: string,
): Promise<void> {
  if (memberId === currentUserId) {
    throw new Error('Você não pode alterar seu próprio papel');
  }

  // Check target member's current role
  const { data: target } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', memberId)
    .single();

  if (target?.role === 'admin') {
    throw new Error('Não é possível alterar o papel de outro admin');
  }

  const { error } = await supabase
    .from('profiles')
    .update({ role: newRole })
    .eq('id', memberId);

  if (error) throw new Error('Erro ao atualizar papel do membro.');
}

// ── removeMember ───────────────────────────────────────

export async function removeMember(
  memberId: string,
  currentUserId: string,
): Promise<void> {
  if (memberId === currentUserId) {
    throw new Error('Não é possível remover a si mesmo do condomínio');
  }

  const { data: target } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', memberId)
    .single();

  if (target?.role === 'admin') {
    throw new Error('Não é possível remover um admin do condomínio');
  }

  const { error } = await supabase
    .from('profiles')
    .update({ condominium_id: null })
    .eq('id', memberId);

  if (error) throw new Error('Erro ao remover membro.');
}

// ── getPlatformAlerts ──────────────────────────────────

export async function getPlatformAlerts(condoId: string): Promise<AlertWithCondo[]> {
  const { data: alerts, error } = await supabase
    .from('alerts')
    .select('id, title, status, created_at, reporter_id, condominium_id')
    .eq('condominium_id', condoId)
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) throw new Error('Erro ao buscar alertas da plataforma.');
  if (!alerts || alerts.length === 0) return [];

  // Batch fetch reporter names
  const reporterIds = [...new Set(alerts.map((a) => a.reporter_id))];
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name')
    .in('id', reporterIds);

  const nameMap = new Map<string, string | null>();
  (profiles ?? []).forEach((p) => nameMap.set(p.id, p.full_name));

  // Fetch condo name
  const condoIds = [...new Set(alerts.map((a) => a.condominium_id).filter(Boolean))] as string[];
  const { data: condos } = await supabase
    .from('condos')
    .select('id, name')
    .in('id', condoIds);

  const condoMap = new Map<string, string>();
  (condos ?? []).forEach((c) => condoMap.set(c.id, c.name));

  return alerts.map((a) => ({
    id: a.id,
    title: a.title,
    status: a.status,
    condo_name: a.condominium_id ? condoMap.get(a.condominium_id) ?? null : null,
    reporter_name: nameMap.get(a.reporter_id) ?? null,
    created_at: a.created_at,
  }));
}

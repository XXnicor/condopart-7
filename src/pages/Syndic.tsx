import { useEffect, useMemo, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import {
  getDashboardStats,
  getAllAlerts,
  getAlertsChartData,
  exportAlertsToCsv,
  type DashboardStats,
  type AlertWithProfile,
  type ChartDataPoint,
} from '@/lib/syndic';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck,
  ShieldAlert,
  Bell,
  CheckCircle2,
  Users,
  Calendar,
  Download,
} from 'lucide-react';
import AdminMembers from '@/components/AdminMembers';
import AdminPlatformAlerts from '@/components/AdminPlatformAlerts';
import {
  BarChart,
  Bar,
  XAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import BottomNav from '@/components/BottomNav';

// ── Helpers ────────────────────────────────────────────

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  active: { label: 'Ativo', className: 'bg-amber-100 text-amber-700 border-amber-300' },
  found: { label: 'Encontrado', className: 'bg-green-100 text-green-700 border-green-300' },
  cancelled: { label: 'Cancelado', className: 'bg-muted text-muted-foreground border-border' },
};

type StatusFilter = 'all' | 'active' | 'found';

// ── Component ──────────────────────────────────────────

const Syndic = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [condoName, setCondoName] = useState('');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [alerts, setAlerts] = useState<AlertWithProfile[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // ── Route guard ──
  useEffect(() => {
    if (profile && profile.role !== 'syndic' && profile.role !== 'admin') {
      navigate('/');
    }
  }, [profile, navigate]);

  // ── Data fetching ──
  useEffect(() => {
    if (!profile?.condominium_id) return;
    const condoId = profile.condominium_id;

    const load = async () => {
      setLoading(true);
      try {
        const [s, c, a, condo] = await Promise.all([
          getDashboardStats(condoId),
          getAlertsChartData(condoId),
          getAllAlerts(condoId),
          supabase.from('condos').select('name').eq('id', condoId).single(),
        ]);
        setStats(s);
        setChartData(c);
        setAlerts(a);
        if (condo.data) setCondoName(condo.data.name);
      } catch {
        toast.error('Erro ao carregar dados do painel.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [profile?.condominium_id]);

  // ── Debounced search ──
  const [debouncedSearch, setDebouncedSearch] = useState('');
  useEffect(() => {
    debounceRef.current = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(debounceRef.current);
  }, [search]);

  // ── Filtered alerts ──
  const filteredAlerts = useMemo(() => {
    let list = alerts;
    if (statusFilter !== 'all') {
      list = list.filter((a) => a.status === statusFilter);
    }
    if (debouncedSearch.trim()) {
      const q = debouncedSearch.toLowerCase();
      list = list.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          (a.reporter_name ?? '').toLowerCase().includes(q),
      );
    }
    return list;
  }, [alerts, statusFilter, debouncedSearch]);

  // ── CSV export ──
  const handleExport = () => {
    if (!profile?.condominium_id) return;
    toast.info('Exportando dados...');
    exportAlertsToCsv(profile.condominium_id);
  };

  // ── Stats card config ──
  const statCards = stats
    ? [
        { icon: Bell, value: stats.activeAlerts, label: 'alertas ativos', bg: 'bg-amber-50', border: 'border-amber-200', iconColor: 'text-amber-500' },
        { icon: CheckCircle2, value: stats.foundAlerts, label: 'pets encontrados', bg: 'bg-green-50', border: 'border-green-200', iconColor: 'text-green-500' },
        { icon: Users, value: stats.totalMembers, label: 'moradores', bg: 'bg-blue-50', border: 'border-blue-200', iconColor: 'text-blue-500' },
        { icon: Calendar, value: stats.alertsThisMonth, label: 'alertas este mês', bg: 'bg-purple-50', border: 'border-purple-200', iconColor: 'text-purple-500' },
      ]
    : [];

  const pills: { label: string; value: StatusFilter }[] = [
    { label: 'Todos', value: 'all' },
    { label: 'Ativos', value: 'active' },
    { label: 'Encontrados', value: 'found' },
  ];

  // ── Render ───────────────────────────────────────────

  return (
    <div className="min-h-screen w-full max-w-[480px] mx-auto overflow-x-hidden relative bg-mesh-light dark:bg-mesh-dark bg-grain pb-24">
      {/* Header */}
      <header className="px-4 pt-6 pb-2">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-6 w-6 text-amber-500" />
          <h1 className="font-display text-xl font-bold text-foreground tracking-tight">Painel do Síndico</h1>
        </div>
        {condoName && (
          <p className="mt-0.5 text-sm text-muted-foreground">{condoName}</p>
        )}
      </header>

      <main className="space-y-6 px-4 overflow-y-auto overscroll-contain">
        {/* ── Section 1: Stats ── */}
        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-2xl" />
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              {statCards.map((c, i) => {
                const Icon = c.icon;
                return (
                  <motion.div
                    key={c.label}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <Card className={`rounded-2xl border ${c.border} ${c.bg}`}>
                      <CardContent className="flex flex-col items-center justify-center gap-1 p-4">
                        <Icon className={`h-6 w-6 ${c.iconColor}`} />
                        <span className="text-2xl font-bold text-foreground">{c.value}</span>
                        <span className="text-xs text-muted-foreground">{c.label}</span>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>

            {stats?.avgResolutionHours != null && (
              <p className="text-center text-sm text-muted-foreground">
                Tempo médio de resolução: {stats.avgResolutionHours}h
              </p>
            )}
          </>
        )}

        {/* ── Section 2: Chart ── */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-foreground">
              Alertas nos últimos 6 meses
            </h2>
            <Button variant="outline" size="sm" onClick={handleExport} className="gap-1.5">
              <Download className="h-4 w-4" />
              Exportar CSV
            </Button>
          </div>

          {loading ? (
            <Skeleton className="h-[220px] w-full rounded-2xl" />
          ) : chartData.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Nenhum dado disponível ainda.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData}>
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(value: number, name: string) =>
                    [value, name === 'total' ? 'Total' : 'Encontrados']
                  }
                  labelFormatter={(label) => label}
                />
                <Legend
                  formatter={(value) => (value === 'total' ? 'Total' : 'Encontrados')}
                />
                <Bar dataKey="total" fill="#fbbf24" radius={[4, 4, 0, 0]} />
                <Bar dataKey="found" fill="#4ade80" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </section>

        {/* ── Section 3: History ── */}
        <section className="space-y-3">
          <h2 className="text-base font-semibold text-foreground">Histórico de alertas</h2>

          <Input
            placeholder="Buscar por pet ou morador..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="text-base min-h-[44px]"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
          />

          <div className="flex gap-2">
            {pills.map((p) => (
              <button
                key={p.value}
                onClick={() => setStatusFilter(p.value)}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                  statusFilter === p.value
                    ? 'bg-amber-500 text-white'
                    : 'border border-border bg-background text-muted-foreground'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-14 rounded-xl" />
              ))}
            </div>
          ) : filteredAlerts.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Nenhum alerta encontrado para este filtro.
            </p>
          ) : (
            <div className="space-y-0">
              {filteredAlerts.map((alert) => {
                const badge = STATUS_BADGE[alert.status] ?? STATUS_BADGE.cancelled;
                const isExpanded = expandedId === alert.id;

                return (
                  <div key={alert.id}>
                    <button
                      className="flex w-full items-center justify-between gap-2 px-1 py-3 text-left"
                      onClick={() => {
                        if (alert.status === 'found' && alert.resolution_note) {
                          setExpandedId(isExpanded ? null : alert.id);
                        } else {
                          navigate(`/alert/${alert.id}`);
                        }
                      }}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-foreground">{alert.title}</p>
                        <p className="text-xs text-muted-foreground">
                          por {alert.reporter_name ?? 'Desconhecido'} ·{' '}
                          {format(new Date(alert.created_at), 'd MMM yyyy', { locale: ptBR })}
                        </p>
                      </div>
                      <Badge variant="outline" className={badge.className}>
                        {badge.label}
                      </Badge>
                    </button>

                    <AnimatePresence>
                      {isExpanded && alert.resolution_note && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <p
                            className="cursor-pointer px-1 pb-3 text-sm italic text-muted-foreground"
                            onClick={() => navigate(`/alert/${alert.id}`)}
                          >
                            {alert.resolution_note}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <Separator />
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* ── Admin-only sections ── */}
        {profile?.role === 'admin' && profile.condominium_id && (
          <>
            <div className="flex items-center gap-2 pt-4">
              <ShieldAlert className="h-5 w-5 text-amber-600" />
              <h2 className="text-base font-semibold text-amber-600">Ferramentas de Admin</h2>
            </div>
            <Separator />

            <section className="space-y-3">
              <h2 className="text-base font-semibold text-foreground">Membros do condomínio</h2>
              <AdminMembers condoId={profile.condominium_id} currentUserId={profile.id} />
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-semibold text-foreground">Todos os alertas da plataforma</h2>
              <AdminPlatformAlerts condoId={profile.condominium_id} />
            </section>
          </>
        )}
      </main>

      <BottomNav />
    </div>
  );
};

export default Syndic;

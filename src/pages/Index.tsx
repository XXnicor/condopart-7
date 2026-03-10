import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { getFoundAlerts } from '@/lib/alerts';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PawPrint, MapPin, Clock, Plus, Search, RefreshCw, AlertTriangle } from 'lucide-react';
import { SkeletonCard } from '@/components/ui/skeleton-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatDistanceToNow, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import MoradorInfo from '@/components/MoradorInfo';
import OnboardingOverlay from '@/components/OnboardingOverlay';
import type { Tables } from '@/integrations/supabase/types';
import { motion, useReducedMotion, Variants } from 'framer-motion';

type AlertRow = Tables<'alerts'>;

type ProfileData = {
  full_name: string | null;
  avatar_url: string | null;
  role: string | null;
};

type AlertWithProfile = AlertRow & { reporter_profile?: ProfileData | null };

const Index = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const shouldReduceMotion = useReducedMotion();
  const dur = (base: number) => (shouldReduceMotion ? 0 : base);

  const listVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: dur(0.06), delayChildren: dur(0.04) },
    },
  };

  const cardVariants: Variants = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 6 },
    visible: { opacity: 1, y: 0, transition: { duration: dur(0.22), ease: 'easeOut' } },
  };
  const [alerts, setAlerts] = useState<AlertWithProfile[]>([]);
  const [foundAlerts, setFoundAlerts] = useState<AlertWithProfile[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingFound, setLoadingFound] = useState(false);
  const [error, setError] = useState(false);

  const isSyndicOrAdmin = profile?.role === 'syndic' || profile?.role === 'admin';

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    if (profile && !profile.condominium_id) {
      navigate('/condo-selection', { replace: true });
      return;
    }
    if (profile?.condominium_id) fetchAlerts();
  }, [profile]);

  useEffect(() => {
    const handleFocus = () => {
      if (profile?.condominium_id) fetchAlerts();
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [profile]);

  useEffect(() => {
    if (!profile?.condominium_id) return;
    const channel = supabase
      .channel('alerts-feed')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'alerts' }, () => {
        fetchAlerts();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [profile?.condominium_id]);

  useEffect(() => {
    if (!profile?.condominium_id) return;
    const channel = supabase
      .channel(`condo-feed-${profile.condominium_id}`)
      .on('broadcast', { event: 'alert-resolved' }, (payload) => {
        const data = payload.payload as { petName?: string };
        toast.info(`🐾 ${data.petName || 'Um pet'} foi encontrado!`);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [profile?.condominium_id]);

  const fetchAlerts = async () => {
    setLoading(true);
    setError(false);
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

    const { data, error: fetchError } = await supabase
      .from('alerts')
      .select('*')
      .eq('condominium_id', profile!.condominium_id!)
      .or(`status.eq.active,and(status.eq.found,updated_at.gt.${oneHourAgo})`)
      .order('created_at', { ascending: false });

    if (fetchError) {
      setError(true);
      toast.error('Erro ao carregar alertas. Tente novamente.');
    } else {
      const alertsData = data || [];
      const reporterIds = [...new Set(alertsData.map(a => a.reporter_id).filter(Boolean))];

      let profileMap: Record<string, ProfileData> = {};
      if (reporterIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url, role')
          .in('id', reporterIds);
        if (profiles) {
          profileMap = Object.fromEntries(profiles.map(p => [p.id, p]));
        }
      }

      setAlerts(alertsData.map(a => ({
        ...a,
        reporter_profile: profileMap[a.reporter_id] ?? null,
      })));
    }
    setLoading(false);
  };

  const fetchFoundAlerts = async () => {
    if (!profile?.condominium_id) return;
    setLoadingFound(true);
    try {
      const data = await getFoundAlerts(profile.condominium_id);
      const reporterIds = [...new Set(data.map(a => a.reporter_id).filter(Boolean))];
      let profileMap: Record<string, ProfileData> = {};
      if (reporterIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url, role')
          .in('id', reporterIds);
        if (profiles) {
          profileMap = Object.fromEntries(profiles.map(p => [p.id, p]));
        }
      }
      setFoundAlerts(data.map(a => ({
        ...a,
        reporter_profile: profileMap[a.reporter_id] ?? null,
      })));
    } catch {
      toast.error('Erro ao carregar pets encontrados.');
    }
    setLoadingFound(false);
  };

  const filtered = alerts.filter(
    (a) =>
      a.title.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      a.description?.toLowerCase().includes(debouncedSearch.toLowerCase())
  );

  const statusBadge = (status: string) => {
    if (status === 'found') {
      return (
        <Badge className="bg-success text-success-foreground text-[10px] font-semibold" data-testid={`badge-status-found`}>
          Encontrado
        </Badge>
      );
    }
    return (
      <Badge className="bg-warning text-warning-foreground text-[10px] font-semibold status-pulse" data-testid={`badge-status-active`}>
        Ativo
      </Badge>
    );
  };

  const renderAlertCard = (alert: AlertWithProfile, showResolutionNote = false) => (
    <motion.div key={alert.id} variants={cardVariants}>
      <Card
        className={`cursor-pointer overflow-hidden rounded-2xl border-glow shadow-sm card-elevated ${
        alert.status === 'active' ? 'alert-card-active' : alert.status === 'found' ? 'alert-card-found' : ''
      }`}
      onClick={() => navigate(`/alert/${alert.id}`)}
      data-testid={`card-alert-${alert.id}`}
    >
      <CardContent className="flex gap-3 p-3">
        <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl bg-secondary">
          {alert.photo_url ? (
            <img src={alert.photo_url} alt={alert.title} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <PawPrint className="h-8 w-8 text-muted-foreground/50" />
            </div>
          )}
        </div>
        <div className="flex flex-1 flex-col justify-between">
          <div>
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-display text-base font-bold leading-tight tracking-tight" data-testid={`text-alert-title-${alert.id}`}>
                {alert.title}
              </h3>
              {statusBadge(alert.status)}
            </div>
            <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{alert.description}</p>
            {showResolutionNote && alert.resolution_note && (
              <p className="mt-1 line-clamp-2 text-xs italic text-muted-foreground/80">{alert.resolution_note}</p>
            )}
          </div>
          <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3 text-primary/70" /> {alert.location_label || 'Local não informado'}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {showResolutionNote && alert.resolved_at
                ? format(new Date(alert.resolved_at), "dd/MM/yyyy", { locale: ptBR })
                : formatDistanceToNow(new Date(alert.created_at), { addSuffix: true, locale: ptBR })}
            </span>
          </div>
        </div>
      </CardContent>
      <div className="border-t border-stone-100 dark:border-stone-800 px-3 py-2">
        <MoradorInfo
          full_name={alert.reporter_profile?.full_name ?? 'Morador'}
          avatar_url={alert.reporter_profile?.avatar_url ?? null}
          role={alert.reporter_profile?.role ?? undefined}
        />
      </div>
    </Card>
    </motion.div>
  );

  const renderEmptyState = (message: string, sub: string, icon?: React.ReactNode) => (
    <div className="flex flex-col items-center gap-3 py-16 text-center animate-slide-up">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary">
        {icon || <PawPrint className="h-8 w-8 text-stone-300" />}
      </div>
      <p className="font-display text-lg font-semibold text-foreground" data-testid="text-empty-title">{message}</p>
      <p className="text-sm text-muted-foreground leading-relaxed" data-testid="text-empty-sub">{sub}</p>
    </div>
  );

  const renderActiveContent = () => (
    <>
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome ou descrição..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9 text-base min-h-[44px] input-glow"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          data-testid="input-search"
        />
      </div>

      {!loading && !error && (
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-medium text-muted-foreground" data-testid="text-alert-count">
            {filtered.length} alerta{filtered.length !== 1 ? 's' : ''}
          </p>
          <Badge variant="outline" className="border-primary/30 text-primary font-medium" data-testid="badge-condo">
            <PawPrint className="mr-1 h-3 w-3" /> Seu condomínio
          </Badge>
        </div>
      )}

      {loading ? (
        <div className="space-y-3"><SkeletonCard variant="feed" count={3} /></div>
      ) : error ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center animate-slide-up">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="h-7 w-7 text-destructive" />
          </div>
          <p className="font-display font-semibold text-foreground" data-testid="text-error">Erro ao carregar alertas</p>
          <Button size="sm" className="bg-primary hover:bg-primary/90 btn-tactile" onClick={fetchAlerts} data-testid="button-retry">
            Tentar novamente
          </Button>
        </div>
      ) : filtered.length === 0 && debouncedSearch ? (
        renderEmptyState(
          'Nenhum resultado',
          'Tente outro nome ou descrição.',
          <Search className="h-8 w-8 text-stone-300" />
        )
      ) : filtered.length === 0 ? (
        renderEmptyState('Nenhum alerta por aqui', 'Crie um alerta se seu pet estiver perdido.')
      ) : (
        <motion.div
          className="space-y-3"
          variants={listVariants}
          initial="hidden"
          animate="visible"
        >
          {filtered.map((a) => renderAlertCard(a))}
        </motion.div>
      )}
    </>
  );

  const renderFoundContent = () => (
    <>
      {loadingFound ? (
        <div className="space-y-3"><SkeletonCard variant="feed" count={3} /></div>
      ) : foundAlerts.length === 0 ? (
        renderEmptyState('Nenhum pet encontrado ainda', 'Alertas encerrados aparecerão aqui.')
      ) : (
        <motion.div
          className="space-y-3"
          variants={listVariants}
          initial="hidden"
          animate="visible"
        >
          {foundAlerts.map((a) => renderAlertCard(a, true))}
        </motion.div>
      )}
    </>
  );

  return (
    <div className="min-h-screen w-full max-w-[480px] mx-auto overflow-x-hidden relative bg-mesh-light dark:bg-mesh-dark bg-grain pb-24">
      <OnboardingOverlay />
      <header className="sticky top-0 z-40 glass-strong px-4 py-3">
        <div className="flex items-center gap-2">
          <PawPrint className="h-6 w-6 text-primary" data-testid="icon-header-paw" />
          <h1 className="font-display text-lg font-bold tracking-tight" data-testid="text-header-brand" style={{ fontSize: '1.125rem' }}>
            Encontra<span className="text-primary">Pet</span>
          </h1>
          <Button
            variant="ghost"
            size="icon"
            className="ml-auto h-8 w-8 text-muted-foreground btn-tactile"
            onClick={fetchAlerts}
            disabled={loading}
            data-testid="button-refresh"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </header>

      <main className="px-4 py-4 overflow-y-auto overscroll-contain relative z-10">
        {isSyndicOrAdmin ? (
          <Tabs defaultValue="active" onValueChange={(v) => { if (v === 'found') fetchFoundAlerts(); }}>
            <TabsList className="mb-4 w-full" data-testid="tabs-feed">
              <TabsTrigger value="active" className="flex-1" data-testid="tab-active">Alertas Ativos</TabsTrigger>
              <TabsTrigger value="found" className="flex-1" data-testid="tab-found">Pets Encontrados</TabsTrigger>
            </TabsList>
            <TabsContent value="active">{renderActiveContent()}</TabsContent>
            <TabsContent value="found">{renderFoundContent()}</TabsContent>
          </Tabs>
        ) : (
          renderActiveContent()
        )}
      </main>

      <button
        onClick={() => navigate('/create-alert')}
        className="fixed right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full fab-gradient transition-all duration-300 hover:scale-110 active:scale-95 animate-bounce-in"
        style={{ bottom: 'calc(80px + env(safe-area-inset-bottom))' }}
        data-testid="button-fab-create"
      >
        <Plus className="h-7 w-7 text-primary-foreground" />
      </button>

    </div>
  );
};

export default Index;

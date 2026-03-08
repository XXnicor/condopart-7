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
import BottomNav from '@/components/BottomNav';
import type { Tables } from '@/integrations/supabase/types';

type AlertRow = Tables<'alerts'>;

const Index = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState<AlertRow[]>([]);
  const [foundAlerts, setFoundAlerts] = useState<AlertRow[]>([]);
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

  // Refetch when page regains focus
  useEffect(() => {
    const handleFocus = () => {
      if (profile?.condominium_id) fetchAlerts();
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [profile]);

  // Realtime subscription for alert changes
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

  // Broadcast listener for alert-resolved toast
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
      setAlerts(data || []);
    }
    setLoading(false);
  };

  const fetchFoundAlerts = async () => {
    if (!profile?.condominium_id) return;
    setLoadingFound(true);
    try {
      const data = await getFoundAlerts(profile.condominium_id);
      setFoundAlerts(data as unknown as AlertRow[]);
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
      return <Badge className="bg-success text-success-foreground text-[10px]">Encontrado</Badge>;
    }
    return <Badge className="bg-warning text-warning-foreground text-[10px]">Ativo</Badge>;
  };

  const renderAlertCard = (alert: AlertRow, showResolutionNote = false) => (
    <Card
      key={alert.id}
      className="cursor-pointer overflow-hidden rounded-2xl border-border/50 shadow-md transition-shadow hover:shadow-lg"
      onClick={() => navigate(`/alert/${alert.id}`)}
    >
      <CardContent className="flex gap-3 p-3">
        <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-secondary">
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
              <h3 className="font-display text-base font-bold leading-tight">{alert.title}</h3>
              {statusBadge(alert.status)}
            </div>
            <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{alert.description}</p>
            {showResolutionNote && alert.resolution_note && (
              <p className="mt-1 line-clamp-2 text-xs italic text-muted-foreground/80">{alert.resolution_note}</p>
            )}
          </div>
          <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" /> {alert.location_label || 'Local não informado'}
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
    </Card>
  );

  const renderEmptyState = (message: string, sub: string) => (
    <div className="flex flex-col items-center gap-3 py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary">
        <PawPrint className="h-8 w-8 text-muted-foreground" />
      </div>
      <p className="font-medium text-foreground">{message}</p>
      <p className="text-sm text-muted-foreground">{sub}</p>
    </div>
  );

  const renderActiveContent = () => (
    <>
      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome ou descrição..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Alert count */}
      {!loading && !error && (
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-medium text-muted-foreground">
            {filtered.length} alerta{filtered.length !== 1 ? 's' : ''}
          </p>
          <Badge variant="outline" className="border-primary/30 text-primary">
            <PawPrint className="mr-1 h-3 w-3" /> Seu condomínio
          </Badge>
        </div>
      )}

      {loading ? (
        <div className="space-y-3"><SkeletonCard variant="feed" count={3} /></div>
      ) : error ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="h-7 w-7 text-destructive" />
          </div>
          <p className="font-medium text-foreground">Erro ao carregar alertas</p>
          <Button size="sm" className="bg-primary hover:bg-primary/90" onClick={fetchAlerts}>Tentar novamente</Button>
        </div>
      ) : filtered.length === 0 ? (
        renderEmptyState('Nenhum alerta ativo no seu condomínio', 'Quando um pet for perdido, ele aparecerá aqui')
      ) : (
        <div className="space-y-3">{filtered.map((a) => renderAlertCard(a))}</div>
      )}
    </>
  );

  const renderFoundContent = () => (
    <>
      {loadingFound ? (
        <div className="space-y-3"><SkeletonCard variant="feed" count={3} /></div>
      ) : foundAlerts.length === 0 ? (
        renderEmptyState('Nenhum pet encontrado ainda', 'Alertas encerrados aparecerão aqui')
      ) : (
        <div className="space-y-3">{foundAlerts.map((a) => renderAlertCard(a, true))}</div>
      )}
    </>
  );

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-40 border-b border-border bg-card/95 px-4 py-3 backdrop-blur-md">
        <div className="mx-auto flex max-w-[480px] items-center gap-2">
          <PawPrint className="h-6 w-6 text-primary" />
          <h1 className="font-display text-lg font-bold">
            Pet<span className="text-primary">Alert</span>
          </h1>
          <Button variant="ghost" size="icon" className="ml-auto h-8 w-8 text-muted-foreground" onClick={fetchAlerts} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-[480px] px-4 py-4">
        {isSyndicOrAdmin ? (
          <Tabs defaultValue="active" onValueChange={(v) => { if (v === 'found') fetchFoundAlerts(); }}>
            <TabsList className="mb-4 w-full">
              <TabsTrigger value="active" className="flex-1">Alertas Ativos</TabsTrigger>
              <TabsTrigger value="found" className="flex-1">Pets Encontrados</TabsTrigger>
            </TabsList>
            <TabsContent value="active">{renderActiveContent()}</TabsContent>
            <TabsContent value="found">{renderFoundContent()}</TabsContent>
          </Tabs>
        ) : (
          renderActiveContent()
        )}
      </main>

      {/* FAB */}
      <button
        onClick={() => navigate('/create-alert')}
        className="fixed bottom-20 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary shadow-lg shadow-primary/30 transition-transform hover:scale-105 active:scale-95"
      >
        <Plus className="h-7 w-7 text-primary-foreground" />
      </button>

      <BottomNav />
    </div>
  );
};

export default Index;

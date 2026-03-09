import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useAlert } from '@/hooks/useAlert';
import { useAlertActions } from '@/hooks/useAlertActions';
import { useSightings } from '@/hooks/useSightings';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Eye,
  Loader2,
  MapPin,
  PawPrint,
  Share2,

  XCircle,
} from 'lucide-react';
import { SkeletonCard } from '@/components/ui/skeleton-card';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import AlertMap from '@/components/AlertMap';
import SightingForm from '@/components/SightingForm';
import AlertFeed from '@/components/AlertFeed';
import MoradorInfo from '@/components/MoradorInfo';
import ResolveAlertModal from '@/components/ResolveAlertModal';
import ShareAlertSheet from '@/components/ShareAlertSheet';

const statusConfig = {
  active: { label: '🔍 Procurando', className: 'bg-success text-success-foreground' },
  found: { label: '✅ Encontrado', className: 'bg-primary text-primary-foreground' },
  cancelled: { label: '❌ Cancelado', className: 'bg-muted text-muted-foreground' },
} as const;

const AlertDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { alert, isLoading: loading } = useAlert(id ?? '');
  const { sightings, isLoading: loadingSightings } = useSightings(id ?? '');
  const { cancel, isCancelling } = useAlertActions();

  const [showResolveModal, setShowResolveModal] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showShareSheet, setShowShareSheet] = useState(false);
  const [expandedDescription, setExpandedDescription] = useState(false);

  // Broadcast listener for alert-resolved events
  useEffect(() => {
    if (!profile?.condominium_id || !id) return;
    const channel = supabase
      .channel(`condo-detail-${profile.condominium_id}`)
      .on('broadcast', { event: 'alert-resolved' }, (payload) => {
        const data = payload.payload as { alertId?: string; petName?: string };
        if (data.alertId && data.alertId !== id) {
          toast.info(`🐾 ${data.petName || 'Um pet'} foi encontrado!`);
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [profile?.condominium_id, id]);

  const handleConfirmCancel = async () => {
    await cancel(id!);
    setShowCancelConfirm(false);
    setTimeout(() => navigate('/'), 1500);
  };

  const handleResolveSuccess = () => {
    setShowResolveModal(false);
  };

  const statusBadge = (status: string) => {
    const config = statusConfig[status as keyof typeof statusConfig] ?? statusConfig.active;
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="min-h-screen w-full max-w-[480px] mx-auto overflow-x-hidden relative bg-mesh-light dark:bg-mesh-dark bg-grain pb-24">
        <header className="sticky top-0 z-40 glass-strong px-4 py-3">
          <div className="mx-auto flex max-w-[480px] items-center gap-3">
            <button onClick={() => navigate(-1)} className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="h-5 w-24 animate-pulse rounded bg-muted" />
          </div>
        </header>
        <main className="mx-auto max-w-[480px] space-y-4 px-4 py-4">
          <SkeletonCard variant="detail-photo" />
          <SkeletonCard variant="detail-text" />
          <SkeletonCard variant="detail-form" />
          <div className="space-y-2">
            <SkeletonCard variant="sighting" count={2} />
          </div>
        </main>
      </div>
    );
  }

  if (!alert) {
    return (
      <div className="flex min-h-screen w-full max-w-[480px] mx-auto overflow-x-hidden flex-col items-center justify-center bg-mesh-light dark:bg-mesh-dark gap-3">
        <p className="text-muted-foreground">Alerta não encontrado</p>
        <Button variant="outline" onClick={() => navigate('/')}>Voltar</Button>
      </div>
    );
  }

  const isOwner = user?.id === alert.reporter_id;
  const isSyndicOrAdmin = profile?.role === 'syndic' || profile?.role === 'admin';
  const isActive = alert.status === 'active';
  const canResolve = (isOwner || isSyndicOrAdmin) && isActive;
  const canCancel = isOwner && isActive;

  return (
    <div className="min-h-screen w-full max-w-[480px] mx-auto overflow-x-hidden relative bg-mesh-light dark:bg-mesh-dark bg-grain">
      {/* Hero section with overlay */}
      <div
        className="relative overflow-hidden bg-secondary"
        style={{ height: '280px' }}
      >
        {/* Photo with gradient overlay */}
        {alert.photo_url ? (
          <img
            src={alert.photo_url}
            alt={alert.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-secondary to-secondary/80">
            <PawPrint className="h-24 w-24 text-muted-foreground/20" />
          </div>
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background/60" />

        {/* Pet name overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h1 className="font-display text-3xl font-bold text-white drop-shadow-lg">
            {alert.title}
          </h1>
        </div>

        {/* Floating status badge */}
        <div className="absolute right-4 top-4 z-10">
          {statusBadge(alert.status)}
        </div>

        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="absolute left-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition-colors hover:bg-black/60"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>

        {/* Share button */}
        <button
          onClick={() => setShowShareSheet(true)}
          className="absolute right-14 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition-colors hover:bg-black/60"
        >
          <Share2 className="h-5 w-5" />
        </button>
      </div>

      <main className="mx-auto max-w-[480px] px-4 pb-24">
        {/* Card content sobreposto */}
        <div className="relative -mt-12 rounded-t-3xl bg-card shadow-lg">
          <div className="space-y-4 p-4">
            {/* Status Banner — Found */}
            {alert.status === 'found' && (
              <div className="rounded-2xl border border-success/30 bg-success/10 p-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-success" />
                  <span className="font-display font-semibold text-success">Pet encontrado! 🐾</span>
                </div>
                {alert.resolved_at && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Encerrado em {format(new Date(alert.resolved_at), "d 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                  </p>
                )}
                {alert.resolution_note && (
                  <p className="mt-2 text-sm italic text-foreground/80">{alert.resolution_note}</p>
                )}
              </div>
            )}

            {/* Status Banner — Cancelled */}
            {alert.status === 'cancelled' && (
              <div className="rounded-2xl border border-border bg-muted p-3 text-center">
                <p className="text-sm text-muted-foreground">Este alerta foi cancelado pelo dono.</p>
              </div>
            )}

            {/* Reporter info */}
            <div className="rounded-xl bg-secondary/50 p-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-stone-400">Reportado por</p>
              <MoradorInfo
                full_name={alert.reporter_profile?.full_name ?? 'Morador'}
                avatar_url={alert.reporter_profile?.avatar_url ?? null}
                role={alert.reporter_profile?.role ?? undefined}
              />
            </div>

            {/* Description (Expandable) */}
            <div className="overflow-hidden">
              <div className="space-y-3">
                <div>
                  <p
                    className={`text-sm leading-relaxed transition-all ${
                      expandedDescription ? 'text-foreground' : 'line-clamp-2 text-foreground'
                    }`}
                  >
                    {alert.description}
                  </p>
                  {alert.description && alert.description.length > 100 && (
                    <button
                      onClick={() => setExpandedDescription(!expandedDescription)}
                      className="mt-2 text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
                    >
                      {expandedDescription ? 'Menos' : 'Leia mais'}
                    </button>
                  )}
                </div>

                {/* Location & Time */}
                <div className="space-y-2 border-t border-border/50 pt-3">
                  <div className="flex items-start gap-2 text-sm">
                    <MapPin className="h-4 w-4 shrink-0 mt-0.5 text-primary" />
                    <span className="text-foreground">{alert.location_label || 'Local não informado'}</span>
                  </div>
                  <div className="flex items-start gap-2 text-xs text-muted-foreground">
                    <Clock className="h-4 w-4 shrink-0 mt-0.5" />
                    <div>
                      <p>{format(new Date(alert.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
                      <p>{formatDistanceToNow(new Date(alert.created_at), { addSuffix: true, locale: ptBR })}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sightings Empty State */}
            {!loadingSightings && sightings.length === 0 && isActive && (
              <div className="border-t border-border/50 pt-3">
                <div className="flex flex-col items-center gap-2 py-6 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary">
                    <Eye className="h-6 w-6 text-stone-300" />
                  </div>
                  <p className="text-sm font-semibold text-foreground">Nenhum avistamento ainda</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">Seja o primeiro a informar.</p>
                </div>
              </div>
            )}

            {/* Sightings Carousel */}
            {!loadingSightings && sightings.length > 0 && (
              <div className="border-t border-border/50 pt-3 space-y-2">
                <div className="flex items-center gap-1.5 font-display text-sm font-bold text-foreground">
                  <Eye className="h-4 w-4 text-primary" />
                  Avistamentos ({sightings.length})
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1 snap-x snap-mandatory scrollbar-hide">
                  {sightings.map((sighting) => (
                    <div
                      key={sighting.id}
                      className="flex-shrink-0 snap-start"
                    >
                      <div className="rounded-xl overflow-hidden border border-border/50 bg-secondary/50 shadow-sm hover:shadow-md transition-shadow">
                        <div className="w-32 h-24 bg-muted flex items-center justify-center text-xs text-muted-foreground">
                          📍 {formatDistanceToNow(new Date(sighting.created_at), { locale: ptBR, addSuffix: true })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Map */}
            {!loadingSightings && sightings.length > 0 && (
              <div className="pt-3">
                <h3 className="mb-2 font-display text-sm font-bold text-foreground">Mapa de avistamentos</h3>
                <div className="rounded-2xl overflow-hidden border border-border/50 shadow-sm" style={{ height: '180px' }}>
                  <AlertMap sightings={sightings} className="h-full" />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sighting form — only when active */}
        {isActive && (
          <div className="mt-4">
            <SightingForm alertId={id!} />
          </div>
        )}

        {/* Action buttons */}
        {(canResolve || canCancel) && (
          <div className="mt-4 space-y-2">
            {showCancelConfirm ? (
              <div className="space-y-2 rounded-xl border border-destructive/30 bg-destructive/5 p-4">
                <p className="text-sm font-medium text-foreground">Tem certeza? Esta ação não pode ser desfeita.</p>
                <div className="flex gap-2">
                  <Button
                    onClick={handleConfirmCancel}
                    disabled={isCancelling}
                    variant="destructive"
                    className="flex-1 font-semibold"
                    size="sm"
                  >
                    {isCancelling ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <XCircle className="mr-2 h-4 w-4" />}
                    {isCancelling ? 'Cancelando...' : 'Cancelar alerta'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowCancelConfirm(false)}
                    disabled={isCancelling}
                    size="sm"
                  >
                    Voltar
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {canResolve && (
                  <Button
                    onClick={() => setShowResolveModal(true)}
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold rounded-2xl h-12"
                  >
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Marcar como Encontrado ✓
                  </Button>
                )}
                {canCancel && (
                  <Button
                    onClick={() => setShowCancelConfirm(true)}
                    variant="outline"
                    className="w-full border-destructive text-destructive hover:bg-destructive/10 font-semibold rounded-2xl h-12"
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Cancelar alerta
                  </Button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Feed */}
        <div className="mt-4 rounded-2xl bg-card p-4 shadow-md">
          <AlertFeed alertId={id!} readOnly={!isActive} />
        </div>
      </main>

      {/* Resolve modal */}
      <ResolveAlertModal
        alertId={id!}
        petName={alert.title}
        isOpen={showResolveModal}
        onClose={() => setShowResolveModal(false)}
        onSuccess={handleResolveSuccess}
      />

      <ShareAlertSheet
        isOpen={showShareSheet}
        onClose={() => setShowShareSheet(false)}
        alertId={id!}
        alertTitle={alert.title}
        alertDescription={alert.description}
      />

    </div>
  );
};

export default AlertDetail;

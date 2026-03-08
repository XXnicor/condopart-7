import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useAlert } from '@/hooks/useAlert';
import { useAlertActions } from '@/hooks/useAlertActions';
import { useSightings } from '@/hooks/useSightings';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Loader2,
  MapPin,
  PawPrint,
  XCircle,
} from 'lucide-react';
import { SkeletonCard } from '@/components/ui/skeleton-card';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import BottomNav from '@/components/BottomNav';
import AlertMap from '@/components/AlertMap';
import SightingForm from '@/components/SightingForm';
import AlertFeed from '@/components/AlertFeed';
import ResolveAlertModal from '@/components/ResolveAlertModal';

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
      <div className="min-h-screen bg-background pb-20">
        <header className="sticky top-0 z-40 border-b border-border bg-card/95 px-4 py-3 backdrop-blur-md">
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
        <BottomNav />
      </div>
    );
  }

  if (!alert) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background gap-3">
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
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-40 border-b border-border bg-card/95 px-4 py-3 backdrop-blur-md">
        <div className="mx-auto flex max-w-[480px] items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="font-display text-lg font-bold">{alert.title}</h1>
          <div className="ml-auto">{statusBadge(alert.status)}</div>
        </div>
      </header>

      <main className="mx-auto max-w-[480px] px-4 py-4 space-y-4">
        {/* Status Banner — Found */}
        {alert.status === 'found' && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="rounded-2xl border border-success/30 bg-success/10 p-4"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-success" />
              <span className="font-display font-bold text-foreground">Pet encontrado! 🐾</span>
            </div>
            {alert.resolved_at && (
              <p className="mt-1 text-xs text-muted-foreground">
                Encerrado em {format(new Date(alert.resolved_at), "d 'de' MMMM 'às' HH:mm", { locale: ptBR })}
              </p>
            )}
            {alert.resolution_note && (
              <p className="mt-2 text-sm italic text-foreground/80">{alert.resolution_note}</p>
            )}
          </motion.div>
        )}

        {/* Status Banner — Cancelled */}
        {alert.status === 'cancelled' && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="rounded-2xl border border-border bg-muted p-4 text-center"
          >
            <p className="text-sm text-muted-foreground">Este alerta foi cancelado pelo dono.</p>
          </motion.div>
        )}

        {/* Photo */}
        <div className="overflow-hidden rounded-2xl bg-secondary shadow-md">
          <AspectRatio ratio={4 / 3}>
            {alert.photo_url ? (
              <img src={alert.photo_url} alt={alert.title} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <PawPrint className="h-16 w-16 text-muted-foreground/30" />
              </div>
            )}
          </AspectRatio>
        </div>

        {/* Info */}
        <Card className="rounded-2xl border-border/50 shadow-md">
          <CardContent className="space-y-3 p-4">
            <p className="text-sm leading-relaxed text-foreground">{alert.description}</p>
            <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {alert.location_label || 'Local não informado'}</span>
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {format(new Date(alert.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(alert.created_at), { addSuffix: true, locale: ptBR })}
            </p>
          </CardContent>
        </Card>

        {/* Action buttons */}
        {(canResolve || canCancel) && (
          <div className="space-y-2">
            <AnimatePresence mode="wait">
              {showCancelConfirm ? (
                <motion.div
                  key="confirm-cancel"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="space-y-2 rounded-xl border border-destructive/30 bg-destructive/5 p-4"
                >
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
                </motion.div>
              ) : (
                <motion.div
                  key="action-buttons"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="space-y-2"
                >
                  {canResolve && (
                    <Button
                      onClick={() => setShowResolveModal(true)}
                      className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
                    >
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Marcar como Encontrado ✓
                    </Button>
                  )}
                  {canCancel && (
                    <Button
                      onClick={() => setShowCancelConfirm(true)}
                      variant="outline"
                      className="w-full border-destructive text-destructive hover:bg-destructive/10 font-semibold"
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Cancelar alerta
                    </Button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Sighting form — only when active */}
        {isActive && <SightingForm alertId={id!} />}

        {/* Map */}
        {!loadingSightings && sightings.length > 0 && (
          <AlertMap sightings={sightings} className="mb-4" />
        )}

        {/* Feed */}
        <AlertFeed alertId={id!} readOnly={!isActive} />
      </main>

      {/* Resolve modal */}
      <ResolveAlertModal
        alertId={id!}
        petName={alert.title}
        isOpen={showResolveModal}
        onClose={() => setShowResolveModal(false)}
        onSuccess={handleResolveSuccess}
      />

      <BottomNav />
    </div>
  );
};

export default AlertDetail;

import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPlatformAlerts, type AlertWithCondo } from '@/lib/syndic';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Building2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  active: { label: 'Ativo', className: 'bg-amber-100 text-amber-700 border-amber-300' },
  found: { label: 'Encontrado', className: 'bg-green-100 text-green-700 border-green-300' },
  cancelled: { label: 'Cancelado', className: 'bg-muted text-muted-foreground border-border' },
};

type StatusFilter = 'all' | 'active' | 'found';

type Props = {
  condoId: string;
};

export default function AdminPlatformAlerts({ condoId }: Props) {
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState<AlertWithCondo[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  useEffect(() => {
    (async () => {
      try {
        setAlerts(await getPlatformAlerts(condoId));
      } catch {
        toast.error('Erro ao carregar alertas.');
      } finally {
        setLoading(false);
      }
    })();
  }, [condoId]);

  const filtered = useMemo(() => {
    if (statusFilter === 'all') return alerts;
    return alerts.filter((a) => a.status === statusFilter);
  }, [alerts, statusFilter]);

  const pills: { label: string; value: StatusFilter }[] = [
    { label: 'Todos', value: 'all' },
    { label: 'Ativos', value: 'active' },
    { label: 'Encontrados', value: 'found' },
  ];

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-14 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Últimos 100 alertas do condomínio
      </p>

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

      {filtered.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          Nenhum alerta encontrado.
        </p>
      ) : (
        <div className="space-y-0">
          {filtered.map((alert) => {
            const badge = STATUS_BADGE[alert.status] ?? STATUS_BADGE.cancelled;
            return (
              <div key={alert.id}>
                <button
                  className="flex w-full items-center justify-between gap-2 px-1 py-3 text-left"
                  onClick={() => navigate(`/alert/${alert.id}`)}
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-foreground">{alert.title}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {alert.condo_name && (
                        <span className="flex items-center gap-0.5">
                          <Building2 className="h-3 w-3" />
                          {alert.condo_name}
                        </span>
                      )}
                      {alert.reporter_name && (
                        <span>por {alert.reporter_name}</span>
                      )}
                      <span>
                        {format(new Date(alert.created_at), 'd MMM yyyy', { locale: ptBR })}
                      </span>
                    </div>
                  </div>
                  <Badge variant="outline" className={badge.className}>
                    {badge.label}
                  </Badge>
                </button>
                <Separator />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

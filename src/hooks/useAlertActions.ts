import { useState } from 'react';
import { toast } from 'sonner';
import { resolveAlert, cancelAlert } from '@/lib/alerts';

export function useAlertActions() {
  const [isResolving, setIsResolving] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  const resolve = async (alertId: string, note: string) => {
    setIsResolving(true);
    try {
      await resolveAlert(alertId, note);
      toast.success('🎉 Que ótima notícia! Alerta encerrado.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao atualizar alerta.');
    } finally {
      setIsResolving(false);
    }
  };

  const cancel = async (alertId: string) => {
    setIsCancelling(true);
    try {
      await cancelAlert(alertId);
      toast.success('Alerta cancelado.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao cancelar alerta.');
    } finally {
      setIsCancelling(false);
    }
  };

  return { resolve, cancel, isResolving, isCancelling };
}

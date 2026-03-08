import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

type AlertRow = Tables<'alerts'>;

export function useAlert(alertId: string) {
  const [alert, setAlert] = useState<AlertRow | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!alertId) return;

    let cancelled = false;

    const fetchAlert = async () => {
      setIsLoading(true);
      const { data, error: fetchError } = await supabase
        .from('alerts')
        .select('*')
        .eq('id', alertId)
        .single();

      if (cancelled) return;

      if (fetchError) {
        setError(new Error(fetchError.message));
      } else {
        setAlert(data);
      }
      setIsLoading(false);
    };

    fetchAlert();

    const channel = supabase
      .channel(`alert-status-${alertId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'alerts',
          filter: `id=eq.${alertId}`,
        },
        (payload) => {
          setAlert(payload.new as AlertRow);
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [alertId]);

  return { alert, isLoading, error };
}

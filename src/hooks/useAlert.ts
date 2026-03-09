import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

type AlertRow = Tables<'alerts'>;

type ProfileData = {
  full_name: string | null;
  avatar_url: string | null;
  role: string | null;
};

export type AlertWithProfile = AlertRow & { reporter_profile?: ProfileData | null };

export function useAlert(alertId: string) {
  const [alert, setAlert] = useState<AlertWithProfile | null>(null);
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
      } else if (data) {
        let reporterProfile: ProfileData | null = null;
        if (data.reporter_id) {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('full_name, avatar_url, role')
            .eq('id', data.reporter_id)
            .single();
          if (profileData) reporterProfile = profileData;
        }
        setAlert({ ...data, reporter_profile: reporterProfile });
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
        () => {
          fetchAlert();
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

import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import {
  getSightingsByAlert,
  createSighting,
  deleteSighting,
  subscribeSightings,
  type Sighting,
  type CreateSightingPayload,
} from '@/lib/sightings';

export function useSightings(alertId: string) {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['sightings', alertId],
    queryFn: () => getSightingsByAlert(alertId),
    enabled: !!alertId,
  });

  useEffect(() => {
    if (!alertId) return;

    const unsub = subscribeSightings(alertId, (newSighting) => {
      queryClient.setQueryData<Sighting[]>(
        ['sightings', alertId],
        (old = []) => [newSighting, ...old],
      );
    });

    return unsub;
  }, [alertId, queryClient]);

  return { sightings: data ?? [], isLoading, error };
}

export function useCreateSighting() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { mutate, isPending } = useMutation({
    mutationFn: (payload: CreateSightingPayload) => {
      if (!user) throw new Error('Usuário não autenticado.');
      return createSighting(payload, user.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sightings'] });
      toast.success('Avistamento registrado! Obrigado por ajudar 🐾');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return { createSighting: mutate, isCreating: isPending };
}

export function useDeleteSighting() {
  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation({
    mutationFn: deleteSighting,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sightings'] });
      toast.success('Avistamento removido.');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return { deleteSighting: mutate, isDeleting: isPending };
}

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import {
  getCommentsByAlert,
  createComment,
  deleteComment,
  type CreateCommentPayload,
} from '@/lib/comments';

export function useComments(alertId: string) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['comments', alertId],
    queryFn: () => getCommentsByAlert(alertId),
    enabled: !!alertId,
  });

  return { comments: data ?? [], isLoading, error };
}

export function useCreateComment() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { mutate, isPending } = useMutation({
    mutationFn: (payload: CreateCommentPayload) => {
      if (!user) throw new Error('Usuário não autenticado.');
      return createComment(payload, user.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments'] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return { createComment: mutate, isCreating: isPending };
}

export function useDeleteComment() {
  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation({
    mutationFn: deleteComment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments'] });
      toast.success('Comentário removido.');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return { deleteComment: mutate, isDeleting: isPending };
}

import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { MapPin, Trash2, User, Loader2, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

import { useAuth } from '@/contexts/AuthContext';
import { useSightings } from '@/hooks/useSightings';
import { useComments, useCreateComment, useDeleteComment } from '@/hooks/useComments';
import { buildFeed, type FeedItem } from '@/lib/feed';
import { SkeletonCard } from '@/components/ui/skeleton-card';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';

const commentSchema = z.object({
  content: z
    .string()
    .min(1, 'Comentário não pode estar vazio.')
    .max(500, 'Máximo de 500 caracteres.')
    .transform((v) => v.trim())
    .refine((v) => v.length >= 1, 'Comentário não pode estar vazio.'),
});

type CommentFormData = z.infer<typeof commentSchema>;

interface AlertFeedProps {
  alertId: string;
  readOnly?: boolean;
}

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.2 } },
};

const AlertFeed = ({ alertId, readOnly = false }: AlertFeedProps) => {
  const { user } = useAuth();
  const { sightings, isLoading: loadingSightings, error: sightingsError } = useSightings(alertId);
  const { comments, isLoading: loadingComments, error: commentsError } = useComments(alertId);
  const { createComment, isCreating } = useCreateComment();
  const { deleteComment } = useDeleteComment();
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);

  const feedItems = useMemo(() => buildFeed(sightings, comments), [sightings, comments]);

  const isLoading = loadingSightings || loadingComments;

  useEffect(() => {
    if (sightingsError) toast.error('Erro ao carregar avistamentos.');
  }, [sightingsError]);

  useEffect(() => {
    if (commentsError) toast.error('Erro ao carregar comentários.');
  }, [commentsError]);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { isValid },
  } = useForm<CommentFormData>({
    resolver: zodResolver(commentSchema),
    mode: 'onChange',
    defaultValues: { content: '' },
  });

  const contentValue = watch('content') ?? '';

  const onSubmit = (data: CommentFormData) => {
    createComment(
      { alert_id: alertId, content: data.content },
      { onSuccess: () => reset() },
    );
  };

  const handleDeleteComment = (commentId: string) => {
    deleteComment(commentId);
    setConfirmingDeleteId(null);
  };

  const formatTimestamp = (dateStr: string) =>
    format(new Date(dateStr), 'dd/MM HH:mm', { locale: ptBR });

  return (
    <section className="space-y-4">
      <h2 className="font-display text-base font-bold">💬 Atualizações</h2>

      {/* Feed items */}
      {isLoading ? (
        <div className="space-y-3">
          <SkeletonCard variant="feed" count={3} />
        </div>
      ) : feedItems.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          Nenhuma atualização ainda. Seja o primeiro a comentar!
        </p>
      ) : (
        <div className="space-y-0">
          <AnimatePresence initial={false}>
            {feedItems.map((item, idx) => (
              <motion.div
                key={`${item.type}-${item.data.id}`}
                variants={itemVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
                layout
              >
                {idx > 0 && <Separator className="my-0" />}
                {item.type === 'sighting' ? (
                  <SightingItem item={item} formatTimestamp={formatTimestamp} />
                ) : (
                  <CommentItem
                    item={item}
                    currentUserId={user?.id ?? ''}
                    confirmingDeleteId={confirmingDeleteId}
                    onConfirmDelete={handleDeleteComment}
                    onRequestDelete={setConfirmingDeleteId}
                    onCancelDelete={() => setConfirmingDeleteId(null)}
                    formatTimestamp={formatTimestamp}
                  />
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* New comment form */}
      {!readOnly && (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-2">
          <div className="relative">
            <Textarea
              {...register('content')}
              placeholder="Deixe um comentário ou informação sobre este pet..."
              maxLength={500}
              className="min-h-[80px] resize-none rounded-xl text-sm pr-16"
            />
            <span className="absolute bottom-2 right-3 text-[11px] text-muted-foreground">
              {contentValue.length}/500
            </span>
          </div>
          <Button
            type="submit"
            disabled={!isValid || isCreating}
            className="w-full font-semibold"
            size="sm"
          >
            {isCreating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Comentar
              </>
            )}
          </Button>
        </form>
      )}
    </section>
  );
};

/* ── Sighting sub-component ────────────────────────── */

function SightingItem({
  item,
  formatTimestamp,
}: {
  item: Extract<FeedItem, { type: 'sighting' }>;
  formatTimestamp: (d: string) => string;
}) {
  const s = item.data;
  return (
    <div className="py-3 space-y-1">
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-500/10">
          <MapPin className="h-3.5 w-3.5 text-amber-500" />
        </div>
        <span className="text-xs font-semibold text-foreground">📍 Avistamento registrado</span>
      </div>
      {s.notes && <p className="pl-9 text-sm text-foreground">{s.notes}</p>}
      {s.location?.label && (
        <p className="pl-9 flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="h-3 w-3 text-amber-500" />
          {s.location.label}
        </p>
      )}
      <p className="pl-9 text-[11px] text-muted-foreground">{formatTimestamp(s.created_at)}</p>
    </div>
  );
}

/* ── Comment sub-component ─────────────────────────── */

function CommentItem({
  item,
  currentUserId,
  confirmingDeleteId,
  onConfirmDelete,
  onRequestDelete,
  onCancelDelete,
  formatTimestamp,
}: {
  item: Extract<FeedItem, { type: 'comment' }>;
  currentUserId: string;
  confirmingDeleteId: string | null;
  onConfirmDelete: (id: string) => void;
  onRequestDelete: (id: string) => void;
  onCancelDelete: () => void;
  formatTimestamp: (d: string) => string;
}) {
  const c = item.data;
  const isOwner = c.user_id === currentUserId;
  const isConfirming = confirmingDeleteId === c.id;
  const initial = c.author?.full_name?.charAt(0).toUpperCase();

  return (
    <div className="py-3 space-y-1">
      <div className="flex items-center gap-2">
        {c.author?.avatar_url ? (
          <img src={c.author.avatar_url} alt="" className="h-7 w-7 rounded-full object-cover" />
        ) : initial ? (
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
            {initial}
          </div>
        ) : (
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted">
            <User className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
        )}
        <span className="text-xs font-medium text-foreground">
          {c.author?.full_name ?? 'Morador'}
        </span>
        <span className="ml-auto text-[11px] text-muted-foreground">
          {formatTimestamp(c.created_at)}
        </span>
        {isOwner && !isConfirming && (
          <button
            type="button"
            onClick={() => onRequestDelete(c.id)}
            className="text-muted-foreground/40 transition-colors hover:text-destructive"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
        {isOwner && isConfirming && (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onConfirmDelete(c.id)}
              className="text-[11px] font-medium text-destructive hover:underline"
            >
              Confirmar?
            </button>
            <button
              type="button"
              onClick={onCancelDelete}
              className="text-[11px] text-muted-foreground hover:underline"
            >
              Cancelar
            </button>
          </div>
        )}
      </div>
      <p className="pl-9 text-sm text-foreground">{c.content}</p>
    </div>
  );
}

export default AlertFeed;

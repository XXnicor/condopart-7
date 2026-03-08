import { supabase } from '@/integrations/supabase/client';

export interface CommentAuthor {
  full_name: string | null;
  avatar_url: string | null;
}

export interface Comment {
  id: string;
  alert_id: string;
  user_id: string;
  content: string;
  created_at: string;
  author?: CommentAuthor;
}

export interface CreateCommentPayload {
  alert_id: string;
  content: string;
}

export async function getCommentsByAlert(alertId: string): Promise<Comment[]> {
  const { data, error } = await supabase
    .from('comments')
    .select('id, alert_id, user_id, content, created_at')
    .eq('alert_id', alertId)
    .order('created_at', { ascending: false });

  if (error) throw new Error('Erro ao buscar comentários.');

  const comments = data ?? [];
  if (comments.length === 0) return [];

  // Fetch author profiles
  const userIds = [...new Set(comments.map((c) => c.user_id))];
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url')
    .in('id', userIds);

  const profileMap = new Map(
    (profiles ?? []).map((p) => [p.id, { full_name: p.full_name, avatar_url: p.avatar_url }]),
  );

  return comments.map((c) => ({
    id: c.id,
    alert_id: c.alert_id,
    user_id: c.user_id,
    content: c.content,
    created_at: c.created_at,
    author: profileMap.get(c.user_id),
  }));
}

export async function createComment(
  payload: CreateCommentPayload,
  userId: string,
): Promise<Comment> {
  const { data, error } = await supabase
    .from('comments')
    .insert({
      alert_id: payload.alert_id,
      user_id: userId,
      content: payload.content,
    })
    .select('id, alert_id, user_id, content, created_at')
    .single();

  if (error || !data) throw new Error('Erro ao enviar comentário.');

  return {
    id: data.id,
    alert_id: data.alert_id,
    user_id: data.user_id,
    content: data.content,
    created_at: data.created_at,
  };
}

export async function deleteComment(commentId: string): Promise<void> {
  const { error } = await supabase
    .from('comments')
    .delete()
    .eq('id', commentId);

  if (error) throw new Error('Erro ao remover comentário.');
}

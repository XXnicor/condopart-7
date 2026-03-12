import type { Sighting } from '@/lib/sightings';
import type { Comment } from '@/lib/comments';

export type FeedItem =
  | { type: 'sighting'; data: Sighting; timestamp: string }
  | { type: 'comment'; data: Comment; timestamp: string };

export function buildFeed(
  sightings: Sighting[],
  comments: Comment[],
): FeedItem[] {
  const items: FeedItem[] = [
    ...sightings.map((s) => ({ type: 'sighting' as const, data: s, timestamp: s.created_at })),
    ...comments.map((c) => ({ type: 'comment' as const, data: c, timestamp: c.created_at })),
  ];
  return items.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );
}

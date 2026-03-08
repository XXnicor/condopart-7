import { Eye, MapPin, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent } from '@/components/ui/card';
import type { FeedItem } from '@/lib/feed';
import MediaCarousel from '@/components/MediaCarousel';
import SightingMiniMap from '@/components/SightingMiniMap';

interface FeedCardProps {
  item: FeedItem;
  currentUserId: string;
  onDeleteComment?: (id: string) => void;
}

const FeedCard = ({ item, currentUserId, onDeleteComment }: FeedCardProps) => {
  const timeAgo = formatDistanceToNow(new Date(item.timestamp), {
    locale: ptBR,
    addSuffix: true,
  });

  if (item.type === 'sighting') {
    const s = item.data;
    return (
      <Card className="rounded-2xl border-border/50 shadow-sm">
        <CardContent className="space-y-2 p-3">
          {/* Header */}
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10">
              <Eye className="h-3.5 w-3.5 text-primary" />
            </div>
            <span className="text-xs font-semibold text-foreground">Avistamento</span>
            <span className="ml-auto text-[11px] text-muted-foreground">{timeAgo}</span>
          </div>

          {/* Media */}
          {(s.photo_urls.length > 0 || s.video_url) && (
            <MediaCarousel photoUrls={s.photo_urls} videoUrl={s.video_url} />
          )}

          {/* Mini map */}
          {s.location && <SightingMiniMap location={s.location} />}

          {/* Location label */}
          {s.location?.label && (
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3 text-primary" />
              {s.location.label}
            </p>
          )}

          {/* Notes */}
          {s.notes && <p className="text-sm text-foreground">{s.notes}</p>}
        </CardContent>
      </Card>
    );
  }

  // Comment card
  const c = item.data;
  const initial = c.author?.full_name?.charAt(0).toUpperCase() ?? '?';

  return (
    <Card className="rounded-2xl border-border/50 bg-muted/30 shadow-sm">
      <CardContent className="space-y-1 p-3">
        {/* Header */}
        <div className="flex items-center gap-2">
          {c.author?.avatar_url ? (
            <img
              src={c.author.avatar_url}
              alt=""
              className="h-6 w-6 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
              {initial}
            </div>
          )}
          <span className="text-xs font-medium text-foreground">
            {c.author?.full_name ?? 'Morador'}
          </span>
          <span className="ml-auto text-[11px] text-muted-foreground">{timeAgo}</span>
          {c.user_id === currentUserId && onDeleteComment && (
            <button
              type="button"
              onClick={() => onDeleteComment(c.id)}
              className="text-muted-foreground/40 transition-colors hover:text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Content */}
        <p className="pl-8 text-sm text-foreground">{c.content}</p>
      </CardContent>
    </Card>
  );
};

export default FeedCard;

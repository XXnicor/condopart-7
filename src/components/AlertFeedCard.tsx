import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Eye, MessageCircle, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';

interface AlertFeedCardProps {
  id: string;
  title: string;
  description: string;
  photo_url?: string;
  location_label?: string;
  status: 'active' | 'found' | 'cancelled';
  created_at: string;
  sighting_count?: number;
  comment_count?: number;
  onClick?: () => void;
  index?: number;
}

const AlertFeedCard = ({
  id,
  title,
  description,
  photo_url,
  location_label,
  status,
  created_at,
  sighting_count = 0,
  comment_count = 0,
  onClick,
  index = 0,
}: AlertFeedCardProps) => {
  const timeAgo = formatDistanceToNow(new Date(created_at), {
    locale: ptBR,
    addSuffix: true,
  });

  const statusConfig = {
    active: {
      color: 'bg-amber-500/90 text-white',
      pulse: true,
      label: 'Perdido',
    },
    found: {
      color: 'bg-emerald-500/90 text-white',
      pulse: false,
      label: 'Encontrado',
    },
    cancelled: {
      color: 'bg-gray-400/90 text-white',
      pulse: false,
      label: 'Cancelado',
    },
  };

  const config = statusConfig[status];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
      onClick={onClick}
      className="cursor-pointer"
    >
      <div className="flex gap-3 rounded-2xl border border-border/50 bg-card overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-200">
        {/* Photo section - 100px */}
        <div className="h-24 w-24 flex-shrink-0 overflow-hidden bg-secondary">
          {photo_url ? (
            <img
              src={photo_url}
              alt={title}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-secondary to-secondary/80 text-muted-foreground/30">
              🐾
            </div>
          )}
        </div>

        {/* Content section */}
        <div className="flex-1 flex flex-col py-3 pr-3">
          {/* Header with status badge */}
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="font-display font-bold text-foreground truncate text-sm">
              {title}
            </h3>
            <motion.div
              animate={config.pulse ? { scale: [1, 1.08, 1] } : {}}
              transition={
                config.pulse ? { duration: 2, repeat: Infinity } : undefined
              }
            >
              <Badge className={`${config.color} text-xs font-semibold whitespace-nowrap`}>
                {config.label}
              </Badge>
            </motion.div>
          </div>

          {/* Description - 2 lines */}
          <p className="text-xs text-muted-foreground line-clamp-2 mb-2 leading-relaxed">
            {description}
          </p>

          {/* Location and time */}
          <div className="flex items-center gap-3 text-[11px] text-muted-foreground mb-2">
            {location_label && (
              <div className="flex items-center gap-1">
                <MapPin className="h-3 w-3 text-primary" />
                <span className="truncate">{location_label}</span>
              </div>
            )}
            <span>{timeAgo}</span>
          </div>

          {/* Footer with counters */}
          <div className="flex gap-2 bg-amber-50 rounded-b-lg px-3 py-2 border-t border-amber-100/50 mt-auto">
            <div className="flex items-center gap-1 text-[10px] text-amber-900 font-semibold">
              <Eye className="h-3 w-3" />
              <span>{sighting_count} avistamentos</span>
            </div>
            <div className="flex items-center gap-1 text-[10px] text-amber-900 font-semibold">
              <MessageCircle className="h-3 w-3" />
              <span>{comment_count} comentários</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default AlertFeedCard;

// Video uploads limited to 50MB on free Supabase plan
import { useState } from 'react';
import { Play, ChevronLeft, ChevronRight } from 'lucide-react';

type MediaItem =
  | { kind: 'photo'; url: string }
  | { kind: 'video'; url: string };

interface MediaCarouselProps {
  photoUrls: string[];
  videoUrl: string | null;
}

const MediaCarousel = ({ photoUrls, videoUrl }: MediaCarouselProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const items: MediaItem[] = [
    ...photoUrls.map((url) => ({ kind: 'photo' as const, url })),
    ...(videoUrl ? [{ kind: 'video' as const, url: videoUrl }] : []),
  ];

  if (items.length === 0) return null;

  const current = items[currentIndex];

  return (
    <div className="relative w-full overflow-hidden rounded-xl bg-muted" style={{ aspectRatio: '4/3' }}>
      {current.kind === 'photo' ? (
        <img
          src={current.url}
          alt="Mídia do avistamento"
          className="h-full w-full object-cover"
        />
      ) : (
        <video
          src={current.url}
          controls
          playsInline
          className="h-full w-full object-cover"
        />
      )}

      {current.kind === 'video' && (
        <div className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-black/50 px-2 py-0.5 text-[10px] text-white">
          <Play className="h-3 w-3" />
          Vídeo
        </div>
      )}

      {items.length > 1 && (
        <>
          <button
            type="button"
            onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
            disabled={currentIndex === 0}
            className="absolute left-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white disabled:opacity-20"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setCurrentIndex((i) => Math.min(items.length - 1, i + 1))}
            disabled={currentIndex === items.length - 1}
            className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white disabled:opacity-20"
          >
            <ChevronRight className="h-4 w-4" />
          </button>

          <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1.5">
            {items.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 w-1.5 rounded-full transition-colors ${
                  i === currentIndex ? 'bg-white' : 'bg-white/40'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default MediaCarousel;

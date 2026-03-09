import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';

type SkeletonVariant =
  | 'feed'
  | 'detail-photo'
  | 'detail-text'
  | 'sighting'
  | 'condo'
  | 'profile-avatar'
  | 'profile-field'
  | 'alert-compact'
  | 'detail-form';

interface SkeletonCardProps {
  variant: SkeletonVariant;
  count?: number;
}

const skeletonBase = 'bg-stone-100 dark:bg-stone-800';

const FeedSkeleton = () => (
  <Card className="overflow-hidden rounded-2xl border-border/50 shadow-md">
    <CardContent className="flex gap-3 p-3">
      <Skeleton className={`h-20 w-20 flex-shrink-0 rounded-lg ${skeletonBase}`} />
      <div className="flex flex-1 flex-col justify-between gap-2">
        <div className="flex items-start justify-between">
          <Skeleton className={`h-4 w-24 ${skeletonBase}`} />
          <Skeleton className={`h-5 w-12 rounded-full ${skeletonBase}`} />
        </div>
        <Skeleton className={`h-3 w-full ${skeletonBase}`} />
        <Skeleton className={`h-3 w-32 ${skeletonBase}`} />
      </div>
    </CardContent>
  </Card>
);

const DetailPhotoSkeleton = () => (
  <div className="overflow-hidden rounded-2xl shadow-md">
    <div className="relative w-full" style={{ paddingBottom: '75%' }}>
      <Skeleton className={`absolute inset-0 rounded-2xl ${skeletonBase}`} />
    </div>
  </div>
);

const DetailTextSkeleton = () => (
  <Card className="rounded-2xl border-border/50 shadow-md">
    <CardContent className="space-y-3 p-4">
      <Skeleton className={`h-4 w-full ${skeletonBase}`} />
      <Skeleton className={`h-4 w-3/4 ${skeletonBase}`} />
      <div className="flex gap-3">
        <Skeleton className={`h-3 w-28 ${skeletonBase}`} />
        <Skeleton className={`h-3 w-36 ${skeletonBase}`} />
      </div>
      <Skeleton className={`h-3 w-20 ${skeletonBase}`} />
    </CardContent>
  </Card>
);

const SightingSkeleton = () => (
  <Card className="rounded-2xl border-border/50 shadow-md">
    <CardContent className="flex items-start gap-3 p-3">
      <Skeleton className={`h-8 w-8 flex-shrink-0 rounded-full ${skeletonBase}`} />
      <div className="flex-1 space-y-2">
        <Skeleton className={`h-3 w-full ${skeletonBase}`} />
        <Skeleton className={`h-3 w-2/3 ${skeletonBase}`} />
      </div>
    </CardContent>
  </Card>
);

const CondoSkeleton = () => (
  <Skeleton className={`h-16 w-full rounded-2xl ${skeletonBase}`} />
);

const ProfileAvatarSkeleton = () => (
  <div className="flex flex-col items-center gap-2">
    <Skeleton className={`h-16 w-16 rounded-full ${skeletonBase}`} />
    <Skeleton className={`h-3 w-32 ${skeletonBase}`} />
    <Skeleton className={`h-5 w-20 rounded-full ${skeletonBase}`} />
  </div>
);

const ProfileFieldSkeleton = () => (
  <div className="space-y-1.5">
    <Skeleton className={`h-3 w-16 ${skeletonBase}`} />
    <Skeleton className={`h-10 w-full rounded-md ${skeletonBase}`} />
  </div>
);

const AlertCompactSkeleton = () => (
  <Card className="rounded-2xl border-border/50 shadow-md">
    <CardContent className="flex items-center justify-between p-3">
      <div className="space-y-1.5">
        <Skeleton className={`h-4 w-24 ${skeletonBase}`} />
        <Skeleton className={`h-3 w-40 ${skeletonBase}`} />
      </div>
      <Skeleton className={`h-5 w-16 rounded-full ${skeletonBase}`} />
    </CardContent>
  </Card>
);

const DetailFormSkeleton = () => (
  <Card className="rounded-2xl border-border/50 shadow-md">
    <CardContent className="space-y-3 p-4">
      <Skeleton className={`h-4 w-32 ${skeletonBase}`} />
      <Skeleton className={`h-16 w-full rounded-md ${skeletonBase}`} />
      <Skeleton className={`h-10 w-full rounded-md ${skeletonBase}`} />
      <Skeleton className={`h-9 w-full rounded-md ${skeletonBase}`} />
    </CardContent>
  </Card>
);

const variantMap: Record<SkeletonVariant, React.FC> = {
  feed: FeedSkeleton,
  'detail-photo': DetailPhotoSkeleton,
  'detail-text': DetailTextSkeleton,
  sighting: SightingSkeleton,
  condo: CondoSkeleton,
  'profile-avatar': ProfileAvatarSkeleton,
  'profile-field': ProfileFieldSkeleton,
  'alert-compact': AlertCompactSkeleton,
  'detail-form': DetailFormSkeleton,
};

const SkeletonCard = ({ variant, count = 1 }: SkeletonCardProps) => {
  const Component = variantMap[variant];
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <Component key={i} />
      ))}
    </>
  );
};

export { SkeletonCard };

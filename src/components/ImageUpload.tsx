import { useRef, useEffect } from 'react';
import { Camera, X, Loader2, CheckCircle2 } from 'lucide-react';
import { useImageUpload } from '@/hooks/useImageUpload';
import { cn } from '@/lib/utils';

interface ImageUploadProps {
  userId: string;
  onUploadComplete: (url: string) => void;
  onReset?: () => void;
  onUploadingChange?: (uploading: boolean) => void;
  error?: string;
  className?: string;
}

const ImageUpload = ({
  userId,
  onUploadComplete,
  onReset,
  onUploadingChange,
  error: externalError,
  className,
}: ImageUploadProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const {
    preview,
    uploading,
    error: uploadError,
    uploadedUrl,
    handleFileSelect,
    reset,
  } = useImageUpload({ userId, onUploadComplete });

  useEffect(() => {
    onUploadingChange?.(uploading);
  }, [uploading, onUploadingChange]);

  const displayError = externalError || uploadError;

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    handleFileSelect(file);
  };

  const handleRemove = () => {
    reset();
    onReset?.();
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  return (
    <div className={cn('w-full', className)}>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleChange}
      />

      {preview ? (
        // Preview state
        <div className="relative w-full overflow-hidden rounded-2xl">
          <div className="relative w-full" style={{ paddingBottom: '75%' }}>
            <img
              src={preview}
              alt="Preview"
              className="absolute inset-0 h-full w-full object-cover rounded-2xl"
            />

            {/* Loading overlay */}
            {uploading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 rounded-2xl">
                <Loader2 className="h-8 w-8 animate-spin text-white" />
                <span className="mt-2 text-sm font-medium text-white">Enviando...</span>
              </div>
            )}

            {/* Success indicator */}
            {uploadedUrl && !uploading && (
              <div className="absolute bottom-2 left-2 flex items-center gap-1 rounded-full bg-green-500/90 px-2 py-1 text-xs font-medium text-white">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Enviado
              </div>
            )}
          </div>

          {/* Remove button */}
          <button
            type="button"
            onClick={handleRemove}
            disabled={uploading}
            className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white transition-colors hover:bg-black/80 disabled:opacity-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        // Empty state
        <button
          type="button"
          onClick={handleClick}
          className={cn(
            'flex w-full cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed transition-colors',
            displayError
              ? 'border-destructive bg-destructive/5'
              : 'border-amber-300 bg-amber-50 hover:border-amber-400 hover:bg-amber-100/50'
          )}
          style={{ height: '200px' }}
        >
          <Camera className="mb-2 h-8 w-8 text-amber-500" />
          <span className="text-sm font-medium text-muted-foreground">
            Toque para adicionar uma foto
          </span>
        </button>
      )}

      {displayError && (
        <p className="mt-1.5 text-xs text-destructive">{displayError}</p>
      )}
    </div>
  );
};

export default ImageUpload;

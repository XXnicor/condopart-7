import { useState, useCallback } from 'react';
import { uploadAlertPhoto } from '@/lib/storage';

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE_MB = 10;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

interface UseImageUploadOptions {
  userId: string;
  onUploadComplete?: (url: string) => void;
}

export function useImageUpload({ userId, onUploadComplete }: UseImageUploadOptions) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);

  const reset = useCallback(() => {
    if (preview) {
      URL.revokeObjectURL(preview);
    }
    setFile(null);
    setPreview(null);
    setUploading(false);
    setError(null);
    setUploadedUrl(null);
  }, [preview]);

  const handleFileSelect = useCallback(
    async (selectedFile: File | null) => {
      setError(null);

      if (!selectedFile) {
        reset();
        return;
      }

      // Validate file type
      if (!ACCEPTED_TYPES.includes(selectedFile.type)) {
        setError('Formato não suportado. Use JPEG, PNG ou WebP.');
        return;
      }

      // Validate file size
      if (selectedFile.size > MAX_SIZE_BYTES) {
        setError(`A foto deve ter no máximo ${MAX_SIZE_MB}MB`);
        return;
      }

      // Set preview immediately
      const previewUrl = URL.createObjectURL(selectedFile);
      setFile(selectedFile);
      setPreview(previewUrl);
      setUploading(true);

      try {
        const url = await uploadAlertPhoto(selectedFile, userId);
        setUploadedUrl(url);
        onUploadComplete?.(url);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erro ao enviar foto';
        setError(message);
        // Keep preview even if upload fails
      } finally {
        setUploading(false);
      }
    },
    [userId, onUploadComplete, reset]
  );

  return {
    file,
    preview,
    uploading,
    error,
    uploadedUrl,
    handleFileSelect,
    reset,
  };
}

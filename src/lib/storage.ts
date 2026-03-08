import { supabase } from '@/integrations/supabase/client';

const MAX_IMAGE_SIZE = 1200;
const JPEG_QUALITY = 0.85;
const BUCKET_NAME = 'pet-photos';

/**
 * Compress and resize image using Canvas API
 */
export async function compressImage(
  file: File,
  maxSize: number = MAX_IMAGE_SIZE,
  quality: number = JPEG_QUALITY
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      let { width, height } = img;

      // Calculate new dimensions maintaining aspect ratio
      if (width > maxSize || height > maxSize) {
        if (width > height) {
          height = Math.round((height * maxSize) / width);
          width = maxSize;
        } else {
          width = Math.round((width * maxSize) / height);
          height = maxSize;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Não foi possível processar a imagem'));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Não foi possível comprimir a imagem'));
          }
        },
        'image/jpeg',
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Não foi possível carregar a imagem'));
    };

    img.src = url;
  });
}

/**
 * Upload photo to Supabase Storage
 * @returns Public URL of the uploaded image
 */
export async function uploadAlertPhoto(
  file: File,
  userId: string
): Promise<string> {
  try {
    // Compress image before upload
    const compressedBlob = await compressImage(file);
    
    // Generate unique filename
    const timestamp = Date.now();
    const filePath = `${userId}/${timestamp}.jpg`;

    // Upload to storage
    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, compressedBlob, {
        contentType: 'image/jpeg',
        upsert: false,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw new Error('Erro ao fazer upload da foto. Tente novamente.');
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath);

    return urlData.publicUrl;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Erro ao fazer upload da foto. Tente novamente.');
  }
}

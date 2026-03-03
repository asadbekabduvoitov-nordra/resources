import { supabase } from '../config';
import { logger } from '../utils/logger';
import { AppError } from '../utils/errors';
import { randomUUID } from 'crypto';

const BUCKET_NAME = 'resources';

export interface UploadResult {
  url: string;
  path: string;
}

export class StorageService {
  /**
   * Upload a file to the resources bucket
   */
  async uploadFile(
    file: Express.Multer.File,
    folder?: string
  ): Promise<UploadResult> {
    const fileExt = this.getFileExtension(file.originalname);
    const fileName = `${randomUUID()}${fileExt}`;
    const filePath = folder ? `${folder}/${fileName}` : fileName;

    logger.info(`Uploading file: ${filePath} (${file.mimetype})`);

    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (error) {
      logger.error('File upload error:', error);
      throw new AppError(`File upload failed: ${error.message}`, 500, 'UPLOAD_ERROR');
    }

    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath);

    logger.info(`File uploaded successfully: ${urlData.publicUrl}`);

    return {
      url: urlData.publicUrl,
      path: filePath,
    };
  }

  /**
   * Delete a file from the resources bucket
   */
  async deleteFile(filePath: string): Promise<void> {
    logger.info(`Deleting file: ${filePath}`);

    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([filePath]);

    if (error) {
      logger.error('File delete error:', error);
      throw new AppError(`File delete failed: ${error.message}`, 500, 'DELETE_ERROR');
    }

    logger.info(`File deleted successfully: ${filePath}`);
  }

  /**
   * Get public URL for a file
   */
  getPublicUrl(filePath: string): string {
    const { data } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath);

    return data.publicUrl;
  }

  /**
   * Extract file path from full URL
   */
  extractPathFromUrl(url: string): string | null {
    const bucketUrl = `/storage/v1/object/public/${BUCKET_NAME}/`;
    const index = url.indexOf(bucketUrl);

    if (index === -1) return null;

    return url.substring(index + bucketUrl.length);
  }

  /**
   * Get file extension from filename
   */
  private getFileExtension(filename: string): string {
    const lastDot = filename.lastIndexOf('.');
    return lastDot !== -1 ? filename.substring(lastDot) : '';
  }

  /**
   * Determine media type from mimetype
   */
  getMediaTypeFromMimetype(mimetype: string): 'image' | 'video' | 'file' {
    if (mimetype.startsWith('image/')) return 'image';
    if (mimetype.startsWith('video/')) return 'video';
    return 'file';
  }
}

export const storageService = new StorageService();

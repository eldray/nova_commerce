import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export interface UploadResult {
  success: boolean;
  url?: string;
  publicId?: string;
  error?: string;
}

export interface UploadOptions {
  folder: string;
  allowedFormats?: string[];
  maxFileSize?: number; // in bytes
  transformation?: any;
}

/**
 * Upload a file buffer to Cloudinary
 */
export async function uploadFile(
  fileBuffer: Buffer,
  options: UploadOptions
): Promise<UploadResult> {
  try {
    const {
      folder,
      allowedFormats = ['jpg', 'jpeg', 'png', 'webp'],
      maxFileSize = 5 * 1024 * 1024, // 5MB default
      transformation,
    } = options;

    // Check file size
    if (fileBuffer.length > maxFileSize) {
      return {
        success: false,
        error: `File size exceeds maximum of ${maxFileSize / 1024 / 1024}MB`,
      };
    }

    // Convert buffer to base64 for Cloudinary upload
    const base64Data = fileBuffer.toString('base64');
    const base64String = `data:image/jpeg;base64,${base64Data}`;

    // Upload to Cloudinary
    const uploadResponse = await cloudinary.uploader.upload(base64String, {
      folder: `nova_commerce/${folder}`,
      allowed_formats: allowedFormats,
      transformation: transformation || {
        quality: 'auto:good',
        fetch_format: 'auto',
      },
      resource_type: 'image',
    });

    return {
      success: true,
      url: uploadResponse.secure_url,
      publicId: uploadResponse.public_id,
    };
  } catch (error: any) {
    console.error('Cloudinary upload error:', error);
    return {
      success: false,
      error: error.message || 'Failed to upload file',
    };
  }
}

/**
 * Upload multiple files
 */
export async function uploadMultipleFiles(
  files: Buffer[],
  options: UploadOptions
): Promise<UploadResult[]> {
  const results = await Promise.all(
    files.map((file) => uploadFile(file, options))
  );
  return results;
}

/**
 * Delete a file from Cloudinary
 */
export async function deleteFile(publicId: string): Promise<UploadResult> {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    
    if (result.result === 'ok') {
      return { success: true };
    } else {
      return {
        success: false,
        error: 'Failed to delete file',
      };
    }
  } catch (error: any) {
    console.error('Cloudinary delete error:', error);
    return {
      success: false,
      error: error.message || 'Failed to delete file',
    };
  }
}

/**
 * Generate optimized image URL with transformations
 */
export function getOptimizedImageUrl(
  publicId: string,
  options?: {
    width?: number;
    height?: number;
    quality?: 'low' | 'medium' | 'high' | 'auto';
    format?: 'jpg' | 'png' | 'webp' | 'auto';
  }
): string {
  const transformations: string[] = [];

  if (options?.width) transformations.push(`w_${options.width}`);
  if (options?.height) transformations.push(`h_${options.height}`);
  if (options?.quality) transformations.push(`q_${options.quality}`);
  if (options?.format) transformations.push(`f_${options.format}`);

  if (transformations.length === 0) {
    return cloudinary.url(publicId, {
      resource_type: 'image',
    });
  }

  return cloudinary.url(publicId, {
    resource_type: 'image',
    transformation: transformations.join(','),
  });
}

/**
 * Validate file type based on buffer magic numbers
 */
export function validateFileType(buffer: Buffer, allowedTypes: string[]): boolean {
  const fileSignature = buffer.slice(0, 4).toString('hex');
  
  const signatures: Record<string, string> = {
    jpg: 'ffd8ffe0',
    jpeg: 'ffd8ffe0',
    png: '89504e47',
    gif: '47494638',
    webp: '52494646',
  };

  return allowedTypes.some((type) => {
    const sig = signatures[type.toLowerCase()];
    return sig && fileSignature.startsWith(sig);
  });
}

import AWS from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';
import multer from 'multer';
import path from 'path';

// Configure AWS SDK
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'us-east-1',
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || 'nova-commerce-images';

// Multer configuration for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, and WEBP are allowed.'));
    }
  },
});

interface UploadResult {
  url: string;
  key: string;
  thumbnailUrl?: string;
}

/**
 * Upload a file to S3
 */
export async function uploadToS3(
  file: Express.Multer.File,
  tenantId: number,
  productId?: number
): Promise<UploadResult> {
  const fileExtension = path.extname(file.originalname);
  const fileName = `${tenantId}/${productId || 'temp'}/${uuidv4()}${fileExtension}`;
  
  const params: AWS.S3.PutObjectRequest = {
    Bucket: BUCKET_NAME,
    Key: fileName,
    Body: file.buffer,
    ContentType: file.mimetype,
    ACL: 'public-read',
  };

  try {
    const result = await s3.upload(params).promise();
    return {
      url: result.Location,
      key: fileName,
    };
  } catch (error) {
    console.error('S3 upload error:', error);
    throw new Error('Failed to upload image to cloud storage');
  }
}

/**
 * Delete a file from S3
 */
export async function deleteFromS3(key: string): Promise<void> {
  const params: AWS.S3.DeleteObjectRequest = {
    Bucket: BUCKET_NAME,
    Key: key,
  };

  try {
    await s3.deleteObject(params).promise();
  } catch (error) {
    console.error('S3 delete error:', error);
    throw new Error('Failed to delete image from cloud storage');
  }
}

/**
 * Generate presigned URL for private uploads
 */
export function getPresignedUploadUrl(key: string, contentType: string): string {
  const params: AWS.S3.GetSignedUrlRequest = {
    Bucket: BUCKET_NAME,
    Key: key,
    Expires: 60 * 5, // 5 minutes
    ContentType: contentType,
  };

  return s3.getSignedUrl('putObject', params);
}

export { upload };
export default upload;

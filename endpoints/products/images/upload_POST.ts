import { NextRequest } from 'next/server';
import { z } from 'zod';
import { getSessionUser } from '../../../helpers/getServerUserSession';
import { db } from '../../../lib/db';
import { uploadToS3 } from '../../../services/cloudStorage';
import { uploadImageSchema, ImageUploadResponse } from './upload_POST.schema';

export const config = {
  api: {
    bodyParser: false, // Disable default body parser for file uploads
  },
};

export async function POST(request: NextRequest): Promise<Response> {
  try {
    // Get authenticated user
    const user = await getSessionUser();
    
    if (!user) {
      return Response.json(
        { error: 'Unauthorized. Please log in.' },
        { status: 401 }
      );
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const productId = formData.get('productId') as string;
    const altText = formData.get('altText') as string | null;

    // Validate inputs
    const validation = uploadImageSchema.safeParse({ productId });
    if (!validation.success) {
      return Response.json(
        { error: 'Invalid product ID', details: validation.error.errors },
        { status: 400 }
      );
    }

    const parsedProductId = validation.data.productId;

    // Validate file
    if (!file) {
      return Response.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return Response.json(
        { error: 'Invalid file type. Only JPEG, PNG, and WEBP are allowed.' },
        { status: 400 }
      );
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return Response.json(
        { error: 'File size exceeds 10MB limit' },
        { status: 400 }
      );
    }

    // Verify product ownership
    const product = await db.product.findFirst({
      where: {
        id: parsedProductId,
        tenant_id: user.tenant_id,
        deleted_at: null,
      },
    });

    if (!product) {
      return Response.json(
        { error: 'Product not found or you do not have permission' },
        { status: 404 }
      );
    }

    // Convert File to Buffer for S3 upload
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Create mock Express.Multer.File for cloudStorage service
    const multerFile = {
      fieldname: 'file',
      originalname: file.name,
      encoding: '7bit',
      mimetype: file.type,
      buffer,
      size: file.size,
    } as Express.Multer.File;

    // Upload to S3
    const uploadResult = await uploadToS3(multerFile, user.tenant_id, parsedProductId);

    // Get image dimensions (simplified - in production use sharp library)
    let width: number | null = null;
    let height: number | null = null;
    
    // Simple dimension extraction could be added here with 'sharp' package
    // For now, we'll store null and update later if needed

    // Check if this is the first image (make it primary)
    const existingImagesCount = await db.product_images.count({
      where: {
        product_id: parsedProductId,
        deleted_at: null,
      },
    });

    const isPrimary = existingImagesCount === 0;

    // Save to database
    const newImage = await db.product_images.insert({
      product_id: parsedProductId,
      tenant_id: user.tenant_id,
      url: uploadResult.url,
      thumbnail_url: uploadResult.thumbnailUrl || null,
      alt_text: altText,
      sort_order: existingImagesCount,
      is_primary: isPrimary,
      file_key: uploadResult.key,
      file_size: file.size,
      mime_type: file.type,
      width,
      height,
    }).returning();

    // Update product primary image if this is the first image
    if (isPrimary) {
      await db.product.update({
        where: { id: parsedProductId },
        data: { primary_image_url: uploadResult.url },
      });
    }

    const response: ImageUploadResponse = {
      success: true,
      image: {
        id: newImage[0].id,
        url: newImage[0].url,
        thumbnailUrl: newImage[0].thumbnail_url,
        altText: newImage[0].alt_text,
        sortOrder: newImage[0].sort_order,
        isPrimary: newImage[0].is_primary,
        fileSize: newImage[0].file_size,
        mimeType: newImage[0].mime_type,
        width: newImage[0].width,
        height: newImage[0].height,
      },
      message: 'Image uploaded successfully',
    };

    return Response.json(response, { status: 201 });

  } catch (error) {
    console.error('Image upload error:', error);
    return Response.json(
      { error: 'Failed to upload image', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

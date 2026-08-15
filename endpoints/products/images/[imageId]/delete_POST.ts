import { NextRequest } from 'next/server';
import { getSessionUser } from '../../../../helpers/getServerUserSession';
import { db } from '../../../../lib/db';
import { deleteFromS3 } from '../../../../services/cloudStorage';

export async function POST(
  request: NextRequest,
  { params }: { params: { imageId: string } }
): Promise<Response> {
  try {
    // Get authenticated user
    const user = await getSessionUser();
    
    if (!user) {
      return Response.json(
        { error: 'Unauthorized. Please log in.' },
        { status: 401 }
      );
    }

    const imageId = parseInt(params.imageId);
    
    if (isNaN(imageId)) {
      return Response.json(
        { error: 'Invalid image ID' },
        { status: 400 }
      );
    }

    // Get image and verify ownership
    const image = await db.product_images.findFirst({
      where: {
        id: imageId,
        tenant_id: user.tenant_id,
      },
    });

    if (!image) {
      return Response.json(
        { error: 'Image not found or you do not have permission' },
        { status: 404 }
      );
    }

    // Delete from S3
    if (image.file_key) {
      await deleteFromS3(image.file_key);
    }

    // Soft delete from database
    await db.product_images.update({
      where: { id: imageId },
      data: { deleted_at: new Date() },
    });

    // If this was the primary image, update product to use another image
    if (image.is_primary) {
      const remainingImages = await db.product_images.findMany({
        where: {
          product_id: image.product_id,
          deleted_at: null,
        },
        orderBy: { sort_order: 'asc' },
        limit: 1,
      });

      const newPrimaryUrl = remainingImages.length > 0 ? remainingImages[0].url : null;

      await db.product.update({
        where: { id: image.product_id },
        data: { primary_image_url: newPrimaryUrl },
      });
    }

    return Response.json({
      success: true,
      message: 'Image deleted successfully',
    });

  } catch (error) {
    console.error('Image deletion error:', error);
    return Response.json(
      { error: 'Failed to delete image', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

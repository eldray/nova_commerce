import { NextRequest } from 'next/server';
import { getSessionUser } from '../../../helpers/getServerUserSession';
import { db } from '../../../lib/db';

export async function GET(request: NextRequest): Promise<Response> {
  try {
    const user = await getSessionUser();
    
    if (!user) {
      return Response.json(
        { error: 'Unauthorized. Please log in.' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');

    if (!productId) {
      return Response.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    const parsedProductId = parseInt(productId);
    
    if (isNaN(parsedProductId)) {
      return Response.json(
        { error: 'Invalid product ID' },
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

    // Get all images for this product
    const images = await db.product_images.findMany({
      where: {
        product_id: parsedProductId,
        tenant_id: user.tenant_id,
        deleted_at: null,
      },
      orderBy: [
        { sort_order: 'asc' },
        { created_at: 'asc' },
      ],
    });

    return Response.json({
      success: true,
      images: images.map(img => ({
        id: img.id,
        url: img.url,
        thumbnailUrl: img.thumbnail_url,
        altText: img.alt_text,
        sortOrder: img.sort_order,
        isPrimary: img.is_primary,
        fileSize: img.file_size,
        mimeType: img.mime_type,
        width: img.width,
        height: img.height,
        createdAt: img.created_at,
      })),
    });

  } catch (error) {
    console.error('Error listing product images:', error);
    return Response.json(
      { error: 'Failed to list product images', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

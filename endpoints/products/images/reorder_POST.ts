import { NextRequest } from 'next/server';
import { getSessionUser } from '../../../helpers/getServerUserSession';
import { db } from '../../../lib/db';

export async function POST(request: NextRequest): Promise<Response> {
  try {
    const user = await getSessionUser();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { productId, imageIds } = body;

    if (!productId || !Array.isArray(imageIds)) {
      return Response.json({ error: 'Product ID and image IDs array are required' }, { status: 400 });
    }

    // Verify product ownership
    const product = await db.product.findFirst({
      where: { id: productId, tenant_id: user.tenant_id, deleted_at: null },
    });

    if (!product) {
      return Response.json({ error: 'Product not found' }, { status: 404 });
    }

    // Update sort order for each image
    await db.transaction(async (tx) => {
      for (let i = 0; i < imageIds.length; i++) {
        await tx.product_images.update({
          where: { id: imageIds[i], tenant_id: user.tenant_id },
          data: { sort_order: i },
        });
      }
    });

    return Response.json({ success: true, message: 'Images reordered successfully' });

  } catch (error) {
    console.error('Error reordering images:', error);
    return Response.json({ error: 'Failed to reorder images' }, { status: 500 });
  }
}

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
    const { imageId, productId } = body;

    if (!imageId || !productId) {
      return Response.json({ error: 'Image ID and Product ID are required' }, { status: 400 });
    }

    // Verify product ownership
    const product = await db.product.findFirst({
      where: { id: productId, tenant_id: user.tenant_id, deleted_at: null },
    });

    if (!product) {
      return Response.json({ error: 'Product not found' }, { status: 404 });
    }

    // Verify image belongs to this product
    const image = await db.product_images.findFirst({
      where: { id: imageId, product_id: productId, tenant_id: user.tenant_id },
    });

    if (!image) {
      return Response.json({ error: 'Image not found' }, { status: 404 });
    }

    // Begin transaction to update primary image
    await db.transaction(async (tx) => {
      // Unset all primary images for this product
      await tx.product_images.updateMany({
        where: { product_id: productId, tenant_id: user.tenant_id, is_primary: true },
        data: { is_primary: false },
      });

      // Set the selected image as primary
      await tx.product_images.update({
        where: { id: imageId },
        data: { is_primary: true },
      });

      // Update product's primary_image_url
      await tx.product.update({
        where: { id: productId },
        data: { primary_image_url: image.url },
      });
    });

    return Response.json({ success: true, message: 'Primary image updated' });

  } catch (error) {
    console.error('Error setting primary image:', error);
    return Response.json({ error: 'Failed to set primary image' }, { status: 500 });
  }
}

// endpoints/products/images/set-primary_POST.ts
import { getSessionUser } from '../../../helpers/getServerUserSession';
import { db } from '../../../lib/db';

export async function handle(req: any, res: any) {
  try {
    const user = await getSessionUser(req);

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { imageId, productId } = req.body;

    if (!imageId || !productId) {
      return res.status(400).json({
        error: 'Image ID and Product ID are required'
      });
    }

    // Verify product ownership
    const product = await db.query(
      'SELECT * FROM products WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL',
      [productId, user.tenant_id]
    );

    if (!product || product.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Verify image belongs to this product
    const image = await db.query(
      'SELECT * FROM product_images WHERE id = $1 AND product_id = $2 AND tenant_id = $3',
      [imageId, productId, user.tenant_id]
    );

    if (!image || image.length === 0) {
      return res.status(404).json({ error: 'Image not found' });
    }

    // Begin transaction to update primary image
    try {
      // Unset all primary images for this product
      await db.query(
        'UPDATE product_images SET is_primary = false WHERE product_id = $1 AND tenant_id = $2 AND is_primary = true',
        [productId, user.tenant_id]
      );

      // Set the selected image as primary
      await db.query(
        'UPDATE product_images SET is_primary = true WHERE id = $1',
        [imageId]
      );

      // Update product's primary_image_url
      await db.query(
        'UPDATE products SET primary_image_url = $1 WHERE id = $2',
        [image[0].url, productId]
      );

      return res.json({
        success: true,
        message: 'Primary image updated'
      });

    } catch (error) {
      throw error;
    }

  } catch (error) {
    console.error('Error setting primary image:', error);
    return res.status(500).json({
      error: 'Failed to set primary image'
    });
  }
}
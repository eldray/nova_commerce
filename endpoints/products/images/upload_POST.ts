// endpoints/products/images/upload_POST.ts
import { getSessionUser } from '../../../helpers/getServerUserSession';
import { uploadFile, validateFileType } from '../../../helpers/cloudinary';
import { db } from '../../../lib/db';

export async function handle(req: any, res: any) {
  let user;

  try {
    user = await getSessionUser(req);
  } catch (error) {
    user = null;
  }

  try {
    // Assuming you're using multer or similar for file uploads
    // If using multipart/form-data, you need to parse it
    const file = req.file;
    const { productId } = req.body;

    if (!file) {
      return res.status(400).json({
        success: false,
        error: 'No file provided'
      });
    }

    if (!productId) {
      return res.status(400).json({
        success: false,
        error: 'Product ID is required'
      });
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!validTypes.includes(file.mimetype)) {
      return res.status(400).json({
        success: false,
        error: 'File must be JPEG, PNG, or WebP'
      });
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      return res.status(400).json({
        success: false,
        error: 'File size must be less than 5MB'
      });
    }

    // Validate file type using magic numbers
    const isValidType = validateFileType(file.buffer, ['jpg', 'jpeg', 'png', 'webp']);
    if (!isValidType) {
      return res.status(400).json({
        success: false,
        error: 'Invalid file format'
      });
    }

    // Create tenant-specific folder path
    const tenantFolder = user
      ? `products/tenant_${user.tenantId || 'default'}`
      : 'products';

    // Upload to Cloudinary
    const result = await uploadFile(file.buffer, {
      folder: tenantFolder,
      allowedFormats: ['jpg', 'jpeg', 'png', 'webp'],
      maxFileSize: 5 * 1024 * 1024,
    });

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error
      });
    }

    // Save image record to database
    const imageResult = await db.query(
      `INSERT INTO product_images (
        product_id, 
        url, 
        thumbnail_url, 
        tenant_id, 
        is_primary, 
        sort_order,
        file_size,
        mime_type
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [
        parseInt(productId),
        result.url,
        result.thumbnailUrl || null,
        user?.tenantId || null,
        false,
        0,
        file.size,
        file.mimetype
      ]
    );

    return res.status(200).json({
      success: true,
      image: imageResult[0],
      message: 'Image uploaded successfully'
    });

  } catch (error: any) {
    console.error('Upload error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Upload failed'
    });
  }
}
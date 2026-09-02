// endpoints/uploads/upload_POST.ts
import { getSessionUser } from '../../helpers/getServerUserSession';
import { uploadFile, validateFileType } from '../../helpers/cloudinary';

export async function handle(req: any, res: any) {
  let user;

  try {
    user = await getSessionUser(req);
  } catch (error) {
    user = null;
  }

  try {
    const file = req.file;
    const { folder = 'uploads' } = req.body;

    // Validate inputs
    if (!file) {
      return res.status(400).json({
        success: false,
        error: 'No file provided'
      });
    }

    const allowedFolders = ['products', 'logos', 'banners', 'reviews'];
    if (!allowedFolders.includes(folder)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid folder specified'
      });
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
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
      ? `${folder}/tenant_${user.tenantId || 'default'}`
      : folder;

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

    return res.status(200).json({
      success: true,
      url: result.url,
      publicId: result.publicId,
    });

  } catch (error: any) {
    console.error('Upload error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Upload failed'
    });
  }
}
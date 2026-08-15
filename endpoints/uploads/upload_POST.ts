import { validateRequest } from '../../helpers/getServerUserSession';
import { db } from '../../helpers/db';
import { uploadFile, validateFileType } from '../../helpers/cloudinary';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  let user;
  
  try {
    const session = await validateRequest();
    user = session?.user;
  } catch (error) {
    // Allow uploads without auth for public endpoints if needed
    user = null;
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const folder = formData.get('folder') as string;

    // Validate inputs
    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    if (!folder || !['products', 'logos', 'banners', 'reviews'].includes(folder)) {
      return NextResponse.json(
        { success: false, error: 'Invalid folder specified' },
        { status: 400 }
      );
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: 'File must be JPEG, PNG, or WebP' },
        { status: 400 }
      );
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: 'File size must be less than 5MB' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Validate file type using magic numbers
    const isValidType = validateFileType(buffer, ['jpg', 'jpeg', 'png', 'webp']);
    if (!isValidType) {
      return NextResponse.json(
        { success: false, error: 'Invalid file format' },
        { status: 400 }
      );
    }

    // Create tenant-specific folder path
    const tenantFolder = user 
      ? `${folder}/tenant_${user.tenant_id}` 
      : folder;

    // Upload to Cloudinary
    const result = await uploadFile(buffer, {
      folder: tenantFolder,
      allowedFormats: ['jpg', 'jpeg', 'png', 'webp'],
      maxFileSize: 5 * 1024 * 1024,
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      url: result.url,
      publicId: result.publicId,
    });

  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Upload failed' },
      { status: 500 }
    );
  }
}

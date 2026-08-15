import { z } from 'zod';

// Upload schema
export const uploadSchema = z.object({
  file: z.instanceof(File).refine(
    (file) => {
      const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
      return validTypes.includes(file.type);
    },
    { message: 'File must be JPEG, PNG, or WebP' }
  ).refine(
    (file) => file.size <= 5 * 1024 * 1024,
    { message: 'File size must be less than 5MB' }
  ),
  folder: z.enum(['products', 'logos', 'banners', 'reviews']),
});

export type UploadInput = z.infer<typeof uploadSchema>;

// Upload response schema
export const uploadResponseSchema = z.object({
  success: z.boolean(),
  url: z.string().url().optional(),
  publicId: z.string().optional(),
  error: z.string().optional(),
});

export type UploadResponse = z.infer<typeof uploadResponseSchema>;

// Delete schema
export const deleteSchema = z.object({
  publicId: z.string().min(1),
});

export type DeleteInput = z.infer<typeof deleteSchema>;

// Product images update schema
export const productImagesSchema = z.object({
  productId: z.number().int().positive(),
  imageUrls: z.array(z.string().url()).min(1).max(10),
  primaryImageUrl: z.string().url().optional(),
});

export type ProductImagesInput = z.infer<typeof productImagesSchema>;

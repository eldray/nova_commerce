import { z } from 'zod';

export const uploadImageSchema = z.object({
  productId: z.string().transform((val) => parseInt(val)),
});

export type UploadImageInput = z.infer<typeof uploadImageSchema>;

export interface ImageUploadResponse {
  success: boolean;
  image: {
    id: number;
    url: string;
    thumbnailUrl: string | null;
    altText: string | null;
    sortOrder: number;
    isPrimary: boolean;
    fileSize: number | null;
    mimeType: string | null;
    width: number | null;
    height: number | null;
  };
  message: string;
}

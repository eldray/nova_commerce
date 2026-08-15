import { useMutation, useQueryClient } from '@tanstack/react-query';

interface UploadImageVariables {
  productId: number;
  file: File;
  altText?: string;
}

interface UploadedImage {
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
}

export function useUploadProductImage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ productId, file, altText }: UploadImageVariables): Promise<UploadedImage> => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('productId', productId.toString());
      if (altText) {
        formData.append('altText', altText);
      }

      const response = await fetch('/api/products/images/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to upload image');
      }

      const data = await response.json();
      return data.image;
    },
    onSuccess: (_, variables) => {
      // Invalidate product images query
      queryClient.invalidateQueries({ queryKey: ['product-images', variables.productId] });
      // Invalidate product detail query
      queryClient.invalidateQueries({ queryKey: ['product', variables.productId] });
    },
  });
}

export function useDeleteProductImage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (imageId: number): Promise<void> => {
      const response = await fetch(`/api/products/images/${imageId}/delete`, {
        method: 'POST',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete image');
      }
    },
    onSuccess: () => {
      // Invalidate product images queries
      queryClient.invalidateQueries({ queryKey: ['product-images'] });
    },
  });
}

export function useSetPrimaryImage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ imageId, productId }: { imageId: number; productId: number }): Promise<void> => {
      const response = await fetch('/api/products/images/set-primary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageId, productId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to set primary image');
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['product-images', variables.productId] });
      queryClient.invalidateQueries({ queryKey: ['product', variables.productId] });
    },
  });
}

export function useReorderImages() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ productId, imageIds }: { productId: number; imageIds: number[] }): Promise<void> => {
      const response = await fetch('/api/products/images/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, imageIds }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to reorder images');
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['product-images', variables.productId] });
    },
  });
}

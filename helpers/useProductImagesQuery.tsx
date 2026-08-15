import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface ProductImage {
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
  createdAt?: string;
}

// Hook to fetch product images
export function useProductImages(productId: number) {
  return useQuery({
    queryKey: ['product-images', productId],
    queryFn: async (): Promise<ProductImage[]> => {
      const response = await fetch(`/api/products/images/list?productId=${productId}`);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to load images');
      }
      
      const data = await response.json();
      return data.images;
    },
    enabled: !!productId,
    staleTime: 60000, // 1 minute
  });
}

// Hook to upload a product image
export function useUploadProductImage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ productId, file, altText }: { productId: number; file: File; altText?: string }): Promise<ProductImage> => {
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
      queryClient.invalidateQueries({ queryKey: ['product-images', variables.productId] });
      queryClient.invalidateQueries({ queryKey: ['product', variables.productId] });
    },
  });
}

// Hook to delete a product image
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
      queryClient.invalidateQueries({ queryKey: ['product-images'] });
    },
  });
}

// Hook to set primary image
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

// Hook to reorder images
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

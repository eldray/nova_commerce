import { useMutation } from '@tanstack/react-query';
import { useState, useCallback, useRef } from 'react';

interface UploadResponse {
  success: boolean;
  url?: string;
  publicId?: string;
  error?: string;
}

interface UseFileUploadOptions {
  folder: 'products' | 'logos' | 'banners' | 'reviews';
  onSuccess?: (url: string) => void;
  onError?: (error: string) => void;
}

export function useFileUpload(options: UseFileUploadOptions) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const mutation = useMutation({
    mutationFn: async (file: File): Promise<UploadResponse> => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', options.folder);

      const response = await fetch('/api/uploads/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      return response.json();
    },
    onMutate: () => {
      setUploading(true);
      setProgress(0);
      setError(null);
    },
    onSuccess: (data) => {
      if (data.success && data.url) {
        setProgress(100);
        options.onSuccess?.(data.url);
      } else {
        setError(data.error || 'Upload failed');
        options.onError?.(data.error || 'Upload failed');
      }
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : 'Upload failed');
      options.onError?.(err instanceof Error ? err.message : 'Upload failed');
    },
    onSettled: () => {
      setUploading(false);
    },
  });

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        mutation.mutate(file);
      }
    },
    [mutation]
  );

  const triggerFileInput = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const reset = useCallback(() => {
    setError(null);
    setProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  return {
    upload: mutation.mutate,
    uploading,
    progress,
    error,
    fileInputRef,
    handleFileSelect,
    triggerFileInput,
    reset,
  };
}

// Hook for multiple file uploads
export function useMultipleFileUpload(options: UseFileUploadOptions) {
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState<UploadResponse[]>([]);
  const [error, setError] = useState<string | null>(null);

  const uploadMultiple = async (files: File[]) => {
    setUploading(true);
    setError(null);
    setResults([]);

    const uploadPromises = files.map(async (file) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', options.folder);

      try {
        const response = await fetch('/api/uploads/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error('Upload failed');
        }

        return await response.json();
      } catch (err) {
        return {
          success: false,
          error: err instanceof Error ? err.message : 'Upload failed',
        };
      }
    });

    const uploadResults = await Promise.all(uploadPromises);
    setResults(uploadResults);

    const successfulUrls = uploadResults
      .filter((r) => r.success && r.url)
      .map((r) => r.url!);

    if (successfulUrls.length > 0) {
      options.onSuccess?.(successfulUrls[0]);
    }

    const hasErrors = uploadResults.some((r) => !r.success);
    if (hasErrors) {
      const firstError = uploadResults.find((r) => !r.success)?.error;
      setError(firstError || 'Some uploads failed');
      options.onError?.(firstError || 'Some uploads failed');
    }

    setUploading(false);
    return uploadResults;
  };

  return {
    uploadMultiple,
    uploading,
    results,
    error,
  };
}

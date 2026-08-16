import React, { useRef, useState } from 'react';
import { useUploadProductImage } from '../helpers/useProductImages';
import styles from './ProductImageUploader.module.css';

interface ProductImageUploaderProps {
  productId: number;
  onUploadComplete?: () => void;
}

export default function ProductImageUploader({ productId, onUploadComplete }: ProductImageUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  const uploadMutation = useUploadProductImage();

  const handleFileSelect = (file: File) => {
    setError(null);
    
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setError('Invalid file type. Please upload JPEG, PNG, or WEBP images.');
      return;
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB.');
      return;
    }

    // Upload file
    uploadMutation.mutate(
      {
        productId,
        file,
        altText: `Product image ${new Date().toLocaleDateString()}`,
      },
      {
        onSuccess: () => {
          setUploadProgress(0);
          onUploadComplete?.();
        },
        onError: (err) => {
          setError(err instanceof Error ? err.message : 'Upload failed');
          setUploadProgress(0);
        },
      }
    );
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  return (
    <div className={styles.uploaderContainer}>
      <div
        className={`${styles.dropZone} ${isDragging ? styles.dragging : ''} ${uploadProgress > 0 ? styles.uploading : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleInputChange}
          className={styles.fileInput}
          disabled={uploadMutation.isPending}
        />
        
        {uploadProgress > 0 ? (
          <div className={styles.progressContainer}>
            <div className={styles.progressBar}>
              <div 
                className={styles.progressFill} 
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <span className={styles.progressText}>{uploadProgress}%</span>
          </div>
        ) : (
          <>
            <svg className={styles.uploadIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m0-3v12" />
            </svg>
            <p className={styles.dropText}>
              <strong>Click to upload</strong> or drag and drop
            </p>
            <p className={styles.subtext}>
              JPEG, PNG, or WEBP (max 10MB)
            </p>
          </>
        )}
      </div>

      {error && (
        <div className={styles.errorMessage}>
          <svg className={styles.errorIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </div>
      )}

      {uploadMutation.isPending && (
        <p className={styles.uploadingText}>Uploading image...</p>
      )}
    </div>
  );
}

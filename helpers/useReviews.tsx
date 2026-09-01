import { useState, useEffect } from 'react';
import { apiClient } from './apiClient';

export interface Review {
  id: string;
  productId: string;
  productName?: string;
  productImage?: string;
  customerId: string;
  customerName: string;
  rating: number;
  title: string;
  comment: string;
  status: 'pending' | 'approved' | 'rejected';
  helpfulCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface SubmitReviewData {
  productId: string;
  rating: number;
  title: string;
  comment: string;
}

export function useReviews() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitReview = async (data: SubmitReviewData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient('/api/reviews/submit', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return response;
    } catch (err: any) {
      setError(err.message || 'Failed to submit review');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getProductReviews = async (productId: string, status?: string) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (status) params.append('status', status);
      
      const response = await apiClient(`/api/reviews/list/${productId}?${params}`);
      return response.reviews || [];
    } catch (err: any) {
      setError(err.message || 'Failed to load reviews');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getPendingReviews = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient('/api/reviews/pending');
      return response.reviews || [];
    } catch (err: any) {
      setError(err.message || 'Failed to load pending reviews');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const moderateReview = async (reviewId: string, status: 'approved' | 'rejected') => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient('/api/reviews/moderate', {
        method: 'POST',
        body: JSON.stringify({ reviewId, status }),
      });
      return response;
    } catch (err: any) {
      setError(err.message || 'Failed to moderate review');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const markHelpful = async (reviewId: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient('/api/reviews/helpful', {
        method: 'POST',
        body: JSON.stringify({ reviewId }),
      });
      return response;
    } catch (err: any) {
      setError(err.message || 'Failed to mark review as helpful');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteReview = async (reviewId: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient(`/api/reviews/delete/${reviewId}`, {
        method: 'DELETE',
      });
      return response;
    } catch (err: any) {
      setError(err.message || 'Failed to delete review');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    submitReview,
    getProductReviews,
    getPendingReviews,
    moderateReview,
    markHelpful,
    deleteReview,
  };
}

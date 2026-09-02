import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../helpers/apiClient';

interface Coupon {
  id: number;
  code: string;
  name: string;
  description: string | null;
  type: 'percentage' | 'fixed_amount' | 'free_shipping';
  value: string;
  minPurchaseAmount: string | null;
  maxDiscountAmount: string | null;
  usageLimit: number | null;
  usageLimitPerUser: number | null;
  usedCount: number;
  status: 'active' | 'inactive' | 'expired';
  startsAt: Date;
  expiresAt: Date | null;
  firstOrderOnly: boolean;
  createdAt: Date;
}

interface CouponsResponse {
  coupons: Coupon[];
  total: number;
  page: number;
  totalPages: number;
}

interface CreateCouponInput {
  code: string;
  name: string;
  description?: string;
  type: 'percentage' | 'fixed_amount' | 'free_shipping';
  value: number;
  minPurchaseAmount?: number;
  maxDiscountAmount?: number;
  usageLimit?: number;
  usageLimitPerUser?: number;
  startsAt?: string;
  expiresAt?: string;
  applicableProductIds?: number[];
  applicableCategoryIds?: number[];
  firstOrderOnly?: boolean;
  status?: 'active' | 'inactive' | 'expired';
}

export function useCoupons(tenantId?: string) {
  const queryClient = useQueryClient();

  // Fetch coupons list
  const { data, isLoading, error } = useQuery<CouponsResponse>({
    queryKey: ['/api/coupons/list', tenantId],
    queryFn: async () => {
      return await apiClient('/api/coupons/list');
    },
    enabled: !!tenantId,
  });

  // Create coupon mutation
  const createMutation = useMutation({
    mutationFn: async (input: CreateCouponInput) => {
      return await apiClient('/api/coupons/create', {
        method: 'POST',
        body: JSON.stringify(input),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/coupons/list'] });
    },
  });

  // Update coupon mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, ...input }: CreateCouponInput & { id: number }) => {
      return await apiClient(`/api/coupons/update/${id}`, {
        method: 'PUT',
        body: JSON.stringify(input),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/coupons/list'] });
    },
  });

  // Get single coupon
  const getCoupon = async (id: number) => {
    try {
      return await apiClient(`/api/coupons/get/${id}`);
    } catch (err) {
      return null;
    }
  };

  // Delete coupon mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiClient(`/api/coupons/delete/${id}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/coupons/list'] });
    },
  });

  // Validate coupon mutation for checkout
  const validateMutation = useMutation({
    mutationFn: async ({ code, subtotal }: { code: string; subtotal: number }) => {
      return await apiClient<{ valid: boolean; message?: string; coupon?: { code: string; discountType: 'percentage' | 'fixed_amount' | 'free_shipping'; discountValue: number; description?: string } }>('/api/coupons/validate', {
        method: 'POST',
        body: JSON.stringify({
          code,
          cartTotal: subtotal,
        }),
      });
    },
  });

  return {
    coupons: data?.coupons || [],
    total: data?.total || 0,
    page: data?.page || 1,
    totalPages: data?.totalPages || 0,
    isLoading,
    error,
    createCoupon: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    updateCoupon: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    getCoupon,
    deleteCoupon: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
    validateMutation,
  };
}

export function useValidateCoupon() {
  const [isValidating, setIsValidating] = useState(false);
  const [result, setResult] = useState<{
    valid: boolean;
    discountAmount: string;
    message?: string;
    coupon?: any;
  } | null>(null);

  const validateCoupon = async (
    code: string,
    cartTotal: number,
    userId: number,
    productIds: number[] = [],
    isFirstOrder: boolean = false
  ) => {
    setIsValidating(true);
    try {
      const response = await apiClient('/api/coupons/validate', {
        method: 'POST',
        body: JSON.stringify({
          code,
          cartTotal,
          userId,
          productIds,
          isFirstOrder,
        }),
      });
      setResult(response);
      return response;
    } catch (error) {
      setResult({
        valid: false,
        discountAmount: '0',
        message: error instanceof Error ? error.message : 'Validation failed',
      });
      throw error;
    } finally {
      setIsValidating(false);
    }
  };

  const clearResult = () => setResult(null);

  return {
    isValidating,
    result,
    validateCoupon,
    clearResult,
  };
}

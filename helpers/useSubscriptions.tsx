import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { client } from '../../lib/client';

interface SubscriptionPlan {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  priceMonthly: number;
  priceYearly: number;
  currency: string;
  maxProducts: number;
  maxStaff: number;
  maxStorageGb: number;
  hasCustomDomain: boolean;
  hasAdvancedAnalytics: boolean;
  hasCouponSystem: boolean;
  hasPrioritySupport: boolean;
  isPopular: boolean;
}

interface MerchantSubscription {
  id: number;
  tenantId: number;
  planId: number;
  status: string;
  billingCycle: string;
  currentPeriodEnd: Date;
  plan: SubscriptionPlan;
}

interface SubscriptionData {
  success: boolean;
  plans: SubscriptionPlan[];
  currentSubscription: MerchantSubscription | null;
}

export function useSubscriptions() {
  const queryClient = useQueryClient();

  // Fetch available plans and current subscription
  const { data, isLoading, error } = useQuery<SubscriptionData>({
    queryKey: ['/api/subscriptions'],
  });

  // Subscribe to a plan mutation
  const subscribeMutation = useMutation({
    mutationFn: async ({ planId, billingCycle }: { planId: number; billingCycle: 'monthly' | 'yearly' }) => {
      return await client.POST('/api/subscriptions', { body: { planId, billingCycle } });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/subscriptions'] });
    },
  });

  // Cancel subscription mutation
  const cancelMutation = useMutation({
    mutationFn: async (reason?: string) => {
      return await client.DELETE('/api/subscriptions', { body: { reason } });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/subscriptions'] });
    },
  });

  return {
    plans: data?.plans || [],
    currentSubscription: data?.currentSubscription || null,
    isLoading,
    error,
    subscribe: subscribeMutation.mutateAsync,
    cancelSubscription: cancelMutation.mutateAsync,
    isSubscribing: subscribeMutation.isPending,
    isCancelling: cancelMutation.isPending,
  };
}

export function useHasFeature(featureKey: string) {
  const { currentSubscription, isLoading } = useSubscriptions();

  if (!currentSubscription) {
    return { hasFeature: false, isLoading };
  }

  const plan = currentSubscription.plan;
  
  const featureMap: Record<string, boolean> = {
    'custom.domain': plan.hasCustomDomain,
    'analytics.advanced': plan.hasAdvancedAnalytics,
    'coupons.enabled': plan.hasCouponSystem,
    'support.priority': plan.hasPrioritySupport,
  };

  return {
    hasFeature: featureMap[featureKey] || false,
    isLoading,
  };
}

export function useUsageLimit(resourceType: 'products' | 'staff' | 'storage') {
  const { currentSubscription, isLoading } = useSubscriptions();

  if (!currentSubscription) {
    return { allowed: false, limit: 0, current: 0, isLoading };
  }

  const plan = currentSubscription.plan;
  let limit = 0;

  switch (resourceType) {
    case 'products':
      limit = plan.maxProducts;
      break;
    case 'staff':
      limit = plan.maxStaff;
      break;
    case 'storage':
      limit = plan.maxStorageGb * 1024; // Convert to MB
      break;
  }

  return {
    allowed: limit === -1, // -1 means unlimited
    limit,
    current: 0, // Would need to be passed in or fetched separately
    isLoading,
    isUnlimited: limit === -1,
  };
}

import { db } from "../helpers/db";
import { eq, and, desc, gte, lte } from "drizzle-orm";
import { 
  subscriptionPlans, 
  merchantSubscriptions, 
  subscriptionInvoices,
  subscriptionUsage,
  planFeatures 
} from "../helpers/schema";

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

/**
 * Get all available subscription plans
 */
export async function getAvailablePlans(): Promise<SubscriptionPlan[]> {
  const plans = await db
    .select()
    .from(subscriptionPlans)
    .where(eq(subscriptionPlans.isActive, true))
    .orderBy(subscriptionPlans.sortOrder);

  return plans.map(plan => ({
    id: plan.id,
    name: plan.name,
    slug: plan.slug,
    description: plan.description,
    priceMonthly: Number(plan.priceMonthly),
    priceYearly: Number(plan.priceYearly),
    currency: plan.currency,
    maxProducts: plan.maxProducts,
    maxStaff: plan.maxStaff,
    maxStorageGb: plan.maxStorageGb,
    hasCustomDomain: plan.hasCustomDomain,
    hasAdvancedAnalytics: plan.hasAdvancedAnalytics,
    hasCouponSystem: plan.hasCouponSystem,
    hasPrioritySupport: plan.hasPrioritySupport,
    isPopular: plan.isPopular,
  }));
}

/**
 * Get current subscription for a tenant
 */
export async function getCurrentSubscription(tenantId: number): Promise<MerchantSubscription | null> {
  const result = await db
    .select()
    .from(merchantSubscriptions)
    .where(and(
      eq(merchantSubscriptions.tenantId, tenantId),
      eq(merchantSubscriptions.status, 'active')
    ))
    .limit(1);

  if (result.length === 0) {
    return null;
  }

  const subscription = result[0];
  
  // Get plan details
  const plan = await db
    .select()
    .from(subscriptionPlans)
    .where(eq(subscriptionPlans.id, subscription.planId))
    .limit(1);

  if (plan.length === 0) {
    return null;
  }

  return {
    id: subscription.id,
    tenantId: subscription.tenantId,
    planId: subscription.planId,
    status: subscription.status,
    billingCycle: subscription.billingCycle,
    currentPeriodEnd: subscription.currentPeriodEnd,
    plan: {
      id: plan[0].id,
      name: plan[0].name,
      slug: plan[0].slug,
      description: plan[0].description,
      priceMonthly: Number(plan[0].priceMonthly),
      priceYearly: Number(plan[0].priceYearly),
      currency: plan[0].currency,
      maxProducts: plan[0].maxProducts,
      maxStaff: plan[0].maxStaff,
      maxStorageGb: plan[0].maxStorageGb,
      hasCustomDomain: plan[0].hasCustomDomain,
      hasAdvancedAnalytics: plan[0].hasAdvancedAnalytics,
      hasCouponSystem: plan[0].hasCouponSystem,
      hasPrioritySupport: plan[0].hasPrioritySupport,
      isPopular: plan[0].isPopular,
    },
  };
}

/**
 * Subscribe a tenant to a plan
 */
export async function subscribeTenant(
  tenantId: number,
  planId: number,
  billingCycle: 'monthly' | 'yearly' = 'monthly',
  trialDays: number = 14
): Promise<MerchantSubscription> {
  const plan = await db
    .select()
    .from(subscriptionPlans)
    .where(and(
      eq(subscriptionPlans.id, planId),
      eq(subscriptionPlans.isActive, true)
    ))
    .limit(1);

  if (plan.length === 0) {
    throw new Error('Plan not found or inactive');
  }

  const selectedPlan = plan[0];
  const now = new Date();
  const trialEndsAt = new Date(now.getTime() + trialDays * 24 * 60 * 60 * 1000);
  const currentPeriodEnd = new Date(now.getTime() + (billingCycle === 'monthly' ? 30 : 365) * 24 * 60 * 60 * 1000);

  // Cancel any existing active subscription
  await db
    .update(merchantSubscriptions)
    .set({ 
      status: 'cancelled',
      cancelledAt: now,
      cancelReason: 'Upgraded to new plan'
    })
    .where(and(
      eq(merchantSubscriptions.tenantId, tenantId),
      eq(merchantSubscriptions.status, 'active')
    ));

  // Create new subscription
  const [newSubscription] = await db
    .insert(merchantSubscriptions)
    .values({
      tenantId,
      planId,
      status: 'trialing',
      billingCycle,
      startedAt: now,
      currentPeriodStart: now,
      currentPeriodEnd,
      trialEndsAt,
      amount: billingCycle === 'monthly' ? selectedPlan.priceMonthly : selectedPlan.priceYearly,
      currency: selectedPlan.currency,
    })
    .returning();

  // Get plan details
  const planDetails = {
    id: selectedPlan.id,
    name: selectedPlan.name,
    slug: selectedPlan.slug,
    description: selectedPlan.description,
    priceMonthly: Number(selectedPlan.priceMonthly),
    priceYearly: Number(selectedPlan.priceYearly),
    currency: selectedPlan.currency,
    maxProducts: selectedPlan.maxProducts,
    maxStaff: selectedPlan.maxStaff,
    maxStorageGb: selectedPlan.maxStorageGb,
    hasCustomDomain: selectedPlan.hasCustomDomain,
    hasAdvancedAnalytics: selectedPlan.hasAdvancedAnalytics,
    hasCouponSystem: selectedPlan.hasCouponSystem,
    hasPrioritySupport: selectedPlan.hasPrioritySupport,
    isPopular: selectedPlan.isPopular,
  };

  return {
    id: newSubscription.id,
    tenantId: newSubscription.tenantId,
    planId: newSubscription.planId,
    status: newSubscription.status,
    billingCycle: newSubscription.billingCycle,
    currentPeriodEnd: newSubscription.currentPeriodEnd,
    plan: planDetails,
  };
}

/**
 * Cancel a subscription
 */
export async function cancelSubscription(
  tenantId: number,
  reason?: string
): Promise<void> {
  const subscription = await db
    .select()
    .from(merchantSubscriptions)
    .where(and(
      eq(merchantSubscriptions.tenantId, tenantId),
      eq(merchantSubscriptions.status, 'active')
    ))
    .limit(1);

  if (subscription.length === 0) {
    throw new Error('No active subscription found');
  }

  await db
    .update(merchantSubscriptions)
    .set({
      status: 'cancelled',
      cancelledAt: new Date(),
      cancelReason: reason || 'Cancelled by user',
    })
    .where(eq(merchantSubscriptions.id, subscription[0].id));
}

/**
 * Check if tenant has feature enabled based on their plan
 */
export async function hasFeature(
  tenantId: number,
  featureKey: string
): Promise<boolean> {
  const subscription = await getCurrentSubscription(tenantId);
  
  if (!subscription) {
    return false;
  }

  // Check plan-level features
  const plan = subscription.plan;
  
  const featureMap: Record<string, boolean> = {
    'custom.domain': plan.hasCustomDomain,
    'analytics.advanced': plan.hasAdvancedAnalytics,
    'coupons.enabled': plan.hasCouponSystem,
    'support.priority': plan.hasPrioritySupport,
  };

  if (featureKey in featureMap) {
    return featureMap[featureKey];
  }

  // Check granular features from plan_features table
  const features = await db
    .select()
    .from(planFeatures)
    .where(eq(planFeatures.planId, plan.id));

  const feature = features.find(f => f.featureKey === featureKey);
  
  if (feature) {
    return feature.featureValue === 'true';
  }

  return false;
}

/**
 * Check usage limits for a tenant
 */
export async function checkUsageLimit(
  tenantId: number,
  resourceType: 'products' | 'staff' | 'storage',
  currentValue: number
): Promise<{ allowed: boolean; limit: number; current: number }> {
  const subscription = await getCurrentSubscription(tenantId);
  
  if (!subscription) {
    return { allowed: false, limit: 0, current: currentValue };
  }

  const plan = subscription.plan;
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

  // -1 means unlimited
  if (limit === -1) {
    return { allowed: true, limit: -1, current: currentValue };
  }

  return {
    allowed: currentValue < limit,
    limit,
    current: currentValue,
  };
}

/**
 * Get subscription invoices for a tenant
 */
export async function getTenantInvoices(tenantId: number, limit: number = 10) {
  return await db
    .select()
    .from(subscriptionInvoices)
    .where(eq(subscriptionInvoices.tenantId, tenantId))
    .orderBy(desc(subscriptionInvoices.createdAt))
    .limit(limit);
}

/**
 * Create invoice for subscription payment
 */
export async function createInvoice(
  tenantId: number,
  subscriptionId: number,
  planId: number,
  amount: number,
  periodStart: Date,
  periodEnd: Date,
  currency: string = 'GHS'
) {
  const invoiceNumber = `INV-${Date.now()}-${tenantId}`;
  
  const [invoice] = await db
    .insert(subscriptionInvoices)
    .values({
      tenantId,
      subscriptionId,
      planId,
      invoiceNumber,
      amount,
      taxAmount: 0,
      totalAmount: amount,
      currency,
      periodStart,
      periodEnd,
      status: 'pending',
    })
    .returning();

  return invoice;
}

/**
 * Update subscription status after payment
 */
export async function activateSubscription(
  subscriptionId: number,
  paymentIntentId?: string
): Promise<void> {
  const subscription = await db
    .select()
    .from(merchantSubscriptions)
    .where(eq(merchantSubscriptions.id, subscriptionId))
    .limit(1);

  if (subscription.length === 0) {
    throw new Error('Subscription not found');
  }

  const sub = subscription[0];
  const isTrial = sub.status === 'trialing';
  
  await db
    .update(merchantSubscriptions)
    .set({
      status: 'active',
      trialEndsAt: null,
    })
    .where(eq(merchantSubscriptions.id, subscriptionId));

  // Update invoice if payment intent provided
  if (paymentIntentId) {
    await db
      .update(subscriptionInvoices)
      .set({
        status: 'paid',
        paidAt: new Date(),
        stripePaymentIntentId: paymentIntentId,
      })
      .where(eq(subscriptionInvoices.subscriptionId, subscriptionId));
  }
}

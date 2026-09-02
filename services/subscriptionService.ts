import { db } from "../helpers/db";

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
    .selectFrom("subscriptionPlans")
    .selectAll()
    .where("isActive", "=", true)
    .orderBy("sortOrder", "asc")
    .execute();

  return plans.map((plan) => ({
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
  const subscription = await db
    .selectFrom("merchantSubscriptions")
    .selectAll()
    .where("tenantId", "=", tenantId)
    .where("status", "=", "active")
    .executeTakeFirst();

  if (!subscription) {
    return null;
  }

  const plan = await db
    .selectFrom("subscriptionPlans")
    .selectAll()
    .where("id", "=", subscription.planId)
    .executeTakeFirst();

  if (!plan) {
    return null;
  }

  return {
    id: subscription.id,
    tenantId: subscription.tenantId,
    planId: subscription.planId,
    status: subscription.status,
    billingCycle: subscription.billingCycle,
    currentPeriodEnd: new Date(subscription.currentPeriodEnd),
    plan: {
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
    },
  };
}

/**
 * Subscribe a tenant to a plan
 */
export async function subscribeTenant(
  tenantId: number,
  planId: number,
  billingCycle: "monthly" | "yearly" = "monthly",
  trialDays: number = 14
): Promise<MerchantSubscription> {
  const selectedPlan = await db
    .selectFrom("subscriptionPlans")
    .selectAll()
    .where("id", "=", planId)
    .where("isActive", "=", true)
    .executeTakeFirst();

  if (!selectedPlan) {
    throw new Error("Plan not found or inactive");
  }

  const now = new Date();
  const trialEndsAt = new Date(now.getTime() + trialDays * 24 * 60 * 60 * 1000);
  const currentPeriodEnd = new Date(now.getTime() + (billingCycle === "monthly" ? 30 : 365) * 24 * 60 * 60 * 1000);

  // Cancel any existing active subscription
  await db
    .updateTable("merchantSubscriptions")
    .set({
      status: "cancelled",
      cancelledAt: now,
      cancelReason: "Upgraded to new plan",
    })
    .where("tenantId", "=", tenantId)
    .where("status", "=", "active")
    .execute();

  // Create new subscription
  const newSubscription = await db
    .insertInto("merchantSubscriptions")
    .values({
      tenantId,
      planId,
      status: "trialing",
      billingCycle,
      startedAt: now,
      currentPeriodStart: now,
      currentPeriodEnd,
      trialEndsAt,
      amount: (billingCycle === "monthly" ? selectedPlan.priceMonthly : selectedPlan.priceYearly) as any,
      currency: selectedPlan.currency,
    })
    .returningAll()
    .executeTakeFirstOrThrow();

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
    currentPeriodEnd: new Date(newSubscription.currentPeriodEnd),
    plan: planDetails,
  };
}

/**
 * Cancel a subscription
 */
export async function cancelSubscription(tenantId: number, reason?: string): Promise<void> {
  const subscription = await db
    .selectFrom("merchantSubscriptions")
    .select("id")
    .where("tenantId", "=", tenantId)
    .where("status", "=", "active")
    .executeTakeFirst();

  if (!subscription) {
    throw new Error("No active subscription found");
  }

  await db
    .updateTable("merchantSubscriptions")
    .set({
      status: "cancelled",
      cancelledAt: new Date(),
      cancelReason: reason || "Cancelled by user",
    })
    .where("id", "=", subscription.id)
    .execute();
}

/**
 * Check if tenant has feature enabled based on their plan
 */
export async function hasFeature(tenantId: number, featureKey: string): Promise<boolean> {
  const subscription = await getCurrentSubscription(tenantId);

  if (!subscription) {
    return false;
  }

  const plan = subscription.plan;

  const featureMap: Record<string, boolean> = {
    "custom.domain": plan.hasCustomDomain,
    "analytics.advanced": plan.hasAdvancedAnalytics,
    "coupons.enabled": plan.hasCouponSystem,
    "support.priority": plan.hasPrioritySupport,
  };

  if (featureKey in featureMap) {
    return featureMap[featureKey];
  }

  const feature = await db
    .selectFrom("planFeatures")
    .selectAll()
    .where("planId", "=", plan.id)
    .where("featureKey", "=", featureKey)
    .executeTakeFirst();

  if (feature) {
    return feature.featureValue === "true";
  }

  return false;
}

/**
 * Check usage limits for a tenant
 */
export async function checkUsageLimit(
  tenantId: number,
  resourceType: "products" | "staff" | "storage",
  currentValue: number
): Promise<{ allowed: boolean; limit: number; current: number }> {
  const subscription = await getCurrentSubscription(tenantId);

  if (!subscription) {
    return { allowed: false, limit: 0, current: currentValue };
  }

  const plan = subscription.plan;
  let limit = 0;

  switch (resourceType) {
    case "products":
      limit = plan.maxProducts;
      break;
    case "staff":
      limit = plan.maxStaff;
      break;
    case "storage":
      limit = plan.maxStorageGb * 1024;
      break;
  }

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
    .selectFrom("subscriptionInvoices")
    .selectAll()
    .where("tenantId", "=", tenantId)
    .orderBy("createdAt", "desc")
    .limit(limit)
    .execute();
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
  currency: string = "GHS"
) {
  const invoiceNumber = `INV-${Date.now()}-${tenantId}`;

  return await db
    .insertInto("subscriptionInvoices")
    .values({
      tenantId,
      subscriptionId,
      planId,
      invoiceNumber,
      amount: amount as any,
      taxAmount: 0 as any,
      totalAmount: amount as any,
      currency,
      periodStart,
      periodEnd,
      status: "pending",
    })
    .returningAll()
    .executeTakeFirstOrThrow();
}

/**
 * Update subscription status after payment
 */
export async function activateSubscription(subscriptionId: number, paymentIntentId?: string): Promise<void> {
  const sub = await db
    .selectFrom("merchantSubscriptions")
    .select(["id", "status"])
    .where("id", "=", subscriptionId)
    .executeTakeFirst();

  if (!sub) {
    throw new Error("Subscription not found");
  }

  await db
    .updateTable("merchantSubscriptions")
    .set({
      status: "active",
      trialEndsAt: null,
    })
    .where("id", "=", subscriptionId)
    .execute();

  if (paymentIntentId) {
    await db
      .updateTable("subscriptionInvoices")
      .set({
        status: "paid",
        paidAt: new Date(),
        stripePaymentIntentId: paymentIntentId,
      })
      .where("subscriptionId", "=", subscriptionId)
      .execute();
  }
}

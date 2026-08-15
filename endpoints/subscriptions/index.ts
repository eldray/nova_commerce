import { z } from "zod";
import { createEndpoint } from "@kitql/helper";
import superjson from "superjson";
import { getServerUserSession } from "../../helpers/getServerUserSession";
import { db } from "../../helpers/db";
import { eq, and, desc } from "drizzle-orm";
import { 
  subscriptionPlans, 
  merchantSubscriptions,
  subscriptionInvoices,
  tenants,
  stores
} from "../../helpers/schema";
import {
  getAvailablePlans,
  getCurrentSubscription,
  subscribeTenant,
  cancelSubscription,
  hasFeature,
  checkUsageLimit,
} from "../../services/subscriptionService";

// Get available plans
export const GET = createEndpoint({
  input: z.object({}).optional(),
  handler: async (_, event) => {
    const { user, tenantId } = await getServerUserSession(event);

    if (!user) {
      throw new Error("Unauthorized", { cause: { status: 401 } });
    }

    // Get all active plans
    const plans = await getAvailablePlans();

    // Get current subscription if tenant exists
    let currentSubscription = null;
    if (tenantId) {
      currentSubscription = await getCurrentSubscription(tenantId);
    }

    return superjson.stringify({
      success: true,
      plans,
      currentSubscription,
    });
  },
});

// Subscribe to a plan
export const POST = createEndpoint({
  input: z.object({
    planId: z.number().int().positive(),
    billingCycle: z.enum(['monthly', 'yearly']).default('monthly'),
  }),
  handler: async ({ planId, billingCycle }, event) => {
    const { user, tenantId } = await getServerUserSession(event);

    if (!user || !tenantId) {
      throw new Error("Unauthorized or no tenant selected", { cause: { status: 401 } });
    }

    try {
      const subscription = await subscribeTenant(tenantId, planId, billingCycle);

      return superjson.stringify({
        success: true,
        subscription,
        message: `Successfully subscribed to ${subscription.plan.name} plan with 14-day free trial`,
      });
    } catch (error) {
      console.error('Subscription error:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to subscribe', { 
        cause: { status: 400 } 
      });
    }
  },
});

// Cancel current subscription
export const DELETE = createEndpoint({
  input: z.object({
    reason: z.string().optional(),
  }),
  handler: async ({ reason }, event) => {
    const { user, tenantId } = await getServerUserSession(event);

    if (!user || !tenantId) {
      throw new Error("Unauthorized or no tenant selected", { cause: { status: 401 } });
    }

    try {
      await cancelSubscription(tenantId, reason);

      return superjson.stringify({
        success: true,
        message: 'Subscription cancelled successfully. You will retain access until the end of your billing period.',
      });
    } catch (error) {
      console.error('Cancellation error:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to cancel subscription', { 
        cause: { status: 400 } 
      });
    }
  },
});

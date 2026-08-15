import { z } from "zod";
import { createEndpoint } from "@kitql/helper";
import superjson from "superjson";
import { getServerUserSession } from "../../helpers/getServerUserSession";
import { db } from "../../helpers/db";
import { eq, sql } from "drizzle-orm";
import { tenants, stores, users } from "../../helpers/schema";

// Suspend a tenant's store (super admin only)
export const POST = createEndpoint({
  input: z.object({
    tenantId: z.number().int().positive(),
    reason: z.string().optional(),
  }),
  handler: async ({ tenantId, reason }, event) => {
    const { user } = await getServerUserSession(event);

    if (!user || user.role !== 'super_admin') {
      throw new Error("Unauthorized - Super Admin access required", { cause: { status: 403 } });
    }

    try {
      // Update store status to suspended
      await db
        .update(stores)
        .set({
          status: 'suspended',
          updatedAt: new Date(),
        })
        .where(eq(stores.tenantId, tenantId));

      // Log the suspension reason
      if (reason) {
        console.log(`Tenant ${tenantId} suspended by ${user.email}. Reason: ${reason}`);
      }

      return superjson.stringify({
        success: true,
        message: 'Store suspended successfully',
      });
    } catch (error) {
      console.error('Error suspending tenant:', error);
      throw new Error('Failed to suspend store', {
        cause: { status: 500 }
      });
    }
  },
});

// Reactivate a suspended tenant's store
export const PUT = createEndpoint({
  input: z.object({
    tenantId: z.number().int().positive(),
  }),
  handler: async ({ tenantId }, event) => {
    const { user } = await getServerUserSession(event);

    if (!user || user.role !== 'super_admin') {
      throw new Error("Unauthorized - Super Admin access required", { cause: { status: 403 } });
    }

    try {
      // Update store status back to published
      await db
        .update(stores)
        .set({
          status: 'published',
          updatedAt: new Date(),
        })
        .where(eq(stores.tenantId, tenantId));

      return superjson.stringify({
        success: true,
        message: 'Store reactivated successfully',
      });
    } catch (error) {
      console.error('Error reactivating tenant:', error);
      throw new Error('Failed to reactivate store', {
        cause: { status: 500 }
      });
    }
  },
});

// Delete a tenant and all associated data (permanent action)
export const DELETE = createEndpoint({
  input: z.object({
    tenantId: z.number().int().positive(),
    confirm: z.boolean().default(false),
  }),
  handler: async ({ tenantId, confirm }, event) => {
    const { user } = await getServerUserSession(event);

    if (!user || user.role !== 'super_admin') {
      throw new Error("Unauthorized - Super Admin access required", { cause: { status: 403 } });
    }

    if (!confirm) {
      throw new Error('Confirmation required to delete tenant', {
        cause: { status: 400 }
      });
    }

    try {
      // Delete tenant (cascade will handle related records)
      await db
        .delete(tenants)
        .where(eq(tenants.id, tenantId));

      return superjson.stringify({
        success: true,
        message: 'Tenant and all associated data deleted permanently',
      });
    } catch (error) {
      console.error('Error deleting tenant:', error);
      throw new Error('Failed to delete tenant', {
        cause: { status: 500 }
      });
    }
  },
});

import { z } from "zod";
import { createEndpoint } from "@kitql/helper";
import superjson from "superjson";
import { getServerUserSession } from "../../helpers/getServerUserSession";
import { db } from "../../helpers/db";
import { eq, and } from "drizzle-orm";
import { tenants, stores, tenantUsers } from "../../helpers/schema";
import { roleHasPermission } from "../../helpers/permissions";

export const POST = createEndpoint({
  input: z.object({
    publish: z.boolean().default(true),
  }),
  handler: async ({ publish }, event) => {
    const { user, session, tenantId, tenantRole } = await getServerUserSession(event);

    if (!user || !session) {
      throw new Error("Unauthorized", { cause: { status: 401 } });
    }

    if (!tenantId) {
      throw new Error("No tenant selected", { cause: { status: 400 } });
    }

    if (!tenantRole) {
      throw new Error("User not associated with tenant", { cause: { status: 403 } });
    }

    if (!roleHasPermission(tenantRole, "store.publish")) {
      throw new Error("Insufficient permissions to publish store", { cause: { status: 403 } });
    }

    const tenantUser = await db.query.tenantUsers.findFirst({
      where: and(
        eq(tenantUsers.tenantId, tenantId),
        eq(tenantUsers.userId, user.id)
      ),
    });

    if (!tenantUser) {
      throw new Error("User not found in tenant", { cause: { status: 403 } });
    }

    const updatedStore = await db.transaction(async (tx) => {
      const [store] = await tx.select().from(stores).where(eq(stores.tenantId, tenantId)).limit(1);

      if (!store) {
        throw new Error("Store not found for tenant", { cause: { status: 404 } });
      }

      const [updated] = await tx
        .update(stores)
        .set({
          isPublished: publish,
          updatedAt: new Date(),
        })
        .where(eq(stores.tenantId, tenantId))
        .returning();

      return updated;
    });

    return superjson.stringify({
      success: true,
      store: {
        id: updatedStore.id,
        isPublished: updatedStore.isPublished,
        storeName: updatedStore.storeName,
        subdomain: updatedStore.subdomain,
      },
    });
  },
});

import { z } from 'zod';
import { createEndpoint } from '../../helpers/createEndpoint';
import { db } from '../../helpers/db';

const requestSchema = z.object({
  storeId: z.number().int().positive(),
  reason: z.string().max(500).optional(),
});

export const POST = createEndpoint(
  {
    method: 'POST',
    bodySchema: requestSchema,
    requiredPermissions: ['stores.manage'],
  },
  async (req, { user, body }) => {
    const { storeId, reason } = body;

    // Verify store exists and belongs to user's tenant
    const store = await db
      .selectFrom('stores')
      .selectAll()
      .where('id', '=', storeId)
      .where('tenant_id', '=', user.tenantId)
      .executeTakeFirst();

    if (!store) {
      throw new Error('Store not found');
    }

    // Update store to unpublished state
    const updatedStore = await db
      .updateTable('stores')
      .set({
        published: false,
        unpublish_reason: reason || null,
      })
      .where('id', '=', storeId)
      .returningAll()
      .executeTakeFirst();

    return {
      success: true,
      store: updatedStore,
      message: 'Store unpublished successfully',
    };
  }
);

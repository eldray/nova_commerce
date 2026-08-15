import { z } from 'zod';
import { createEndpoint } from '../../helpers/createEndpoint';
import { db } from '../../helpers/db';

const requestSchema = z.object({
  storeId: z.number().int().positive(),
});

export const POST = createEndpoint(
  {
    method: 'POST',
    bodySchema: requestSchema,
    requiredPermissions: ['stores.manage'],
  },
  async (req, { user, body }) => {
    const { storeId } = body;

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

    // Check prerequisites for publishing
    const [productCount, categoryCount] = await Promise.all([
      db
        .selectFrom('products')
        .select((eb) => eb.fn.count<number>('id').as('count'))
        .where('store_id', '=', storeId)
        .where('deleted_at', 'is', null)
        .executeTakeFirst(),
      db
        .selectFrom('categories')
        .select((eb) => eb.fn.count<number>('id').as('count'))
        .where('store_id', '=', storeId)
        .where('deleted_at', 'is', null)
        .executeTakeFirst(),
    ]);

    const hasProducts = Number(productCount?.count ?? 0) > 0;
    const hasCategories = Number(categoryCount?.count ?? 0) > 0;

    if (!hasProducts || !hasCategories) {
      throw new Error(
        'Store must have at least one product and one category to publish'
      );
    }

    // Update store to published state
    const updatedStore = await db
      .updateTable('stores')
      .set({
        published: true,
        publish_date: new Date(),
        unpublish_reason: null,
      })
      .where('id', '=', storeId)
      .returningAll()
      .executeTakeFirst();

    return {
      success: true,
      store: updatedStore,
      message: 'Store published successfully',
    };
  }
);

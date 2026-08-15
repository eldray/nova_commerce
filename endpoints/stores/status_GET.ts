import { z } from 'zod';
import { createEndpoint } from '../../helpers/createEndpoint';
import { db } from '../../helpers/db';

const querySchema = z.object({
  storeId: z.string().optional(),
});

export const GET = createEndpoint(
  {
    method: 'GET',
    querySchema,
    requiredPermissions: ['stores.view'],
  },
  async (req, { user, query }) => {
    const storeId = query.storeId ? parseInt(query.storeId) : undefined;

    let queryBuilder = db
      .selectFrom('stores')
      .select([
        'id',
        'name',
        'slug',
        'published',
        'publish_date',
        'unpublish_reason',
        'created_at',
        'updated_at',
      ])
      .where('tenant_id', '=', user.tenantId);

    if (storeId) {
      queryBuilder = queryBuilder.where('id', '=', storeId);
    }

    const stores = await queryBuilder.execute();

    if (storeId && stores.length === 0) {
      throw new Error('Store not found');
    }

    return storeId ? stores[0] : stores;
  }
);

import { z } from "zod";
import { createEndpoint } from "@kitql/helper";
import superjson from "superjson";
import { getServerUserSession } from "../../helpers/getServerUserSession";
import { db } from "../../helpers/db";
import { eq, and, desc, sql, inArray } from "drizzle-orm";
import { pageSections, sectionItems, stores } from "../../helpers/schema";

// Get all sections for current store
export const GET = createEndpoint({
  input: z.object({}).optional(),
  handler: async (_, event) => {
    const { user, tenantId } = await getServerUserSession(event);

    if (!user || !tenantId) {
      throw new Error("Unauthorized or no tenant selected", { cause: { status: 401 } });
    }

    try {
      // Get store
      const store = await db
        .select()
        .from(stores)
        .where(and(eq(stores.tenantId, tenantId)))
        .limit(1);

      if (!store[0]) {
        throw new Error('Store not found', { cause: { status: 404 } });
      }

      // Get all sections with their items
      const sections = await db
        .select()
        .from(pageSections)
        .where(eq(pageSections.storeId, store[0].id))
        .orderBy(pageSections.sortOrder);

      // Get items for each section
      const sectionIds = sections.map(s => s.id);
      let items = [];
      if (sectionIds.length > 0) {
        items = await db
          .select()
          .from(sectionItems)
          .where(inArray(sectionItems.sectionId, sectionIds))
          .orderBy(sectionItems.sortOrder);
      }

      // Combine sections with their items
      const sectionsWithItems = sections.map(section => ({
        ...section,
        items: items.filter(item => item.sectionId === section.id),
      }));

      return superjson.stringify({
        success: true,
        sections: sectionsWithItems,
      });
    } catch (error) {
      console.error('Error fetching sections:', error);
      throw new Error('Failed to fetch sections', {
        cause: { status: 500 }
      });
    }
  },
});

// Add a new section
export const POST = createEndpoint({
  input: z.object({
    sectionType: z.enum([
      'hero', 'banner', 'featured_products', 'categories',
      'best_sellers', 'new_arrivals', 'product_carousel',
      'promotional', 'image_text', 'testimonials',
      'newsletter', 'call_to_action', 'custom_html'
    ]),
    title: z.string().optional(),
    subtitle: z.string().optional(),
    settings: z.record(z.any()).optional(),
    backgroundColor: z.string().optional(),
    textColor: z.string().optional(),
  }),
  handler: async (data, event) => {
    const { user, tenantId } = await getServerUserSession(event);

    if (!user || !tenantId) {
      throw new Error("Unauthorized or no tenant selected", { cause: { status: 401 } });
    }

    try {
      // Get store
      const store = await db
        .select()
        .from(stores)
        .where(and(eq(stores.tenantId, tenantId)))
        .limit(1);

      if (!store[0]) {
        throw new Error('Store not found', { cause: { status: 404 } });
      }

      // Get max sort order
      const maxOrder = await db
        .select({ maxOrder: sql<number>`MAX(${pageSections.sortOrder})` })
        .from(pageSections)
        .where(eq(pageSections.storeId, store[0].id));

      const newSortOrder = (maxOrder[0]?.maxOrder || 0) + 1;

      // Create new section
      const [newSection] = await db
        .insert(pageSections)
        .values({
          storeId: store[0].id,
          sectionType: data.sectionType,
          title: data.title || '',
          subtitle: data.subtitle || '',
          settings: data.settings || {},
          backgroundColor: data.backgroundColor,
          textColor: data.textColor,
          sortOrder: newSortOrder,
          isEnabled: true,
          isPublished: false,
        })
        .returning();

      return superjson.stringify({
        success: true,
        section: newSection,
        message: 'Section added successfully',
      });
    } catch (error) {
      console.error('Error adding section:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to add section', {
        cause: { status: 500 }
      });
    }
  },
});

// Update section order (for drag-and-drop reordering)
export const PUT = createEndpoint({
  input: z.object({
    sectionIds: z.array(z.number()), // Ordered array of section IDs
  }),
  handler: async ({ sectionIds }, event) => {
    const { user, tenantId } = await getServerUserSession(event);

    if (!user || !tenantId) {
      throw new Error("Unauthorized or no tenant selected", { cause: { status: 401 } });
    }

    try {
      // Update sort order for each section
      for (let i = 0; i < sectionIds.length; i++) {
        await db
          .update(pageSections)
          .set({ sortOrder: i })
          .where(eq(pageSections.id, sectionIds[i]));
      }

      return superjson.stringify({
        success: true,
        message: 'Section order updated successfully',
      });
    } catch (error) {
      console.error('Error updating section order:', error);
      throw new Error('Failed to update section order', {
        cause: { status: 500 }
      });
    }
  },
});

// Delete a section
export const DELETE = createEndpoint({
  input: z.object({
    sectionId: z.number(),
  }),
  handler: async ({ sectionId }, event) => {
    const { user, tenantId } = await getServerUserSession(event);

    if (!user || !tenantId) {
      throw new Error("Unauthorized or no tenant selected", { cause: { status: 401 } });
    }

    try {
      // Verify section belongs to user's store
      const store = await db
        .select()
        .from(stores)
        .where(and(eq(stores.tenantId, tenantId)))
        .limit(1);

      const section = await db
        .select()
        .from(pageSections)
        .where(and(
          eq(pageSections.id, sectionId),
          eq(pageSections.storeId, store[0].id)
        ))
        .limit(1);

      if (!section[0]) {
        throw new Error('Section not found', { cause: { status: 404 } });
      }

      // Delete section (items will cascade delete)
      await db
        .delete(pageSections)
        .where(eq(pageSections.id, sectionId));

      return superjson.stringify({
        success: true,
        message: 'Section deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting section:', error);
      throw new Error('Failed to delete section', {
        cause: { status: 500 }
      });
    }
  },
});

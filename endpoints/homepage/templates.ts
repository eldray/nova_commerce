import { z } from "zod";
import { createEndpoint } from "@kitql/helper";
import superjson from "superjson";
import { getServerUserSession } from "../../helpers/getServerUserSession";
import { db } from "../../helpers/db";
import { eq, and, desc, sql } from "drizzle-orm";
import { pageSections, sectionItems, stores, homepageTemplates } from "../../helpers/schema";

// Get all available homepage templates
export const GET = createEndpoint({
  input: z.object({
    category: z.string().optional(),
  }).optional(),
  handler: async ({ category }, event) => {
    const { user, tenantId } = await getServerUserSession(event);

    if (!user || !tenantId) {
      throw new Error("Unauthorized or no tenant selected", { cause: { status: 401 } });
    }

    try {
      // Get available templates
      let templatesQuery = db
        .select()
        .from(homepageTemplates)
        .orderBy(homepageTemplates.name);

      if (category) {
        templatesQuery = db
          .select()
          .from(homepageTemplates)
          .where(eq(homepageTemplates.category, category))
          .orderBy(homepageTemplates.name);
      }

      const templates = await templatesQuery;

      // Get current store's homepage configuration
      const store = await db
        .select()
        .from(stores)
        .where(and(eq(stores.tenantId, tenantId)))
        .limit(1);

      const currentSections = store[0]
        ? await db
            .select()
            .from(pageSections)
            .where(eq(pageSections.storeId, store[0].id))
            .orderBy(pageSections.sortOrder)
        : [];

      return superjson.stringify({
        success: true,
        templates,
        currentSections,
        storeId: store[0]?.id || null,
      });
    } catch (error) {
      console.error('Error fetching homepage data:', error);
      throw new Error('Failed to fetch homepage data', {
        cause: { status: 500 }
      });
    }
  },
});

// Apply a template to the current store
export const POST = createEndpoint({
  input: z.object({
    templateSlug: z.string(),
  }),
  handler: async ({ templateSlug }, event) => {
    const { user, tenantId } = await getServerUserSession(event);

    if (!user || !tenantId) {
      throw new Error("Unauthorized or no tenant selected", { cause: { status: 401 } });
    }

    try {
      // Get the template
      const template = await db
        .select()
        .from(homepageTemplates)
        .where(eq(homepageTemplates.slug, templateSlug))
        .limit(1);

      if (!template[0]) {
        throw new Error('Template not found', { cause: { status: 404 } });
      }

      // Get or create store
      let store = await db
        .select()
        .from(stores)
        .where(and(eq(stores.tenantId, tenantId)))
        .limit(1);

      if (!store[0]) {
        throw new Error('Store not found. Please complete store setup first.', {
          cause: { status: 404 }
        });
      }

      const storeId = store[0].id;

      // Parse template section config
      const sectionConfig = typeof template[0].sectionConfig === 'string'
        ? JSON.parse(template[0].sectionConfig as unknown as string)
        : template[0].sectionConfig;

      // Create sections from template
      let sortOrder = 0;
      for (const section of sectionConfig) {
        await db
          .insert(pageSections)
          .values({
            storeId,
            sectionType: section.type,
            title: section.title || '',
            subtitle: section.subtitle || '',
            settings: section.settings || {},
            sortOrder: sortOrder++,
            isEnabled: true,
            isPublished: false,
          });
      }

      // Update store with template reference
      await db
        .update(stores)
        .set({
          homepageTemplateId: template[0].id,
          customHomepageEnabled: true,
          updatedAt: new Date(),
        })
        .where(eq(stores.id, storeId));

      return superjson.stringify({
        success: true,
        message: `Applied ${template[0].name} template successfully`,
      });
    } catch (error) {
      console.error('Error applying template:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to apply template', {
        cause: { status: 500 }
      });
    }
  },
});

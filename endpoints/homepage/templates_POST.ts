import { z } from "zod";
import superjson from "superjson";
import { getServerUserSession } from "../../helpers/getServerUserSession";
import { db } from "../../helpers/db";

const schema = z.object({
  templateSlug: z.string(),
});

export async function handle(request: Request) {
  try {
    const { user, tenantId } = await getServerUserSession(request);

    if (!user || !tenantId) {
      return new Response(superjson.stringify({ error: "Unauthorized or no tenant selected" }), { status: 401 });
    }

    const json = superjson.parse(await request.text());
    const { templateSlug } = schema.parse(json);

    const template = await db
      .selectFrom("homepageTemplates")
      .selectAll()
      .where("slug", "=", templateSlug)
      .executeTakeFirst();

    if (!template) {
      return new Response(superjson.stringify({ error: "Template not found" }), { status: 404 });
    }

    const store = await db
      .selectFrom("stores")
      .selectAll()
      .where("tenantId", "=", tenantId)
      .executeTakeFirst();

    if (!store) {
      return new Response(
        superjson.stringify({ error: "Store not found. Please complete store setup first." }),
        { status: 404 }
      );
    }

    const storeId = store.id;

    const sectionConfig: any[] = typeof template.sectionConfig === "string"
      ? JSON.parse(template.sectionConfig)
      : (template.sectionConfig || []);

    let sortOrder = 0;
    for (const section of sectionConfig) {
      await db
        .insertInto("pageSections")
        .values({
          storeId,
          sectionType: section.type,
          title: section.title || "",
          subtitle: section.subtitle || "",
          settings: section.settings || {},
          sortOrder: sortOrder++,
          isEnabled: true,
          isPublished: false,
        })
        .execute();
    }

    return new Response(
      superjson.stringify({
        success: true,
        message: `Applied ${template.name} template successfully`,
      })
    );
  } catch (error: any) {
    console.error("Error applying template:", error);
    return new Response(
      superjson.stringify({ error: error.message || "Failed to apply template" }),
      { status: 500 }
    );
  }
}

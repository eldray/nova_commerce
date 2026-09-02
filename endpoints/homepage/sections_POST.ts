import { z } from "zod";
import superjson from "superjson";
import { getServerUserSession } from "../../helpers/getServerUserSession";
import { db, sql } from "../../helpers/db";

const schema = z.object({
  sectionType: z.enum([
    "hero",
    "banner",
    "featured_products",
    "categories",
    "best_sellers",
    "new_arrivals",
    "product_carousel",
    "promotional",
    "image_text",
    "testimonials",
    "newsletter",
    "call_to_action",
    "custom_html",
  ]),
  title: z.string().optional(),
  subtitle: z.string().optional(),
  settings: z.record(z.any()).optional(),
  backgroundColor: z.string().optional(),
  textColor: z.string().optional(),
});

export async function handle(request: Request) {
  try {
    const { user, tenantId } = await getServerUserSession(request);

    if (!user || !tenantId) {
      return new Response(superjson.stringify({ error: "Unauthorized or no tenant selected" }), { status: 401 });
    }

    const store = await db
      .selectFrom("stores")
      .selectAll()
      .where("tenantId", "=", tenantId)
      .executeTakeFirst();

    if (!store) {
      return new Response(superjson.stringify({ error: "Store not found" }), { status: 404 });
    }

    const json = superjson.parse(await request.text());
    const data = schema.parse(json);

    const maxResult = await db
      .selectFrom("pageSections")
      .select(sql<number>`COALESCE(MAX(sort_order), 0)`.as("maxOrder"))
      .where("storeId", "=", store.id)
      .executeTakeFirst();

    const newSortOrder = (maxResult?.maxOrder || 0) + 1;

    const newSection = await db
      .insertInto("pageSections")
      .values({
        storeId: store.id,
        sectionType: data.sectionType,
        title: data.title || "",
        subtitle: data.subtitle || "",
        settings: data.settings || {},
        backgroundColor: data.backgroundColor || null,
        textColor: data.textColor || null,
        sortOrder: newSortOrder,
        isEnabled: true,
        isPublished: false,
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    return new Response(
      superjson.stringify({
        success: true,
        section: newSection,
        message: "Section added successfully",
      })
    );
  } catch (error: any) {
    console.error("Error adding section:", error);
    return new Response(superjson.stringify({ error: error.message || "Failed to add section" }), { status: 500 });
  }
}

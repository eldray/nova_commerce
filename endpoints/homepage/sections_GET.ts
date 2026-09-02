import superjson from "superjson";
import { getServerUserSession } from "../../helpers/getServerUserSession";
import { db } from "../../helpers/db";

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

    const sections = await db
      .selectFrom("pageSections")
      .selectAll()
      .where("storeId", "=", store.id)
      .orderBy("sortOrder", "asc")
      .execute();

    const sectionIds = sections.map((s) => s.id);
    let items: any[] = [];
    if (sectionIds.length > 0) {
      items = await db
        .selectFrom("sectionItems")
        .selectAll()
        .where("sectionId", "in", sectionIds)
        .orderBy("sortOrder", "asc")
        .execute();
    }

    const sectionsWithItems = sections.map((section) => ({
      ...section,
      items: items.filter((item) => item.sectionId === section.id),
    }));

    return new Response(
      superjson.stringify({
        success: true,
        sections: sectionsWithItems,
      })
    );
  } catch (error: any) {
    console.error("Error fetching sections:", error);
    return new Response(superjson.stringify({ error: "Failed to fetch sections" }), { status: 500 });
  }
}

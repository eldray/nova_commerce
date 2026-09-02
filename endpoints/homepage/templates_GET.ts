import superjson from "superjson";
import { getServerUserSession } from "../../helpers/getServerUserSession";
import { db } from "../../helpers/db";

export async function handle(request: Request) {
  try {
    const { user, tenantId } = await getServerUserSession(request);

    if (!user || !tenantId) {
      return new Response(superjson.stringify({ error: "Unauthorized or no tenant selected" }), { status: 401 });
    }

    const url = new URL(request.url);
    const category = url.searchParams.get("category");

    let query = db.selectFrom("homepageTemplates").selectAll();
    if (category) {
      query = query.where("category", "=", category);
    }
    const templates = await query.orderBy("name", "asc").execute();

    const store = await db
      .selectFrom("stores")
      .selectAll()
      .where("tenantId", "=", tenantId)
      .executeTakeFirst();

    const currentSections = store
      ? await db
          .selectFrom("pageSections")
          .selectAll()
          .where("storeId", "=", store.id)
          .orderBy("sortOrder", "asc")
          .execute()
      : [];

    return new Response(
      superjson.stringify({
        success: true,
        templates,
        currentSections,
        storeId: store?.id || null,
      })
    );
  } catch (error: any) {
    console.error("Error fetching homepage data:", error);
    return new Response(superjson.stringify({ error: "Failed to fetch homepage data" }), { status: 500 });
  }
}

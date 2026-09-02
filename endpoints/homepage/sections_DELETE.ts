import { z } from "zod";
import superjson from "superjson";
import { getServerUserSession } from "../../helpers/getServerUserSession";
import { db } from "../../helpers/db";

const schema = z.object({
  sectionId: z.number(),
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
    const { sectionId } = schema.parse(json);

    const section = await db
      .selectFrom("pageSections")
      .selectAll()
      .where("id", "=", sectionId)
      .where("storeId", "=", store.id)
      .executeTakeFirst();

    if (!section) {
      return new Response(superjson.stringify({ error: "Section not found" }), { status: 404 });
    }

    await db.deleteFrom("pageSections").where("id", "=", sectionId).execute();

    return new Response(
      superjson.stringify({
        success: true,
        message: "Section deleted successfully",
      })
    );
  } catch (error: any) {
    console.error("Error deleting section:", error);
    return new Response(superjson.stringify({ error: "Failed to delete section" }), { status: 500 });
  }
}

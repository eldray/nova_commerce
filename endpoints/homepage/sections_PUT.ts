import { z } from "zod";
import superjson from "superjson";
import { getServerUserSession } from "../../helpers/getServerUserSession";
import { db } from "../../helpers/db";

const schema = z.object({
  sectionIds: z.array(z.number()),
});

export async function handle(request: Request) {
  try {
    const { user, tenantId } = await getServerUserSession(request);

    if (!user || !tenantId) {
      return new Response(superjson.stringify({ error: "Unauthorized or no tenant selected" }), { status: 401 });
    }

    const json = superjson.parse(await request.text());
    const { sectionIds } = schema.parse(json);

    for (let i = 0; i < sectionIds.length; i++) {
      await db
        .updateTable("pageSections")
        .set({ sortOrder: i })
        .where("id", "=", sectionIds[i])
        .execute();
    }

    return new Response(
      superjson.stringify({
        success: true,
        message: "Section order updated successfully",
      })
    );
  } catch (error: any) {
    console.error("Error updating section order:", error);
    return new Response(superjson.stringify({ error: "Failed to update section order" }), { status: 500 });
  }
}

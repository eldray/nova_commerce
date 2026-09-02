import superjson from "superjson";
import { getServerUserSession } from "../../../helpers/getServerUserSession";
import { db } from "../../../helpers/db";

export async function handle(request: Request) {
  try {
    const { user, tenantId } = await getServerUserSession(request);

    if (!user || !tenantId) {
      return new Response(superjson.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    const body = superjson.parse<{ productId?: number; imageIds?: number[] }>(await request.text());
    const { productId, imageIds } = body;

    if (!productId || !Array.isArray(imageIds)) {
      return new Response(superjson.stringify({ error: "Product ID and image IDs array are required" }), { status: 400 });
    }

    const product = await db
      .selectFrom("products")
      .select("id")
      .where("id", "=", productId)
      .where("tenantId", "=", tenantId)
      .executeTakeFirst();

    if (!product) {
      return new Response(superjson.stringify({ error: "Product not found" }), { status: 404 });
    }

    for (let i = 0; i < imageIds.length; i++) {
      await db
        .updateTable("productImages")
        .set({ position: i })
        .where("id", "=", imageIds[i])
        .where("productId", "=", productId)
        .execute();
    }

    return new Response(
      superjson.stringify({ success: true, message: "Images reordered successfully" })
    );
  } catch (error) {
    console.error("Error reordering images:", error);
    return new Response(superjson.stringify({ error: "Failed to reorder images" }), { status: 500 });
  }
}

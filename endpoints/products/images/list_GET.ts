import superjson from "superjson";
import { getServerUserSession } from "../../../helpers/getServerUserSession";
import { db } from "../../../helpers/db";

export async function handle(request: Request) {
  try {
    const { user, tenantId } = await getServerUserSession(request);

    if (!user || !tenantId) {
      return new Response(superjson.stringify({ error: "Unauthorized. Please log in." }), { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const productIdStr = searchParams.get("productId");

    if (!productIdStr) {
      return new Response(superjson.stringify({ error: "Product ID is required" }), { status: 400 });
    }

    const productId = parseInt(productIdStr, 10);
    if (isNaN(productId)) {
      return new Response(superjson.stringify({ error: "Invalid product ID" }), { status: 400 });
    }

    const product = await db
      .selectFrom("products")
      .select("id")
      .where("id", "=", productId)
      .where("tenantId", "=", tenantId)
      .executeTakeFirst();

    if (!product) {
      return new Response(superjson.stringify({ error: "Product not found or access denied" }), { status: 404 });
    }

    const images = await db
      .selectFrom("productImages")
      .selectAll()
      .where("productId", "=", productId)
      .orderBy("position", "asc")
      .execute();

    return new Response(
      superjson.stringify({
        success: true,
        images: images.map((img) => ({
          id: img.id,
          url: img.url,
          position: img.position,
          createdAt: img.createdAt,
        })),
      })
    );
  } catch (error) {
    console.error("Error listing product images:", error);
    return new Response(
      superjson.stringify({ error: "Failed to list product images" }),
      { status: 500 }
    );
  }
}

import superjson from "superjson";
import { getServerUserSession } from "../../../../helpers/getServerUserSession";
import { db } from "../../../../helpers/db";

export async function handle(request: Request, params?: Record<string, string>) {
  try {
    const { user, tenantId } = await getServerUserSession(request);

    if (!user || !tenantId) {
      return new Response(superjson.stringify({ error: "Unauthorized. Please log in." }), { status: 401 });
    }

    const imageIdStr = params?.imageId || new URL(request.url).pathname.split("/").slice(-2)[0];
    const imageId = parseInt(imageIdStr, 10);

    if (isNaN(imageId)) {
      return new Response(superjson.stringify({ error: "Invalid image ID" }), { status: 400 });
    }

    const image = await db
      .selectFrom("productImages")
      .selectAll()
      .where("id", "=", imageId)
      .executeTakeFirst();

    if (!image) {
      return new Response(superjson.stringify({ error: "Image not found" }), { status: 404 });
    }

    const product = await db
      .selectFrom("products")
      .select("id")
      .where("id", "=", image.productId)
      .where("tenantId", "=", tenantId)
      .executeTakeFirst();

    if (!product) {
      return new Response(superjson.stringify({ error: "Access denied" }), { status: 403 });
    }

    await db
      .deleteFrom("productImages")
      .where("id", "=", imageId)
      .execute();

    return new Response(
      superjson.stringify({
        success: true,
        message: "Image deleted successfully",
      })
    );
  } catch (error) {
    console.error("Image deletion error:", error);
    return new Response(
      superjson.stringify({ error: "Failed to delete image" }),
      { status: 500 }
    );
  }
}

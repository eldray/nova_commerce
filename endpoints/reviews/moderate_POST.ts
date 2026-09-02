import { db } from "../../helpers/db";
import { getServerUserSession } from "../../helpers/getServerUserSession";
import superjson from "superjson";
import { schema } from "./moderate_POST.schema";

export async function handle(request: Request) {
  try {
    const { user, tenantId } = await getServerUserSession(request);
    if (!user || !tenantId) {
      return new Response(superjson.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    const json = superjson.parse(await request.text());
    const input = schema.parse(json);

    const review = await db
      .selectFrom("productReviews")
      .where("id", "=", input.reviewId)
      .where("tenantId", "=", tenantId)
      .selectAll()
      .executeTakeFirst();

    if (!review) {
      return new Response(superjson.stringify({ error: "Review not found" }), { status: 404 });
    }

    const result = await db
      .updateTable("productReviews")
      .set({
        status: input.status,
        merchantResponse: input.merchantResponse || null,
        merchantResponseAt: input.merchantResponse ? new Date() : null,
        respondedByUserId: input.merchantResponse ? user.id : null,
        updatedAt: new Date(),
      })
      .where("id", "=", input.reviewId)
      .returning(["id", "status", "merchantResponse", "merchantResponseAt"])
      .executeTakeFirstOrThrow();

    return new Response(
      superjson.stringify({
        id: result.id,
        status: result.status,
        merchantResponse: result.merchantResponse,
        merchantResponseAt: result.merchantResponseAt,
      })
    );
  } catch (error: any) {
    console.error("Error moderating review:", error);
    return new Response(superjson.stringify({ error: error.message || "Failed to moderate review" }), { status: 400 });
  }
}

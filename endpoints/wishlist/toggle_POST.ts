import superjson from "superjson";
import { schema, OutputType } from "./toggle_POST.schema";
import { db } from "../../helpers/db";
import { getServerUserSession } from "../../helpers/getServerUserSession";

export async function handle(request: Request) {
  try {
    const userSession = await getServerUserSession(request);
    if (!userSession || !userSession.user) {
      return new Response(superjson.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    const { user, tenantId } = userSession;

    if (!tenantId) {
      return new Response(superjson.stringify({ error: "Tenant not found" }), { status: 404 });
    }

    const json = superjson.parse(await request.text());
    const input = schema.parse(json);

    let customer = await db
      .selectFrom("customers")
      .select(["id"])
      .where("email", "=", user.email)
      .where("tenantId", "=", tenantId)
      .executeTakeFirst();

    if (!customer) {
      customer = await db
        .insertInto("customers")
        .values({
          tenantId,
          email: user.email,
          firstName: user.displayName || user.email,
        })
        .returning(["id"])
        .executeTakeFirstOrThrow();
    }

    const existing = await db
      .selectFrom("wishlists")
      .select(["id"])
      .where("tenantId", "=", tenantId)
      .where("customerId", "=", customer.id)
      .where("productId", "=", input.productId)
      .executeTakeFirst();

    if (existing) {
      await db
        .deleteFrom("wishlists")
        .where("id", "=", existing.id)
        .execute();

      return new Response(
        superjson.stringify({ success: true, action: "removed" as const } satisfies OutputType),
        { status: 200 }
      );
    } else {
      const result = await db
        .insertInto("wishlists")
        .values({
          tenantId,
          customerId: customer.id,
          productId: input.productId,
        })
        .returning(["id"])
        .executeTakeFirstOrThrow();

      return new Response(
        superjson.stringify({
          success: true,
          action: "added" as const,
          wishlistId: result.id,
        } satisfies OutputType),
        { status: 200 }
      );
    }
  } catch (error) {
    console.error("wishlist toggle error:", error);
    const message = error instanceof Error ? error.message : "Failed to update wishlist";
    return new Response(superjson.stringify({ error: message }), { status: 400 });
  }
}

import superjson from "superjson";
import { schema, OutputType } from "./toggle_POST.schema";
import { db } from "../../helpers/db";
import { getServerUserSession } from "../../helpers/getServerUserSession";
import { getTenantIdFromSession } from "../../helpers/tenantContext";

export async function handle(request: Request) {
  try {
    const session = await getServerUserSession(request);
    if (!session) {
      return new Response(superjson.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    const tenantResult = await getTenantIdFromSession(request);
    if (!tenantResult.success || !tenantResult.tenantId) {
      return new Response(superjson.stringify({ error: "Tenant not found" }), { status: 404 });
    }
    const tenantId = tenantResult.tenantId;
    
    const json = superjson.parse(await request.text());
    const input = schema.parse(json);

    // Find or create customer by user email
    let customer = await db
      .selectFrom("customers")
      .select(["id"])
      .where("email", "=", session.user.email)
      .where("tenant_id", "=", tenantId)
      .executeTakeFirst();

    if (!customer) {
      // Create customer record for this user
      customer = await db
        .insertInto("customers")
        .values({
          tenant_id: tenantId,
          email: session.user.email,
          name: session.user.displayName || session.user.email,
        })
        .returning(["id"])
        .executeTakeFirstOrThrow();
    }

    // Check if item already in wishlist
    const existing = await db
      .selectFrom("wishlists")
      .select(["id"])
      .where("tenant_id", "=", tenantId)
      .where("customer_id", "=", customer.id)
      .where("product_id", "=", input.productId)
      .executeTakeFirst();

    if (existing) {
      // Remove from wishlist
      await db
        .deleteFrom("wishlists")
        .where("id", "=", existing.id)
        .execute();

      return new Response(
        superjson.stringify({ success: true, action: "removed" as const } satisfies OutputType),
        { status: 200 }
      );
    } else {
      // Add to wishlist
      const result = await db
        .insertInto("wishlists")
        .values({
          tenant_id: tenantId,
          customer_id: customer.id,
          product_id: input.productId,
        })
        .returning(["id"])
        .executeTakeFirstOrThrow();

      return new Response(
        superjson.stringify({ 
          success: true, 
          action: "added" as const,
          wishlistId: result.id 
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

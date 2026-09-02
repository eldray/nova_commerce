import { schema, OutputType } from "./publish_POST.schema";
import superjson from "superjson";
import { getServerUserSession } from "../../helpers/getServerUserSession";
import { db } from "../../helpers/db";
import { roleHasPermission } from "../../helpers/permissions";

export async function handle(request: Request) {
  try {
    const { user, session, tenantId, tenantRole } = await getServerUserSession(request);

    if (!user || !session) {
      return new Response(superjson.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    if (!tenantId) {
      return new Response(superjson.stringify({ error: "No tenant selected" }), { status: 400 });
    }

    if (!tenantRole) {
      return new Response(superjson.stringify({ error: "User not associated with tenant" }), { status: 403 });
    }

    if (!roleHasPermission(tenantRole, "store.publish")) {
      return new Response(superjson.stringify({ error: "Insufficient permissions to publish store" }), { status: 403 });
    }

    const json = superjson.parse(await request.text());
    const input = schema.parse(json);

    const store = await db
      .selectFrom("stores")
      .selectAll()
      .where("tenantId", "=", tenantId)
      .executeTakeFirst();

    if (!store) {
      return new Response(superjson.stringify({ error: "Store not found for tenant" }), { status: 404 });
    }

    const updatedStore = await db
      .updateTable("stores")
      .set({
        isPublished: input.publish,
        updatedAt: new Date(),
      })
      .where("tenantId", "=", tenantId)
      .returningAll()
      .executeTakeFirstOrThrow();

    return new Response(
      superjson.stringify({
        success: true,
        store: {
          id: updatedStore.id,
          isPublished: updatedStore.isPublished,
          storeName: updatedStore.storeName,
          subdomain: updatedStore.subdomain,
        },
      } satisfies OutputType)
    );
  } catch (error) {
    console.error("publish_POST error:", error);
    const message = error instanceof Error ? error.message : "Failed to publish store";
    return new Response(superjson.stringify({ error: message }), { status: 400 });
  }
}

import { requireAuth } from "../../middleware/auth";
import { db } from "../../helpers/db";
import superjson from "superjson";

export async function handle(request: Request, params?: Record<string, string>) {
  try {
    const { user } = await requireAuth(request);

    const domainIdStr = params?.domainId || new URL(request.url).searchParams.get("domainId");
    const domainId = domainIdStr ? parseInt(domainIdStr, 10) : null;

    if (!domainId) {
      return new Response(superjson.stringify({ error: "Domain ID is required" }), { status: 400 });
    }

    const domain = await db
      .selectFrom("customDomains")
      .selectAll()
      .where("id", "=", domainId)
      .where("userId", "=", user.id)
      .executeTakeFirst();

    if (!domain) {
      return new Response(superjson.stringify({ error: "Domain not found" }), { status: 404 });
    }

    if (domain.status === "verified") {
      await db
        .updateTable("stores")
        .set({
          customDomain: null,
          sslEnabled: false,
        })
        .where("tenantId", "=", user.id)
        .execute();
    }

    await db
      .deleteFrom("customDomains")
      .where("id", "=", domainId)
      .where("userId", "=", user.id)
      .execute();

    return new Response(
      superjson.stringify({
        success: true,
        message: "Domain removed successfully",
      })
    );
  } catch (error: any) {
    console.error("Error deleting domain:", error);
    return new Response(
      superjson.stringify({
        success: false,
        error: error.message || "Failed to delete domain",
      }),
      { status: error.cause?.status || 500 }
    );
  }
}

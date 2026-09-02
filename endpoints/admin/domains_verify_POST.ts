import { requireAdmin } from "../../middleware/auth";
import { DomainService } from "../../services/domainService";
import { db } from "../../helpers/db";
import superjson from "superjson";

export async function handle(request: Request) {
  try {
    await requireAdmin(request);

    const body = superjson.parse<{ domainId?: number }>(await request.text());
    const { domainId } = body;

    if (!domainId) {
      return new Response(superjson.stringify({ error: "Domain ID is required" }), { status: 400 });
    }

    await DomainService.forceVerifyDomain(domainId);

    const domain = await db
      .selectFrom("customDomains")
      .selectAll()
      .where("id", "=", domainId)
      .executeTakeFirst();

    if (domain) {
      await db
        .updateTable("stores")
        .set({
          customDomain: domain.domain,
          sslEnabled: true,
        })
        .where("tenantId", "=", domain.userId)
        .execute();
    }

    return new Response(
      superjson.stringify({
        success: true,
        message: "Domain manually verified by admin",
        data: domain,
      })
    );
  } catch (error: any) {
    console.error("Error admin verifying domain:", error);
    return new Response(
      superjson.stringify({
        success: false,
        error: error.message || "Failed to verify domain",
      }),
      { status: error.cause?.status || 500 }
    );
  }
}

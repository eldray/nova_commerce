import { requireAuth } from "../../middleware/auth";
import { db } from "../../helpers/db";
import superjson from "superjson";

export async function handle(request: Request) {
  try {
    const { user } = await requireAuth(request);

    const domains = await db
      .selectFrom("customDomains")
      .selectAll()
      .where("userId", "=", user.id)
      .orderBy("createdAt", "desc")
      .execute();

    const store = await db
      .selectFrom("stores")
      .select(["subdomain", "customDomain"])
      .where("tenantId", "=", user.id)
      .executeTakeFirst();

    const formattedDomains = domains.map((d) => ({
      id: d.id,
      domain: d.domain,
      status: d.status,
      createdAt: d.createdAt,
      verifiedAt: d.verifiedAt,
      sslEnabled: d.sslEnabled,
      sslStatus: d.sslStatus,
      isActive: d.status === "verified",
      storeUrl: d.status === "verified"
        ? `https://${d.domain}`
        : `https://${store?.subdomain || "store"}.nova-commerce.app`,
      dnsInstructions: {
        cname: {
          type: "CNAME",
          host: "www",
          value: "nova-commerce.app",
          configured: d.status === "verified",
        },
        txt: {
          type: "TXT",
          host: "@",
          value: `nova-commerce-verification=${d.verificationToken}`,
          configured: d.status === "verified",
        },
      },
    }));

    return new Response(
      superjson.stringify({
        success: true,
        domains: formattedDomains,
        count: formattedDomains.length,
      })
    );
  } catch (error: any) {
    console.error("Error fetching domains:", error);
    return new Response(
      superjson.stringify({
        success: false,
        error: error.message || "Failed to fetch domains",
      }),
      { status: error.cause?.status || 500 }
    );
  }
}

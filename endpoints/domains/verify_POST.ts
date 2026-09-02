import { requireAuth } from "../../middleware/auth";
import { DomainService } from "../../services/domainService";
import { db } from "../../helpers/db";
import superjson from "superjson";

export async function handle(request: Request) {
  try {
    const { user } = await requireAuth(request);

    const body = superjson.parse<{ domainId?: number }>(await request.text());
    const { domainId } = body;

    if (!domainId) {
      return new Response(superjson.stringify({ error: "Domain ID is required" }), { status: 400 });
    }

    const domainRecord = await db
      .selectFrom("customDomains")
      .selectAll()
      .where("id", "=", domainId)
      .where("userId", "=", user.id)
      .executeTakeFirst();

    if (!domainRecord) {
      return new Response(superjson.stringify({ error: "Domain not found" }), { status: 404 });
    }

    if (domainRecord.status === "verified") {
      return new Response(
        superjson.stringify({
          success: true,
          message: "Domain already verified",
          data: {
            domainId: domainRecord.id,
            domain: domainRecord.domain,
            status: "verified",
            verifiedAt: domainRecord.verifiedAt,
          },
        })
      );
    }

    const isVerified = await DomainService.verifyDomain(domainId);

    if (isVerified) {
      const updatedDomain = await db
        .selectFrom("customDomains")
        .selectAll()
        .where("id", "=", domainId)
        .executeTakeFirst();

      return new Response(
        superjson.stringify({
          success: true,
          message: "Domain verified successfully! Your store is now accessible at your custom domain.",
          data: {
            domainId: updatedDomain?.id,
            domain: updatedDomain?.domain,
            status: "verified",
            verifiedAt: updatedDomain?.verifiedAt,
            sslEnabled: updatedDomain?.sslEnabled,
          },
        })
      );
    } else {
      return new Response(
        superjson.stringify({
          success: false,
          message: "DNS records not yet configured correctly. Please check your DNS settings and try again.",
          data: {
            domainId,
            status: "pending",
            instructions: {
              cname: {
                type: "CNAME",
                host: "www",
                value: "nova-commerce.app",
              },
              txt: {
                type: "TXT",
                host: "@",
                value: `nova-commerce-verification=${domainRecord.verificationToken}`,
              },
            },
          },
        }),
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error("Error verifying domain:", error);
    return new Response(
      superjson.stringify({
        success: false,
        error: error.message || "Failed to verify domain",
      }),
      { status: error.cause?.status || 500 }
    );
  }
}

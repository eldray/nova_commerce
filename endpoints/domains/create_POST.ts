import { requireAuth } from "../../middleware/auth";
import { DomainService } from "../../services/domainService";
import { db } from "../../helpers/db";
import superjson from "superjson";

export async function handle(request: Request) {
  try {
    const { user } = await requireAuth(request);

    const body = superjson.parse<{ domain?: string }>(await request.text());
    const { domain } = body;

    if (!domain || typeof domain !== "string") {
      return new Response(superjson.stringify({ error: "Domain name is required" }), { status: 400 });
    }

    const cleanedDomain = domain.toLowerCase().trim().replace(/^https?:\/\//, "").replace(/\/$/, "");

    const existingDomain = await db
      .selectFrom("customDomains")
      .select("id")
      .where("userId", "=", user.id)
      .where("status", "=", "verified")
      .executeTakeFirst();

    if (existingDomain) {
      return new Response(
        superjson.stringify({
          error: "You already have a verified custom domain. Please remove it before adding a new one.",
        }),
        { status: 400 }
      );
    }

    const result = await DomainService.addDomain(user.id, cleanedDomain);

    return new Response(
      superjson.stringify({
        success: true,
        message: "Domain added successfully. Please configure your DNS records to verify ownership.",
        data: {
          domainId: result.id,
          domain: result.domain,
          verificationToken: result.verificationToken,
          status: result.status,
          nextSteps: [
            "Add CNAME record: www -> nova-commerce.app",
            "Add TXT record: @ -> nova-commerce-verification=" + result.verificationToken,
            "Wait for DNS propagation (5-30 minutes)",
            'Click "Verify" button to complete setup',
          ],
        },
      }),
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error adding custom domain:", error);
    const message = error.message || "Failed to add domain";
    const status = message.includes("already registered") ? 409 : 500;
    return new Response(superjson.stringify({ error: message }), { status });
  }
}

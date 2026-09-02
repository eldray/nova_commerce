import { z } from "zod";
import superjson from "superjson";
import { getServerUserSession } from "../../helpers/getServerUserSession";
import { emailService } from "../../services/emailService";

const schema = z.object({
  to: z.string().email("Invalid email address"),
  subject: z.string().min(1, "Subject is required").max(500),
  template: z.string().min(1, "Template name is required"),
  data: z.record(z.any()).optional(),
  tenantId: z.number().optional(),
});

export async function handle(request: Request) {
  try {
    const { user, tenantId: userTenantId } = await getServerUserSession(request);

    if (!user) {
      return new Response(superjson.stringify({ error: "Unauthorized. Please log in." }), { status: 401 });
    }

    const json = superjson.parse(await request.text());
    const validation = schema.safeParse(json);

    if (!validation.success) {
      return new Response(
        superjson.stringify({ error: "Invalid request data", details: validation.error.errors }),
        { status: 400 }
      );
    }

    const { to, subject, template, data } = validation.data;

    await emailService.queueEmail(to, subject, template, data || {});

    return new Response(
      superjson.stringify({
        success: true,
        message: "Email queued for delivery",
      }),
      { status: 202 }
    );
  } catch (error) {
    console.error("Send notification error:", error);
    return new Response(
      superjson.stringify({
        error: "Failed to queue notification",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500 }
    );
  }
}

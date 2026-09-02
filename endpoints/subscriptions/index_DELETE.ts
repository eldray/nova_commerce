import { z } from "zod";
import superjson from "superjson";
import { getServerUserSession } from "../../helpers/getServerUserSession";
import { cancelSubscription } from "../../services/subscriptionService";

const schema = z.object({
  reason: z.string().optional(),
});

export async function handle(request: Request) {
  try {
    const { user, tenantId } = await getServerUserSession(request);

    if (!user || !tenantId) {
      return new Response(superjson.stringify({ error: "Unauthorized or no tenant selected" }), { status: 401 });
    }

    let reason: string | undefined;
    try {
      const text = await request.text();
      if (text) {
        const json = superjson.parse(text);
        const parsed = schema.parse(json);
        reason = parsed.reason;
      }
    } catch {}

    await cancelSubscription(tenantId, reason);

    return new Response(
      superjson.stringify({
        success: true,
        message: "Subscription cancelled successfully.",
      })
    );
  } catch (error: any) {
    return new Response(superjson.stringify({ error: error.message || "Failed to cancel subscription" }), { status: 400 });
  }
}

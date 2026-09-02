import { z } from "zod";
import superjson from "superjson";
import { getServerUserSession } from "../../helpers/getServerUserSession";
import { subscribeTenant } from "../../services/subscriptionService";

const schema = z.object({
  planId: z.number().int().positive(),
  billingCycle: z.enum(["monthly", "yearly"]).default("monthly"),
});

export async function handle(request: Request) {
  try {
    const { user, tenantId } = await getServerUserSession(request);

    if (!user || !tenantId) {
      return new Response(superjson.stringify({ error: "Unauthorized or no tenant selected" }), { status: 401 });
    }

    const json = superjson.parse(await request.text());
    const { planId, billingCycle } = schema.parse(json);

    const subscription = await subscribeTenant(tenantId, planId, billingCycle);

    return new Response(
      superjson.stringify({
        success: true,
        subscription,
        message: `Successfully subscribed to ${subscription.plan.name} plan with 14-day free trial`,
      })
    );
  } catch (error: any) {
    return new Response(superjson.stringify({ error: error.message || "Failed to subscribe" }), { status: 400 });
  }
}

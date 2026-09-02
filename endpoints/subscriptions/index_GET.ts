import superjson from "superjson";
import { getServerUserSession } from "../../helpers/getServerUserSession";
import { getAvailablePlans, getCurrentSubscription } from "../../services/subscriptionService";

export async function handle(request: Request) {
  try {
    const { user, tenantId } = await getServerUserSession(request);

    if (!user) {
      return new Response(superjson.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    const plans = await getAvailablePlans();
    let currentSubscription = null;
    if (tenantId) {
      currentSubscription = await getCurrentSubscription(tenantId);
    }

    return new Response(
      superjson.stringify({
        success: true,
        plans,
        currentSubscription,
      })
    );
  } catch (error: any) {
    return new Response(superjson.stringify({ error: error.message }), { status: 400 });
  }
}

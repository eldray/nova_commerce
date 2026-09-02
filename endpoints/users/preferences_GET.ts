import superjson from "superjson";
import { getServerUserSession } from "../../helpers/getServerUserSession";
import { db } from "../../helpers/db";

export async function handle(request: Request) {
  try {
    const { user, tenantId } = await getServerUserSession(request);

    if (!user || !tenantId) {
      return new Response(superjson.stringify({ error: "Unauthorized. Please log in." }), { status: 401 });
    }

    const preferences = await db
      .selectFrom("notificationPreferences")
      .selectAll()
      .where("userId", "=", user.id)
      .where("tenantId", "=", tenantId)
      .executeTakeFirst();

    if (!preferences) {
      return new Response(
        superjson.stringify({
          success: true,
          preferences: {
            emailOrderConfirmation: true,
            emailOrderStatusUpdate: true,
            emailPaymentReceipt: true,
            emailPasswordReset: true,
            emailLowStockAlert: true,
            emailSubscriptionRenewal: true,
            emailMarketing: false,
            smsOrderConfirmation: false,
            smsOrderStatusUpdate: false,
            whatsappOrderUpdate: false,
          },
        })
      );
    }

    return new Response(
      superjson.stringify({
        success: true,
        preferences,
      })
    );
  } catch (error: any) {
    console.error("Get preferences error:", error);
    return new Response(superjson.stringify({ error: error.message || "Failed to get notification preferences" }), { status: 500 });
  }
}

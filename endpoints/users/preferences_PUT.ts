import { z } from "zod";
import superjson from "superjson";
import { getServerUserSession } from "../../helpers/getServerUserSession";
import { db } from "../../helpers/db";

const schema = z.object({
  emailOrderConfirmation: z.boolean().optional(),
  emailOrderStatusUpdate: z.boolean().optional(),
  emailPaymentReceipt: z.boolean().optional(),
  emailPasswordReset: z.boolean().optional(),
  emailLowStockAlert: z.boolean().optional(),
  emailSubscriptionRenewal: z.boolean().optional(),
  emailMarketing: z.boolean().optional(),
  smsOrderConfirmation: z.boolean().optional(),
  smsOrderStatusUpdate: z.boolean().optional(),
  whatsappOrderUpdate: z.boolean().optional(),
});

export async function handle(request: Request) {
  try {
    const { user, tenantId } = await getServerUserSession(request);

    if (!user || !tenantId) {
      return new Response(superjson.stringify({ error: "Unauthorized. Please log in." }), { status: 401 });
    }

    const json = superjson.parse(await request.text());
    const preferences = schema.parse(json);

    const existingPrefs = await db
      .selectFrom("notificationPreferences")
      .selectAll()
      .where("userId", "=", user.id)
      .where("tenantId", "=", tenantId)
      .executeTakeFirst();

    if (!existingPrefs) {
      const newPrefs = await db
        .insertInto("notificationPreferences")
        .values({
          userId: user.id,
          tenantId,
          emailOrderConfirmation: preferences.emailOrderConfirmation ?? true,
          emailOrderStatusUpdate: preferences.emailOrderStatusUpdate ?? true,
          emailPaymentReceipt: preferences.emailPaymentReceipt ?? true,
          emailPasswordReset: preferences.emailPasswordReset ?? true,
          emailLowStockAlert: preferences.emailLowStockAlert ?? true,
          emailSubscriptionRenewal: preferences.emailSubscriptionRenewal ?? true,
          emailMarketing: preferences.emailMarketing ?? false,
          smsOrderConfirmation: preferences.smsOrderConfirmation ?? false,
          smsOrderStatusUpdate: preferences.smsOrderStatusUpdate ?? false,
          whatsappOrderUpdate: preferences.whatsappOrderUpdate ?? false,
        })
        .returningAll()
        .executeTakeFirstOrThrow();

      return new Response(
        superjson.stringify({
          success: true,
          preferences: newPrefs,
          message: "Notification preferences created",
        })
      );
    } else {
      const updatedPrefs = await db
        .updateTable("notificationPreferences")
        .set({
          emailOrderConfirmation: preferences.emailOrderConfirmation ?? existingPrefs.emailOrderConfirmation,
          emailOrderStatusUpdate: preferences.emailOrderStatusUpdate ?? existingPrefs.emailOrderStatusUpdate,
          emailPaymentReceipt: preferences.emailPaymentReceipt ?? existingPrefs.emailPaymentReceipt,
          emailPasswordReset: preferences.emailPasswordReset ?? existingPrefs.emailPasswordReset,
          emailLowStockAlert: preferences.emailLowStockAlert ?? existingPrefs.emailLowStockAlert,
          emailSubscriptionRenewal: preferences.emailSubscriptionRenewal ?? existingPrefs.emailSubscriptionRenewal,
          emailMarketing: preferences.emailMarketing ?? existingPrefs.emailMarketing,
          smsOrderConfirmation: preferences.smsOrderConfirmation ?? existingPrefs.smsOrderConfirmation,
          smsOrderStatusUpdate: preferences.smsOrderStatusUpdate ?? existingPrefs.smsOrderStatusUpdate,
          whatsappOrderUpdate: preferences.whatsappOrderUpdate ?? existingPrefs.whatsappOrderUpdate,
          updatedAt: new Date(),
        })
        .where("userId", "=", user.id)
        .where("tenantId", "=", tenantId)
        .returningAll()
        .executeTakeFirstOrThrow();

      return new Response(
        superjson.stringify({
          success: true,
          preferences: updatedPrefs,
          message: "Notification preferences updated",
        })
      );
    }
  } catch (error: any) {
    console.error("Update preferences error:", error);
    return new Response(superjson.stringify({ error: error.message || "Failed to update notification preferences" }), { status: 500 });
  }
}

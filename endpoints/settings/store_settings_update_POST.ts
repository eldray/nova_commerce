import { schema, OutputType } from "./store_settings_update_POST.schema";
import superjson from "superjson";
import { db } from "../../helpers/db";
import { getServerUserSession } from "../../helpers/getServerUserSession";
import { getCurrentTenantId } from "../../helpers/tenantContext";

export async function handle(request: Request) {
  try {
    const user = await getServerUserSession(request);
    if (!user) {
      return new Response(superjson.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    const tenantId = await getCurrentTenantId(request);
    if (!tenantId) {
      return new Response(superjson.stringify({ error: "No store selected" }), { status: 400 });
    }

    const json = superjson.parse(await request.text());
    const input = schema.parse(json);

    const updateData: Record<string, string | null> = {};

    if (input.description !== undefined) {
      updateData.description = input.description || null;
    }
    if (input.customerEmail !== undefined) {
      updateData.customerEmail = input.customerEmail || null;
    }
    if (input.supportPhone !== undefined) {
      updateData.supportPhone = input.supportPhone || null;
    }
    if (input.address !== undefined) {
      updateData.address = input.address || null;
    }

    if (Object.keys(updateData).length === 0) {
      return new Response(
        superjson.stringify({ success: true }),
        { status: 200 }
      );
    }

    await db
      .updateTable("stores")
      .set(updateData)
      .where("id", "=", tenantId)
      .execute();

    await db
      .insertInto("auditLogs")
      .values({
        tenantId,
        actorUserId: user.id,
        action: "store.settings_updated",
        entityType: "store",
        entityId: tenantId,
        metadata: { ...updateData },
      })
      .execute();

    return new Response(superjson.stringify({ success: true } satisfies OutputType));
  } catch (error) {
    console.error("store_settings_update error:", error);
    const message = error instanceof Error ? error.message : "Failed to update store settings";
    return new Response(superjson.stringify({ error: message }), { status: 400 });
  }
}

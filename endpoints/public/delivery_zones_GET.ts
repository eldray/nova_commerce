import superjson from "superjson";
import { OutputType } from "./delivery_zones_GET.schema";
import { db } from "../../helpers/db";

export async function handle(request: Request) {
    try {
        const url = new URL(request.url);
        const tenantId = Number(url.searchParams.get("tenantId"));
        if (!tenantId || Number.isNaN(tenantId)) {
            return new Response(superjson.stringify({ error: "tenantId is required" }), { status: 400 });
        }

        const zones = await db
            .selectFrom("deliveryZones")
            .select(["id", "name", "fee", "freeDeliveryThreshold", "estimatedDaysMin", "estimatedDaysMax"])
            .where("tenantId", "=", tenantId)
            .where("isActive", "=", true)
            .orderBy("fee", "asc")
            .execute();

        return new Response(superjson.stringify({ zones } satisfies OutputType));
    } catch (error) {
        console.error("public delivery zones error:", error);
        const message = error instanceof Error ? error.message : "Failed to load delivery zones";
        return new Response(superjson.stringify({ error: message }), { status: 400 });
    }
}
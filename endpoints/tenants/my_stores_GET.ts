import superjson from "superjson";
import { OutputType } from "./my_stores_GET.schema";
import { getServerUserSession } from "../../helpers/getServerUserSession";
import { getTenantsForUser } from "../../helpers/tenantContext";

export async function handle(request: Request) {
  try {
    const user = await getServerUserSession(request);
    if (!user) {
      return new Response(superjson.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    const rows = await getTenantsForUser(user.id);

    const stores = rows.map((row) => ({
      tenantId: row.tenantId,
      tenantName: row.tenantName,
      tenantSlug: row.tenantSlug,
      tenantStatus: row.tenantStatus,
      role: row.role,
      storeId: row.storeId,
      storeName: row.storeName,
      onboardingStep: row.onboardingStep,
      onboardingCompletedAt: row.onboardingCompletedAt,
      isPublished: row.isPublished,
    }));

    return new Response(superjson.stringify({ stores } satisfies OutputType));
  } catch (error) {
    console.error("my_stores error:", error);
    const message = error instanceof Error ? error.message : "Failed to load stores";
    return new Response(superjson.stringify({ error: message }), { status: 400 });
  }
}

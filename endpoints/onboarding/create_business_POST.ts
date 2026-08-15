import { schema, OutputType } from "./create_business_POST.schema";
import superjson from "superjson";
import { db } from "../../helpers/db";
import { getServerUserSession } from "../../helpers/getServerUserSession";

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "store";
}

async function uniqueSlug(
  base: string,
  exists: (candidate: string) => Promise<boolean>
): Promise<string> {
  let candidate = base;
  let attempt = 0;
  while (await exists(candidate)) {
    attempt += 1;
    candidate = `${base}-${attempt}`;
  }
  return candidate;
}

export async function handle(request: Request) {
  try {
    const user = await getServerUserSession(request);
    if (!user) {
      return new Response(superjson.stringify({ error: "Unauthorized" }), { status: 401 });
    }
    const json = superjson.parse(await request.text());
    const input = schema.parse(json);

    const baseSlug = slugify(input.businessName);

    const result = await db.transaction().execute(async (trx) => {
      const tenantSlug = await uniqueSlug(baseSlug, async (candidate) => {
        const existing = await trx
          .selectFrom("tenants")
          .select("id")
          .where("slug", "=", candidate)
          .executeTakeFirst();
        return !!existing;
      });

      const tenant = await trx
        .insertInto("tenants")
        .values({
          name: input.businessName,
          slug: tenantSlug,
          status: "trial",
          createdByUserId: user.id,
        })
        .returning(["id", "slug"])
        .executeTakeFirstOrThrow();

      const subdomain = await uniqueSlug(baseSlug, async (candidate) => {
        const existing = await trx
          .selectFrom("stores")
          .select("id")
          .where("subdomain", "=", candidate)
          .executeTakeFirst();
        return !!existing;
      });

      const store = await trx
        .insertInto("stores")
        .values({
          tenantId: tenant.id,
          storeName: input.storeName,
          subdomain,
          currency: "GHS",
          currencySymbol: "GH₵",
          whatsappNumber: input.whatsappNumber ?? null,
          onboardingStep: "store_settings",
        })
        .returning(["id", "subdomain"])
        .executeTakeFirstOrThrow();

      await trx
        .insertInto("tenantUsers")
        .values({
          tenantId: tenant.id,
          userId: user.id,
          role: "owner",
          joinedAt: new Date(),
        })
        .execute();

      await trx
        .insertInto("auditLogs")
        .values({
          tenantId: tenant.id,
          actorUserId: user.id,
          action: "tenant.created",
          entityType: "tenant",
          entityId: tenant.id,
          metadata: { businessName: input.businessName },
        })
        .execute();

      return { tenant, store };
    });

    return new Response(
      superjson.stringify({
        tenantId: result.tenant.id,
        tenantSlug: result.tenant.slug,
        storeId: result.store.id,
        subdomain: result.store.subdomain,
      } satisfies OutputType)
    );
  } catch (error) {
    console.error("create_business error:", error);
    const message = error instanceof Error ? error.message : "Failed to create business";
    return new Response(superjson.stringify({ error: message }), { status: 400 });
  }
}

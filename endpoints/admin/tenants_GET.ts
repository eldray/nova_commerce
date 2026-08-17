import { z } from "zod";
import superjson from "superjson";
import { db, sql } from "../../helpers/db";
import { getServerUserSession } from "../../helpers/getServerUserSession";

const schema = z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    status: z.enum(["active", "trial", "suspended", "deleted", "all"]).optional().default("all"),
    search: z.string().optional().default(""),
});

export type OutputType = {
    success: true;
    tenants: unknown[];
    pagination: {
        currentPage: number;
        totalPages: number;
        totalItems: number;
        limit: number;
    };
};

export async function handle(request: Request) {
    try {
        const user = await getServerUserSession(request);
        if (!user || user.role !== "super_admin") {
            return new Response(
                superjson.stringify({ error: "Unauthorized - Super Admin access required" }),
                { status: 403 }
            );
        }

        const url = new URL(request.url);
        const parsed = schema.parse({
            page: url.searchParams.get("page") ?? undefined,
            limit: url.searchParams.get("limit") ?? undefined,
            status: url.searchParams.get("status") ?? undefined,
            search: url.searchParams.get("search") ?? undefined,
        });
        const { page, limit, status, search } = parsed;
        const offset = (page - 1) * limit;

        let countQuery = db
            .selectFrom("tenants")
            .innerJoin("users", "users.id", "tenants.createdByUserId")
            .select((eb) => eb.fn.count<number>("tenants.id").distinct().as("count"));

        let listQuery = db
            .selectFrom("tenants")
            .innerJoin("users", "users.id", "tenants.createdByUserId")
            .leftJoin("stores", "stores.tenantId", "tenants.id")
            .leftJoin("merchantSubscriptions", "merchantSubscriptions.tenantId", "tenants.id")
            .leftJoin("subscriptionPlans", "subscriptionPlans.id", "merchantSubscriptions.planId")
            .select([
                "tenants.id as id",
                "tenants.name as name",
                "tenants.slug as slug",
                "tenants.status as status",
                "tenants.createdAt as createdAt",
                "users.email as ownerEmail",
                "tenants.createdByUserId as ownerId",
                "stores.isPublished as isPublished",
                sql<string>`coalesce(${sql.ref("subscriptionPlans.name")}, 'Free')`.as("planName"),
                sql<string>`coalesce(${sql.ref("merchantSubscriptions.status")}, 'free')`.as("subscriptionStatus"),
            ]);

        if (status !== "all") {
            countQuery = countQuery.where("tenants.status", "=", status);
            listQuery = listQuery.where("tenants.status", "=", status);
        }

        if (search) {
            const term = `%${search}%`;
            countQuery = countQuery.where((eb) =>
                eb.or([eb("tenants.name", "ilike", term), eb("users.email", "ilike", term)])
            );
            listQuery = listQuery.where((eb) =>
                eb.or([eb("tenants.name", "ilike", term), eb("users.email", "ilike", term)])
            );
        }

        const countResult = await countQuery.executeTakeFirst();
        const totalItems = Number(countResult?.count ?? 0);
        const totalPages = Math.ceil(totalItems / limit) || 1;

        const tenantsList = await listQuery
            .orderBy("tenants.createdAt", "desc")
            .limit(limit)
            .offset(offset)
            .execute();

        return new Response(
            superjson.stringify({
                success: true,
                tenants: tenantsList,
                pagination: { currentPage: page, totalPages, totalItems, limit },
            } satisfies OutputType)
        );
    } catch (error) {
        console.error("Error fetching tenants:", error);
        const message = error instanceof Error ? error.message : "Failed to fetch tenants";
        return new Response(superjson.stringify({ error: message }), { status: 500 });
    }
}

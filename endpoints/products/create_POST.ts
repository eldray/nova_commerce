import { schema, OutputType } from "./create_POST.schema";
import superjson from "superjson";
import { db } from "../../helpers/db";
import { getServerUserSession } from "../../helpers/getServerUserSession";
import { requireTenantPermission } from "../../helpers/tenantContext";

function slugify(input: string): string {
    return (
        input
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "")
            .slice(0, 80) || "product"
    );
}

export async function handle(request: Request) {
    try {
        const user = await getServerUserSession(request);
        if (!user) {
            return new Response(superjson.stringify({ error: "Unauthorized" }), { status: 401 });
        }
        const json = superjson.parse(await request.text());
        const input = schema.parse(json);

        // Enforces tenant isolation + RBAC: throws unless the caller is a member of
        // input.tenantId with products.create permission.
        await requireTenantPermission(user.id, input.tenantId, "products.create");

        if (input.categoryId) {
            const category = await db
                .selectFrom("categories")
                .select("id")
                .where("id", "=", input.categoryId)
                .where("tenantId", "=", input.tenantId)
                .executeTakeFirst();
            if (!category) {
                return new Response(
                    superjson.stringify({ error: "Category not found for this store" }),
                    { status: 400 }
                );
            }
        }

        const baseSlug = slugify(input.name);
        let slug = baseSlug;
        let attempt = 0;
        while (
            await db
                .selectFrom("products")
                .select("id")
                .where("tenantId", "=", input.tenantId)
                .where("slug", "=", slug)
                .executeTakeFirst()
        ) {
            attempt += 1;
            slug = `${baseSlug}-${attempt}`;
        }

        const result = await db.transaction().execute(async (trx) => {
            const product = await trx
                .insertInto("products")
                .values({
                    tenantId: input.tenantId,
                    categoryId: input.categoryId ?? null,
                    name: input.name,
                    slug,
                    description: input.description ?? null,
                    sku: input.sku ?? null,
                    status: input.status,
                    price: input.price.toFixed(2),
                    salePrice: input.salePrice ? input.salePrice.toFixed(2) : null,
                    stockQuantity: input.stockQuantity,
                    lowStockThreshold: input.lowStockThreshold,
                })
                .returning(["id", "slug"])
                .executeTakeFirstOrThrow();

            if (input.imageUrl) {
                await trx
                    .insertInto("productImages")
                    .values({ productId: product.id, url: input.imageUrl, position: 0 })
                    .execute();
            }

            if (input.stockQuantity > 0) {
                await trx
                    .insertInto("inventoryMovements")
                    .values({
                        tenantId: input.tenantId,
                        productId: product.id,
                        type: "restock",
                        quantityChange: input.stockQuantity,
                        reason: "Initial stock on product creation",
                        createdByUserId: user.id,
                    })
                    .execute();
            }

            await trx
                .insertInto("auditLogs")
                .values({
                    tenantId: input.tenantId,
                    actorUserId: user.id,
                    action: "product.created",
                    entityType: "product",
                    entityId: product.id,
                    metadata: { name: input.name },
                })
                .execute();

            return product;
        });

        return new Response(superjson.stringify({ id: result.id, slug: result.slug } satisfies OutputType));
    } catch (error) {
        console.error("create_product error:", error);
        const message = error instanceof Error ? error.message : "Failed to create product";
        return new Response(superjson.stringify({ error: message }), { status: 400 });
    }
}
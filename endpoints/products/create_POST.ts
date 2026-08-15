import { schema, OutputType } from "./create_POST.schema";
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
            return new Response(JSON.stringify({ error: "Unauthorized" }), { 
                status: 401,
                headers: { "Content-Type": "application/json" }
            });
        }
        
        const json = await request.json();
        const input = schema.parse(json);

        // Enforces tenant isolation + RBAC: throws unless the caller is a member of
        // the user's current tenant with products.create permission.
        const tenantId = user.tenantId;
        if (!tenantId) {
            return new Response(JSON.stringify({ error: "No active store selected" }), { 
                status: 400,
                headers: { "Content-Type": "application/json" }
            });
        }
        
        await requireTenantPermission(user.id, tenantId, "products.create");

        if (input.categoryId) {
            const category = await db
                .selectFrom("categories")
                .select("id")
                .where("id", "=", input.categoryId)
                .where("tenantId", "=", tenantId)
                .executeTakeFirst();
            if (!category) {
                return new Response(
                    JSON.stringify({ error: "Category not found for this store" }),
                    { 
                        status: 400,
                        headers: { "Content-Type": "application/json" }
                    }
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
                .where("tenantId", "=", tenantId)
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
                    tenantId: tenantId,
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
                    images: input.images && input.images.length > 0 ? JSON.stringify(input.images) : null,
                    primaryImage: input.primaryImage ?? null,
                })
                .returning(["id", "slug"])
                .executeTakeFirstOrThrow();

            // Insert multiple product images if provided
            if (input.images && input.images.length > 0) {
                const imageInserts = input.images.map((url, index) => ({
                    productId: product.id,
                    url: url,
                    position: index,
                    isPrimary: index === 0,
                }));
                
                await trx
                    .insertInto("productImages")
                    .values(imageInserts)
                    .execute();
            } else if (input.primaryImage) {
                await trx
                    .insertInto("productImages")
                    .values({ 
                        productId: product.id, 
                        url: input.primaryImage, 
                        position: 0,
                        isPrimary: true 
                    })
                    .execute();
            }

            if (input.stockQuantity > 0) {
                await trx
                    .insertInto("inventoryMovements")
                    .values({
                        tenantId: tenantId,
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
                    tenantId: tenantId,
                    actorUserId: user.id,
                    action: "product.created",
                    entityType: "product",
                    entityId: product.id,
                    metadata: { name: input.name, images: input.images?.length || 0 },
                })
                .execute();

            return product;
        });

        return new Response(JSON.stringify({ id: result.id, slug: result.slug } satisfies OutputType), {
            status: 200,
            headers: { "Content-Type": "application/json" }
        });
    } catch (error) {
        console.error("create_product error:", error);
        const message = error instanceof Error ? error.message : "Failed to create product";
        return new Response(JSON.stringify({ error: message }), { 
            status: 400,
            headers: { "Content-Type": "application/json" }
        });
    }
}
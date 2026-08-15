import superjson from "superjson";
import { OutputType } from "./list_GET.schema";
import { db } from "../../helpers/db";
import { getServerUserSession } from "../../helpers/getServerUserSession";
import { requireTenantPermission } from "../../helpers/tenantContext";

export async function handle(request: Request) {
    try {
        const user = await getServerUserSession(request);
        if (!user) {
            return new Response(superjson.stringify({ error: "Unauthorized" }), { status: 401 });
        }
        const url = new URL(request.url);
        const tenantId = Number(url.searchParams.get("tenantId"));
        if (!tenantId || Number.isNaN(tenantId)) {
            return new Response(superjson.stringify({ error: "tenantId is required" }), { status: 400 });
        }

        // Enforces tenant isolation: throws if the caller isn't a member of this tenant,
        // or lacks products.view. Every query below is scoped to this tenantId only.
        await requireTenantPermission(user.id, tenantId, "products.view");

        const rows = await db
            .selectFrom("products")
            .leftJoin("categories", "categories.id", "products.categoryId")
            .leftJoin("productImages", (join) =>
                join.onRef("productImages.productId", "=", "products.id").on("productImages.position", "=", 0)
            )
            .select([
                "products.id",
                "products.name",
                "products.slug",
                "products.sku",
                "products.status",
                "products.price",
                "products.salePrice",
                "products.stockQuantity",
                "products.lowStockThreshold",
                "products.createdAt",
                "categories.name as categoryName",
                "productImages.url as imageUrl",
            ])
            .where("products.tenantId", "=", tenantId)
            .orderBy("products.createdAt", "desc")
            .execute();

        const products = rows.map((row) => ({
            id: row.id,
            name: row.name,
            slug: row.slug,
            sku: row.sku,
            status: row.status,
            price: row.price,
            salePrice: row.salePrice,
            stockQuantity: row.stockQuantity,
            lowStockThreshold: row.lowStockThreshold,
            categoryName: row.categoryName,
            imageUrl: row.imageUrl,
            createdAt: row.createdAt,
        }));

        return new Response(superjson.stringify({ products } satisfies OutputType));
    } catch (error) {
        console.error("products list error:", error);
        const message = error instanceof Error ? error.message : "Failed to load products";
        return new Response(superjson.stringify({ error: message }), { status: 400 });
    }
}
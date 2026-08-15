import superjson from "superjson";
import { OutputType } from "./products_GET.schema";
import { db } from "../../helpers/db";

export async function handle(request: Request) {
    try {
        const url = new URL(request.url);
        const tenantId = Number(url.searchParams.get("tenantId"));
        if (!tenantId || Number.isNaN(tenantId)) {
            return new Response(superjson.stringify({ error: "tenantId is required" }), { status: 400 });
        }

        const rows = await db
            .selectFrom("products")
            .leftJoin("categories", "categories.id", "products.categoryId")
            .leftJoin("productImages", "productImages.productId", "products.id")
            .select([
                "products.id",
                "products.slug",
                "products.name",
                "products.price",
                "products.salePrice",
                "products.stockQuantity",
                "categories.name as categoryName",
                "productImages.url as imageUrl",
            ])
            .where("products.tenantId", "=", tenantId)
            .where("products.status", "=", "active")
            .orderBy("products.createdAt", "desc")
            .execute();

        // Distinct by product id in case multiple images exist
        const uniqueProducts = Array.from(
            rows.reduce((map, item) => {
                if (!map.has(item.id)) {
                    map.set(item.id, item);
                }
                return map;
            }, new Map<number, typeof rows[0]>()).values()
        );

        return new Response(superjson.stringify({ products: uniqueProducts } satisfies OutputType));
    } catch (error) {
        console.error("public products error:", error);
        const message = error instanceof Error ? error.message : "Failed to load products";
        return new Response(superjson.stringify({ error: message }), { status: 400 });
    }
}
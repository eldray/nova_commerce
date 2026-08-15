import superjson from "superjson";
import { ProductStatus } from "../../helpers/schema";

export type ProductListItem = {
    id: number;
    name: string;
    slug: string;
    sku: string | null;
    status: ProductStatus;
    price: string;
    salePrice: string | null;
    stockQuantity: number;
    lowStockThreshold: number;
    categoryName: string | null;
    imageUrl: string | null;
    createdAt: Date;
};

export type OutputType = {
    products: ProductListItem[];
};

export const getProducts = async (
    tenantId: number,
    init?: RequestInit
): Promise<OutputType> => {
    const result = await fetch(`/_api/products?tenantId=${tenantId}`, {
        method: "GET",
        ...init,
        credentials: "include",
    });
    if (!result.ok) {
        const errorObject = superjson.parse<{ error: string }>(await result.text());
        throw new Error(errorObject.error);
    }
    return superjson.parse<OutputType>(await result.text());
};
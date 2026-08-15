import superjson from "superjson";

export type PublicProduct = {
    id: number;
    slug: string;
    name: string;
    price: string;
    salePrice: string | null;
    stockQuantity: number;
    imageUrl: string | null;
    categoryName: string | null;
};

export type OutputType = {
    products: PublicProduct[];
};

export const getPublicProducts = async (
    tenantId: number,
    init?: RequestInit
): Promise<OutputType> => {
    const result = await fetch(`/_api/public/products?tenantId=${tenantId}`, {
        method: "GET",
        ...init,
    });
    if (!result.ok) {
        const errorObject = superjson.parse<{ error: string }>(await result.text());
        throw new Error(errorObject.error);
    }
    return superjson.parse<OutputType>(await result.text());
};
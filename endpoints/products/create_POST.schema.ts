import { z } from "zod";
import superjson from "superjson";

export const schema = z.object({
    tenantId: z.number().int().positive(),
    name: z.string().min(2, "Product name is required").max(200),
    description: z.string().max(5000).optional(),
    sku: z.string().max(60).optional(),
    price: z.number().positive("Price must be greater than 0"),
    salePrice: z.number().positive().optional(),
    stockQuantity: z.number().int().min(0).default(0),
    lowStockThreshold: z.number().int().min(0).default(5),
    categoryId: z.number().int().positive().optional(),
    status: z.enum(["draft", "active", "archived"]).default("draft"),
    imageUrl: z.string().url().optional(),
});

export type InputType = z.infer<typeof schema>;

export type OutputType = {
    id: number;
    slug: string;
};

export const postCreateProduct = async (
    body: InputType,
    init?: RequestInit
): Promise<OutputType> => {
    const validatedInput = schema.parse(body);
    const result = await fetch(`/_api/products`, {
        method: "POST",
        body: superjson.stringify(validatedInput),
        ...init,
        headers: {
            "Content-Type": "application/json",
            ...(init?.headers ?? {}),
        },
        credentials: "include",
    });
    if (!result.ok) {
        const errorObject = superjson.parse<{ error: string }>(await result.text());
        throw new Error(errorObject.error);
    }
    return superjson.parse<OutputType>(await result.text());
};
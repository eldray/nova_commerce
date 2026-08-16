import { z } from "zod";
import superjson from "superjson";

export const schema = z.object({
    tenantId: z.number().int().positive(),
    items: z
        .array(
            z.object({
                productId: z.number().int().positive(),
                quantity: z.number().int().positive(),
            })
        )
        .min(1, "Cart is empty"),
    deliveryZoneId: z.number().int().positive().optional(),
    recipientName: z.string().min(2, "Recipient name is required"),
    recipientPhone: z.string().min(9, "A valid phone number is required"),
    deliveryAddress: z.string().min(5, "Delivery address is required"),
    deliveryCity: z.string().min(2, "City is required"),
    guestEmail: z.string().email().optional(),
    notes: z.string().max(500).optional(),
    couponCode: z.string().max(50).optional(),
});

export type InputType = z.infer<typeof schema>;

export type OutputType = {
    orderId: number;
    orderNumber: string;
    total: string;
    discountAmount: string;
    couponCode?: string;
};

export const postCreateOrder = async (
    body: InputType,
    init?: RequestInit
): Promise<OutputType> => {
    const validatedInput = schema.parse(body);
    const result = await fetch(`/_api/checkout/create-order`, {
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
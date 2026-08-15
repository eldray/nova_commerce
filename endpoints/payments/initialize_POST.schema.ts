import { z } from "zod";
import superjson from "superjson";

export const schema = z.object({
    orderId: z.number().int().positive(),
});

export type InputType = z.infer<typeof schema>;

export type OutputType =
    | { available: true; authorizationUrl: string; provider: "paystack" | "hubtel" }
    | { available: false; reason: string };

export const postInitializePayment = async (
    body: InputType,
    init?: RequestInit
): Promise<OutputType> => {
    const validatedInput = schema.parse(body);
    const result = await fetch(`/_api/payments/initialize`, {
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
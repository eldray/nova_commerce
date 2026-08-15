import { z } from "zod";
import superjson from "superjson";

export const schema = z.object({
  businessName: z.string().min(2, "Business name is required").max(120),
  storeName: z.string().min(2, "Store name is required").max(120),
  whatsappNumber: z.string().min(9).max(20).optional(),
});

export type InputType = z.infer<typeof schema>;

export type OutputType = {
  tenantId: number;
  tenantSlug: string;
  storeId: number;
  subdomain: string;
};

export const postCreateBusiness = async (
  body: InputType,
  init?: RequestInit
): Promise<OutputType> => {
  const validatedInput = schema.parse(body);
  const result = await fetch(`/_api/onboarding/create-business`, {
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

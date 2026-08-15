import superjson from "superjson";
import { z } from "zod";

export const schema = z.object({
  productId: z.string().uuid(),
});

export type InputType = z.infer<typeof schema>;

export type OutputType = {
  success: boolean;
  action: "added" | "removed";
  wishlistId?: string;
};

export const toggleWishlistItem = async (
  input: InputType,
  init?: RequestInit
): Promise<OutputType> => {
  const result = await fetch(`/_api/wishlist/toggle`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: superjson.stringify(input),
    ...init,
  });
  if (!result.ok) {
    const errorObject = superjson.parse<{ error: string }>(await result.text());
    throw new Error(errorObject.error);
  }
  return superjson.parse<OutputType>(await result.text());
};

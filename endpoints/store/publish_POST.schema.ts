import { z } from "zod";
import superjson from "superjson";

export const schema = z.object({
  publish: z.boolean().default(true),
});

export type InputType = z.infer<typeof schema>;

export type OutputType = {
  success: boolean;
  store: {
    id: number;
    isPublished: boolean;
    storeName: string;
    subdomain: string;
  };
};

export const postPublishStore = async (
  body: InputType,
  init?: RequestInit
): Promise<OutputType> => {
  const validatedInput = schema.parse(body);
  const result = await fetch(`/_api/store/publish`, {
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

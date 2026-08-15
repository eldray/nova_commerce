import superjson from "superjson";
import { z } from "zod";
import { User } from "../../helpers/User";

export const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  displayName: z.string().min(2),
});

export type InputType = z.infer<typeof schema>;

export type OutputType = {
  user: User;
};

export const postRegisterWithPassword = async (
  input: InputType,
  init?: RequestInit
): Promise<OutputType> => {
  const result = await fetch(`/_api/auth/register-with-password`, {
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

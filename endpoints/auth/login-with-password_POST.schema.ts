import { z } from "zod";
import { User } from "../../helpers/User";

export const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export type InputType = z.infer<typeof schema>;

export type OutputType = {
  user: User;
};

export const postLoginWithPassword = async (
  input: InputType,
  init?: RequestInit
): Promise<OutputType> => {
  const result = await fetch(`/_api/auth/login-with-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
    credentials: 'include', // Important: include cookies
    ...init,
  });
  
  if (!result.ok) {
    const errorObject = await result.json();
    throw new Error(errorObject.error || "Login failed");
  }
  
  return result.json();
};

import superjson from "superjson";
import { User } from "../../helpers/User";

export type OutputType = {
  user: User | null;
};

export const getSession = async (init?: RequestInit): Promise<OutputType> => {
  const result = await fetch(`/_api/auth/session`, {
    method: "GET",
    ...init,
  });
  if (!result.ok) {
    const errorObject = superjson.parse<{ error: string }>(await result.text());
    throw new Error(errorObject.error);
  }
  return superjson.parse<OutputType>(await result.text());
};

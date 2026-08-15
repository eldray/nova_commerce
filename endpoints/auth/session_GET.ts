import superjson from "superjson";
import { OutputType } from "./session_GET.schema";
import { getServerUserSession } from "../../helpers/getServerUserSession";

export async function handle(request: Request) {
  try {
    const user = await getServerUserSession(request);
    return new Response(superjson.stringify({ user } satisfies OutputType));
  } catch (error) {
    console.error("session GET error:", error);
    return new Response(superjson.stringify({ user: null } satisfies OutputType));
  }
}

import superjson from "superjson";
import { OutputType } from "./logout_POST.schema";
import { clearSessionCookie, getSessionTokenFromRequest } from "../../helpers/getSetServerSession";
import { db } from "../../helpers/db";

export async function handle(request: Request) {
  try {
    const token = getSessionTokenFromRequest(request);
    if (token) {
      await db.deleteFrom("sessions").where("id", "=", token).execute();
    }
    return new Response(superjson.stringify({ success: true } satisfies OutputType), {
      headers: {
        "Set-Cookie": clearSessionCookie(),
      },
    });
  } catch (error) {
    console.error("logout error:", error);
    return new Response(superjson.stringify({ success: true } satisfies OutputType), {
      headers: {
        "Set-Cookie": clearSessionCookie(),
      },
    });
  }
}

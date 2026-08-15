import superjson from "superjson";
import { nanoid } from "nanoid";
import { schema, OutputType } from "./login_with_password_POST.schema";
import { db } from "../../helpers/db";
import { verifyPassword } from "../../helpers/generatePasswordHash";
import { createSessionCookie } from "../../helpers/getSetServerSession";
import { User } from "../../helpers/User";

export async function handle(request: Request) {
  try {
    const json = superjson.parse(await request.text());
    const input = schema.parse(json);

    const user = await db
      .selectFrom("users")
      .selectAll()
      .where("email", "=", input.email.toLowerCase())
      .executeTakeFirst();

    if (!user) {
      return new Response(superjson.stringify({ error: "Invalid email or password" }), { status: 400 });
    }

    const userPassword = await db
      .selectFrom("userPasswords")
      .selectAll()
      .where("userId", "=", user.id)
      .executeTakeFirst();

    if (!userPassword) {
      return new Response(superjson.stringify({ error: "Invalid email or password" }), { status: 400 });
    }

    const isValid = await verifyPassword(input.password, userPassword.passwordHash);
    if (!isValid) {
      return new Response(superjson.stringify({ error: "Invalid email or password" }), { status: 400 });
    }

    const token = `sess_${nanoid(32)}`;
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await db
      .insertInto("sessions")
      .values({
        id: token,
        userId: user.id,
        expiresAt,
      })
      .execute();

    const userPayload: User = {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      role: user.role as User["role"],
    };

    return new Response(superjson.stringify({ user: userPayload } satisfies OutputType), {
      status: 200,
      headers: {
        "Set-Cookie": createSessionCookie(token),
      },
    });
  } catch (error) {
    console.error("login error:", error);
    const message = error instanceof Error ? error.message : "Failed to log in";
    return new Response(superjson.stringify({ error: message }), { status: 400 });
  }
}

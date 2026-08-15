import superjson from "superjson";
import { nanoid } from "nanoid";
import { schema, OutputType } from "./register_with_password_POST.schema";
import { db } from "../../helpers/db";
import { hashPassword } from "../../helpers/generatePasswordHash";
import { createSessionCookie } from "../../helpers/getSetServerSession";
import { User } from "../../helpers/User";

export async function handle(request: Request) {
  try {
    const json = superjson.parse(await request.text());
    const input = schema.parse(json);

    const existingUser = await db
      .selectFrom("users")
      .selectAll()
      .where("email", "=", input.email.toLowerCase())
      .executeTakeFirst();

    if (existingUser) {
      return new Response(superjson.stringify({ error: "An account with this email already exists" }), { status: 400 });
    }

    const passwordHash = await hashPassword(input.password);

    const user = await db
      .insertInto("users")
      .values({
        email: input.email.toLowerCase(),
        displayName: input.displayName,
        role: "user",
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    await db
      .insertInto("userPasswords")
      .values({
        userId: user.id,
        passwordHash,
      })
      .execute();

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
    console.error("register error:", error);
    const message = error instanceof Error ? error.message : "Failed to register account";
    return new Response(superjson.stringify({ error: message }), { status: 400 });
  }
}

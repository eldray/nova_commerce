import { nanoid } from "nanoid";
import { schema } from "./login-with-password_POST.schema";
import { db } from "../../helpers/db";
import { createSessionCookie } from "../../helpers/getSetServerSession";
import bcrypt from 'bcryptjs';

export async function handle(request: Request) {
  try {
    const body = await request.json();
    console.log('Parsed body:', body);
    
    // Trim whitespace from email and password
    const input = schema.parse({
      email: body.email.trim(),
      password: body.password.trim()
    });

    console.log('Login attempt for:', input.email);

    // Find user by email
    const user = await db
      .selectFrom("users")
      .selectAll()
      .where("email", "=", input.email.toLowerCase())
      .executeTakeFirst();

    if (!user) {
      console.log('User not found:', input.email);
      return new Response(
        JSON.stringify({ error: "Invalid email or password" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log('User found:', user.id, user.email, user.role);

    // Get user's password from user_passwords table
    const userPassword = await db
      .selectFrom("user_passwords")
      .selectAll()
      .where("user_id", "=", user.id)
      .executeTakeFirst();

    if (!userPassword) {
      console.log('Password not found for user:', user.id);
      return new Response(
        JSON.stringify({ error: "Invalid email or password" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log('Password found, verifying...');

    // Verify password using bcrypt
    let isValid = false;
    try {
      isValid = await bcrypt.compare(input.password, userPassword.password_hash);
    } catch (error) {
      console.error('Password verification error:', error);
      return new Response(
        JSON.stringify({ error: "Invalid email or password" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!isValid) {
      console.log('Invalid password for user:', user.email);
      return new Response(
        JSON.stringify({ error: "Invalid email or password" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log('Password verified, creating session...');

    // Create session token
    const token = `sess_${nanoid(32)}`;
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    // Insert session - using snake_case column names
    await db
      .insertInto("sessions")
      .values({
        id: token,
        user_id: user.id,
        expires_at: expiresAt,
      })
      .execute();

    console.log('Session created:', token);

    // Prepare user payload
    const userPayload = {
      id: user.id,
      email: user.email,
      displayName: user.display_name,
      avatarUrl: user.avatar_url,
      role: user.role,
    };

    console.log('Login successful for:', user.email);

    // Create the cookie using the helper function (which uses nova_session)
    const cookie = createSessionCookie(token);
    console.log('Setting cookie:', cookie);

    // Return response with cookie
    return new Response(
      JSON.stringify({ user: userPayload }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Set-Cookie": cookie,
        },
      }
    );

  } catch (error) {
    console.error("Login error:", error);
    const message = error instanceof Error ? error.message : "Failed to log in";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }
}

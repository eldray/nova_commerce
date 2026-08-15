/**
 * Script to create a super admin user for Nova Commerce Platform
 * Run this once to create the platform administrator account
 * 
 * Usage: bun run scripts/create-super-admin.ts
 */

import { db } from "../helpers/db";
import { hashPassword } from "../helpers/generatePasswordHash";

async function createSuperAdmin() {
  const email = "admin@novacommerce.com";
  const password = "NovaAdmin2024!";
  const displayName = "Platform Administrator";

  try {
    // Check if super admin already exists
    const existing = await db
      .selectFrom("users")
      .selectAll()
      .where("email", "=", email)
      .executeTakeFirst();

    if (existing) {
      console.log(`✅ Super admin already exists: ${email}`);
      return;
    }

    // Create super admin user
    const user = await db
      .insertInto("users")
      .values({
        email: email.toLowerCase(),
        displayName: displayName,
        role: "super_admin",
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    // Hash password and insert
    const passwordHash = await hashPassword(password);
    
    await db
      .insertInto("userPasswords")
      .values({
        userId: user.id,
        passwordHash: passwordHash,
      })
      .execute();

    console.log(`
╔════════════════════════════════════════════════════════╗
║     ✅ SUPER ADMIN CREATED SUCCESSFULLY                ║
╠════════════════════════════════════════════════════════╣
║  Email:    ${email.padEnd(37)}║
║  Password: ${password.padEnd(37)}║
║                                                      ║
║  ⚠️  CHANGE THIS PASSWORD IMMEDIATELY IN PRODUCTION   ║
║  ⚠️  NEVER COMMIT THESE CREDENTIALS                   ║
╚════════════════════════════════════════════════════════╝
    `);

  } catch (error) {
    console.error("❌ Failed to create super admin:", error);
    process.exit(1);
  }
}

createSuperAdmin();

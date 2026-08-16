/**
 * Script to seed the database with demo data for Nova Commerce Platform
 * Run this after migrations to populate initial data
 * 
 * Usage: npm run db:seed
 */

import { db } from "../helpers/db";
import { hashPassword } from "../helpers/generatePasswordHash";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runSQLFile(filePath: string) {
  const sql = readFileSync(filePath, "utf-8");
  const statements = sql
    .split(";")
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith("--"));

  for (const statement of statements) {
    try {
      await db.executeQuery(statement);
    } catch (error) {
      console.warn(`Warning executing statement:`, error);
    }
  }
}

async function seedDemoData() {
  try {
    console.log("🌱 Starting demo data seeding...\n");

    // Check if demo store already exists
    const existingStore = await db
      .selectFrom("stores")
      .selectAll()
      .where("store_name", "=", "Nova Fashion Ghana")
      .executeTakeFirst();

    if (existingStore) {
      console.log("⚠️  Demo data already exists. Skipping seed.\n");
      console.log("💡 To reset and re-seed, run: npm run db:reset\n");
      return;
    }

    // Read and execute the seed SQL file
    const seedFilePath = join(__dirname, "../database/004_seed_demo_data.sql");
    console.log(`📄 Reading seed file: ${seedFilePath}`);
    
    await runSQLFile(seedFilePath);

    console.log(`
╔════════════════════════════════════════════════════════╗
║     ✅ DEMO DATA SEEDED SUCCESSFULLY                   ║
╠════════════════════════════════════════════════════════╣
║                                                      ║
║  Demo Store: Nova Fashion Ghana                      ║
║  Demo User: admin@novafashion.com                    ║
║  Password: password123                               ║
║                                                      ║
║  Categories: Women's Fashion, Men's Wear,            ║
║              Accessories, Footwear                   ║
║                                                      ║
║  Products: Multiple demo products seeded             ║
║                                                      ║
╚════════════════════════════════════════════════════════╝
    `);

  } catch (error) {
    console.error("❌ Failed to seed demo data:", error);
    process.exit(1);
  }
}

seedDemoData();

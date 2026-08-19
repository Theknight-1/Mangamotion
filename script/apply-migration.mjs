import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { Pool } from "pg";

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function run() {
  const sqlPath = path.join(process.cwd(), "drizzle", "0009_dapper_nehzno.sql");
  const sql = fs.readFileSync(sqlPath, "utf-8");
  
  console.log("Applying migration 0009_dapper_nehzno.sql...");
  const statements = sql
    .split("--> statement-breakpoint")
    .map((s) => s.trim())
    .filter(Boolean);

  const client = await pool.connect();
  try {
    for (const statement of statements) {
      console.log("Executing:", statement.substring(0, 60) + "...");
      await client.query(statement);
    }
    console.log("✓ Migration applied successfully!");
  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    client.release();
    await pool.end();
  }
}

run();

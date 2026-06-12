import { config } from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { resolve } from "node:path";
import postgres from "postgres";

config({ path: resolve(import.meta.dirname, "../../../.env") });

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is not set");

const client = postgres(url, { onnotice: () => {} });
const db = drizzle(client);

console.log("Applying migrations...");
await migrate(db, { migrationsFolder: resolve(import.meta.dirname, "../drizzle") });
console.log("Migrations applied successfully.");

await client.end();

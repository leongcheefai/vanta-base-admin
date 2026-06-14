import { resolve } from "node:path";
import { generateRandomString, hashPassword } from "better-auth/crypto";
import { config } from "dotenv";
import postgres from "postgres";

config({ path: resolve(import.meta.dirname, "../../../.env") });

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is not set");

const args = process.argv.slice(2);
const emailFlag = args.indexOf("--email");
const passwordFlag = args.indexOf("--password");

if (emailFlag === -1 || passwordFlag === -1) {
  console.error("Usage: node scripts/seed.ts --email <email> --password <password>");
  process.exit(1);
}

const email = args[emailFlag + 1];
const password = args[passwordFlag + 1];

if (!email || !password) {
  console.error("--email and --password values are required");
  process.exit(1);
}

if (password.length < 8) {
  console.error("Password must be at least 8 characters");
  process.exit(1);
}

const sql = postgres(url, { onnotice: () => {} });

const [existing] = await sql`SELECT id FROM "user" WHERE email = ${email} LIMIT 1`;

if (existing) {
  console.log(`User ${email} already exists. Skipping.`);
  await sql.end();
  process.exit(0);
}

const now = new Date();
const userId = generateRandomString(32);
const hashed = await hashPassword(password);

await sql`
  INSERT INTO "user" (id, name, email, email_verified, role, created_at, updated_at)
  VALUES (${userId}, ${email.split("@")[0]}, ${email}, true, 'admin', ${now}, ${now})
`;

await sql`
  INSERT INTO account (id, account_id, provider_id, user_id, password, created_at, updated_at)
  VALUES (${generateRandomString(32)}, ${userId}, 'credential', ${userId}, ${hashed}, ${now}, ${now})
`;

console.log(`Admin user created: ${email}`);

await sql.end();

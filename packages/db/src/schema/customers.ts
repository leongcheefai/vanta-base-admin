import { sql } from "drizzle-orm";
import { pgEnum, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { user } from "./auth";

export const customerStatusEnum = pgEnum("customer_status", ["active", "inactive"]);

export const customer = pgTable(
	"customer",
	{
		id: text("id").primaryKey(),
		firstName: text("first_name"),
		lastName: text("last_name"),
		name: text("name").notNull(),
		email: text("email"),
		phone: text("phone"),
		company: text("company"),
		notes: text("notes"),
		status: customerStatusEnum("status").notNull().default("active"),
		createdBy: text("created_by").references(() => user.id, { onDelete: "set null" }),
		createdAt: timestamp("created_at").notNull().defaultNow(),
		updatedAt: timestamp("updated_at").notNull().defaultNow(),
		deletedAt: timestamp("deleted_at"),
	},
	(t) => [
		uniqueIndex("customer_email_active_unique").on(t.email).where(sql`${t.deletedAt} is null`),
	],
);

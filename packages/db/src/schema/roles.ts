import { boolean, pgTable, primaryKey, text, timestamp } from "drizzle-orm/pg-core";

export const roles = pgTable("roles", {
	id: text("id").primaryKey(),
	slug: text("slug").notNull().unique(),
	name: text("name").notNull(),
	isSystem: boolean("is_system").notNull().default(false),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const rolePermissions = pgTable(
	"role_permissions",
	{
		roleId: text("role_id")
			.notNull()
			.references(() => roles.id, { onDelete: "cascade" }),
		permission: text("permission").notNull(),
	},
	(table) => [primaryKey({ columns: [table.roleId, table.permission] })],
);

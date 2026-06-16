import { index, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { user } from "./auth";

export const auditLog = pgTable(
  "audit_log",
  {
    id: text("id").primaryKey(),
    action: text("action").notNull(),
    actorId: text("actor_id")
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    targetType: text("target_type").notNull(),
    targetId: text("target_id").notNull(),
    metadata: jsonb("metadata")
      .notNull()
      .$type<{ before?: unknown; after?: unknown; reason?: string }>(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("audit_log_created_at_idx").on(table.createdAt),
    index("audit_log_actor_id_idx").on(table.actorId),
    index("audit_log_target_idx").on(table.targetType, table.targetId),
    index("audit_log_action_idx").on(table.action),
  ],
);

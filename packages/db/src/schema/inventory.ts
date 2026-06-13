import { integer, numeric, pgEnum, pgTable, text, timestamp, unique } from "drizzle-orm/pg-core";
import { user } from "./auth";

export const stockMovementTypeEnum = pgEnum("stock_movement_type", [
  "restock",
  "sale",
  "adjustment",
  "return",
  "damage",
  "loss",
]);

export const inventoryCategory = pgTable("inventory_category", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const inventoryProduct = pgTable(
  "inventory_product",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    categoryId: text("category_id").references(() => inventoryCategory.id, {
      onDelete: "set null",
    }),
    name: text("name").notNull(),
    sku: text("sku").notNull(),
    quantity: integer("quantity").notNull().default(0),
    price: numeric("price", { precision: 12, scale: 2 }).notNull().default("0"),
    reorderPoint: integer("reorder_point"),
    description: text("description"),
    imageUrl: text("image_url"),
    deletedAt: timestamp("deleted_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [unique().on(t.userId, t.sku)],
);

export const inventoryStockMovement = pgTable("inventory_stock_movement", {
  id: text("id").primaryKey(),
  productId: text("product_id")
    .notNull()
    .references(() => inventoryProduct.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  type: stockMovementTypeEnum("type").notNull(),
  delta: integer("delta").notNull(),
  notes: text("notes"),
  reference: text("reference"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

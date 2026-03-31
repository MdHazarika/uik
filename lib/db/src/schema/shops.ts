import { pgTable, serial, text, integer, numeric, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const shopsTable = pgTable("shops", {
  id: serial("id").primaryKey(),
  ownerId: integer("owner_id").notNull().references(() => usersTable.id),
  name: text("name").notNull(),
  description: text("description"),
  city: text("city").notNull(),
  area: text("area").notNull(),
  address: text("address"),
  phone: text("phone"),
  images: text("images").array().notNull().default([]),
  openTime: text("open_time").notNull().default("09:00"),
  closeTime: text("close_time").notNull().default("20:00"),
  rating: numeric("rating", { precision: 3, scale: 2 }).notNull().default("0"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertShopSchema = createInsertSchema(shopsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertShop = z.infer<typeof insertShopSchema>;
export type Shop = typeof shopsTable.$inferSelect;

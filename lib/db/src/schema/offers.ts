import { pgTable, serial, text, integer, boolean, numeric, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const discountTypeEnum = pgEnum("discount_type", ["percentage", "fixed"]);

export const offersTable = pgTable("offers", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  description: text("description").notNull(),
  discountType: discountTypeEnum("discount_type").notNull(),
  discountValue: numeric("discount_value", { precision: 10, scale: 2 }).notNull(),
  minBookingAmount: numeric("min_booking_amount", { precision: 10, scale: 2 }).notNull().default("0"),
  maxDiscount: numeric("max_discount", { precision: 10, scale: 2 }),
  validFrom: timestamp("valid_from").notNull().defaultNow(),
  validUntil: timestamp("valid_until"),
  maxUsage: integer("max_usage"),
  currentUsage: integer("current_usage").notNull().default(0),
  isFirstTimeOnly: boolean("is_first_time_only").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertOfferSchema = createInsertSchema(offersTable).omit({ id: true, createdAt: true });
export type InsertOffer = z.infer<typeof insertOfferSchema>;
export type Offer = typeof offersTable.$inferSelect;

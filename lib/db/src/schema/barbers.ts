import { pgTable, serial, text, integer, boolean, numeric, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { shopsTable } from "./shops";

export const barbersTable = pgTable("barbers", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  shopId: integer("shop_id").references(() => shopsTable.id),
  experience: integer("experience").notNull().default(0),
  bio: text("bio"),
  city: text("city").notNull(),
  area: text("area").notNull(),
  address: text("address"),
  latitude: numeric("latitude", { precision: 10, scale: 7 }),
  longitude: numeric("longitude", { precision: 10, scale: 7 }),
  homeService: boolean("home_service").notNull().default(false),
  homeServiceCharge: numeric("home_service_charge", { precision: 10, scale: 2 }).notNull().default("0"),
  workingHoursStart: text("working_hours_start").notNull().default("09:00"),
  workingHoursEnd: text("working_hours_end").notNull().default("20:00"),
  skills: text("skills").array().notNull().default([]),
  portfolioImages: text("portfolio_images").array().notNull().default([]),
  rating: numeric("rating", { precision: 3, scale: 2 }).notNull().default("0"),
  totalReviews: integer("total_reviews").notNull().default(0),
  totalBookings: integer("total_bookings").notNull().default(0),
  isAvailable: boolean("is_available").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertBarberSchema = createInsertSchema(barbersTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertBarber = z.infer<typeof insertBarberSchema>;
export type Barber = typeof barbersTable.$inferSelect;

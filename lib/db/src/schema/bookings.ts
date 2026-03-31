import { pgTable, serial, text, integer, boolean, numeric, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { barbersTable } from "./barbers";

export const bookingStatusEnum = pgEnum("booking_status", ["pending", "confirmed", "completed", "cancelled"]);
export const paymentMethodEnum = pgEnum("payment_method", ["online", "cash"]);
export const paymentStatusEnum = pgEnum("payment_status", ["pending", "paid", "refunded"]);

export const bookingsTable = pgTable("bookings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  barberId: integer("barber_id").notNull().references(() => barbersTable.id),
  serviceIds: integer("service_ids").array().notNull().default([]),
  date: text("date").notNull(),
  startTime: text("start_time").notNull(),
  endTime: text("end_time").notNull(),
  totalDuration: integer("total_duration").notNull().default(0),
  totalAmount: numeric("total_amount", { precision: 10, scale: 2 }).notNull().default("0"),
  discountAmount: numeric("discount_amount", { precision: 10, scale: 2 }).notNull().default("0"),
  finalAmount: numeric("final_amount", { precision: 10, scale: 2 }).notNull().default("0"),
  isHomeService: boolean("is_home_service").notNull().default(false),
  address: text("address"),
  paymentMethod: paymentMethodEnum("payment_method").notNull().default("cash"),
  paymentStatus: paymentStatusEnum("payment_status").notNull().default("pending"),
  status: bookingStatusEnum("status").notNull().default("pending"),
  couponCode: text("coupon_code"),
  notes: text("notes"),
  cancelReason: text("cancel_reason"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertBookingSchema = createInsertSchema(bookingsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type Booking = typeof bookingsTable.$inferSelect;

import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { barbersTable } from "./barbers";
import { bookingsTable } from "./bookings";

export const reviewsTable = pgTable("reviews", {
  id: serial("id").primaryKey(),
  bookingId: integer("booking_id").notNull().references(() => bookingsTable.id),
  barberId: integer("barber_id").notNull().references(() => barbersTable.id),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertReviewSchema = createInsertSchema(reviewsTable).omit({ id: true, createdAt: true });
export type InsertReview = z.infer<typeof insertReviewSchema>;
export type Review = typeof reviewsTable.$inferSelect;

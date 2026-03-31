import { pgTable, serial, text, integer, boolean, numeric, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { barbersTable } from "./barbers";
import { serviceTypesTable } from "./service_types";

export const servicesTable = pgTable("services", {
  id: serial("id").primaryKey(),
  barberId: integer("barber_id").notNull().references(() => barbersTable.id),
  serviceTypeId: integer("service_type_id").references(() => serviceTypesTable.id),
  name: text("name").notNull(),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  durationMinutes: integer("duration_minutes").notNull(),
  description: text("description"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertServiceSchema = createInsertSchema(servicesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertService = z.infer<typeof insertServiceSchema>;
export type Service = typeof servicesTable.$inferSelect;

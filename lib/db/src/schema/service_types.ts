import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const serviceTypesTable = pgTable("service_types", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  defaultDurationMinutes: integer("default_duration_minutes").notNull().default(30),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertServiceTypeSchema = createInsertSchema(serviceTypesTable).omit({ id: true, createdAt: true });
export type InsertServiceType = z.infer<typeof insertServiceTypeSchema>;
export type ServiceType = typeof serviceTypesTable.$inferSelect;

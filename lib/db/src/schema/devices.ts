import { pgTable, serial, text, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { licensesTable } from "./licenses";

export const devicesTable = pgTable("devices", {
  id: serial("id").primaryKey(),
  licenseId: integer("license_id").notNull().references(() => licensesTable.id, { onDelete: "cascade" }),
  deviceId: text("device_id").notNull(),
  deviceInfo: jsonb("device_info"),
  isActive: boolean("is_active").notNull().default(true),
  firstSeen: timestamp("first_seen").notNull().defaultNow(),
  lastSeen: timestamp("last_seen").notNull().defaultNow(),
});

export const insertDeviceSchema = createInsertSchema(devicesTable).omit({ id: true, firstSeen: true, lastSeen: true });
export type InsertDevice = z.infer<typeof insertDeviceSchema>;
export type Device = typeof devicesTable.$inferSelect;

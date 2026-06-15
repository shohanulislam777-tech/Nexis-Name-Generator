import { pgTable, serial, text, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { plansTable } from "./plans";

export const licenseStatusEnum = ["active", "suspended", "revoked", "expired", "trial"] as const;
export type LicenseStatus = typeof licenseStatusEnum[number];

export const licensesTable = pgTable("licenses", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  status: text("status").notNull().default("active"),
  planId: integer("plan_id").references(() => plansTable.id),
  userName: text("user_name"),
  userEmail: text("user_email"),
  maxDevices: integer("max_devices").notNull().default(1),
  isTrial: boolean("is_trial").notNull().default(false),
  expiresAt: timestamp("expires_at"),
  activatedAt: timestamp("activated_at"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertLicenseSchema = createInsertSchema(licensesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertLicense = z.infer<typeof insertLicenseSchema>;
export type License = typeof licensesTable.$inferSelect;

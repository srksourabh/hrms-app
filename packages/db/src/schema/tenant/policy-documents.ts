import { pgTable, uuid, text, timestamp, date } from "drizzle-orm/pg-core";

export const policyCategoryEnum = ["hr_policy", "employee_handbook", "code_of_conduct", "anti_corruption", "health_safety", "other"] as const;

export const policyDocuments = pgTable("policy_documents", {
  id: uuid("id").defaultRandom().primaryKey(),
  // Metadata
  name: text("name").notNull(),
  description: text("description"),
  category: text("category", { enum: policyCategoryEnum }).notNull(),
  version: text("version").notNull().default("1.0"),
  // Storage
  fileName: text("file_name").notNull(),      // original file name
  fileUrl: text("file_url").notNull(),         // Supabase Storage path or URL
  fileSize: text("file_size"),                // bytes as string
  mimeType: text("mime_type"),
  // Dates
  effectiveDate: date("effective_date").notNull(),
  expiryDate: date("expiry_date"),
  // Audit
  createdBy: text("created_by").notNull(),     // user id
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull().$onUpdate(() => new Date()),
});

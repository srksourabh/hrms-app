import { pgTable, uuid, text, decimal, timestamp } from "drizzle-orm/pg-core";
import { users } from "../public/users";

export const guideMaps = pgTable("guide_maps", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  centerLat: decimal("center_lat", { precision: 10, scale: 7 }).notNull(),
  centerLng: decimal("center_lng", { precision: 10, scale: 7 }).notNull(),
  zoom: text("zoom").notNull().default("12"),
  createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

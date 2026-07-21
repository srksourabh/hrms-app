import { pgTable, uuid, text, timestamp, pgEnum, index } from "drizzle-orm/pg-core";

export const inviteStatusEnum = pgEnum("invite_status", [
  "pending",
  "accepted",
  "expired",
  "revoked",
]);

export const inviteRoleEnum = pgEnum("invite_role", [
  "hr_manager",
  "department_manager",
  "payroll_admin",
  "employee",
]);

export const employeeInvitations = pgTable("employee_invitations", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull(),
  token: text("token").notNull().unique(),
  role: inviteRoleEnum("role").notNull().default("employee"),
  invitedByUserId: uuid("invited_by_user_id").notNull(),
  departmentId: uuid("department_id"),
  fullName: text("full_name").notNull(),
  status: inviteStatusEnum("status").default("pending").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  acceptedAt: timestamp("accepted_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  emailIdx: index("invitations_email_idx").on(table.email),
  tokenIdx: index("invitations_token_idx").on(table.token),
  statusIdx: index("invitations_status_idx").on(table.status),
}));

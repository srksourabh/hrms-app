import { pgTable, uuid, text, timestamp, index } from "drizzle-orm/pg-core";

/**
 * Cross-tenant invite token index.
 *
 * The employee_invitations table lives inside each tenant schema, but the
 * invite link is delivered to a prospective employee before they have any
 * tenant context. To let a public procedure resolve a token to its tenant
 * without scanning every schema, we mirror (token, tenantSchema) here in
 * the public schema. This is the only way to give the public lookup
 * constant-time behavior — see apps/web/trpc/routers/invite.ts.
 */
export const inviteTokenIndex = pgTable(
  "invite_token_index",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    token: text("token").notNull(),
    tenantSchema: text("tenant_schema").notNull(),
    invitationId: uuid("invitation_id").notNull(),
    status: text("status").notNull().default("pending"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    expiresAt: timestamp("expires_at").notNull(),
  },
  (table) => ({
    tokenIdx: index("invite_token_index_token_idx").on(table.token),
    statusIdx: index("invite_token_index_status_idx").on(table.status, table.expiresAt),
  }),
);

export type InviteTokenIndex = typeof inviteTokenIndex.$inferSelect;
export type NewInviteTokenIndex = typeof inviteTokenIndex.$inferInsert;

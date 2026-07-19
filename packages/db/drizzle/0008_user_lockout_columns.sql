-- 0008_user_lockout_columns.sql
-- Durable account-lockout state on the public users table (C2 / AUTH-003/004).
-- Idempotent. Safe to run before or after deploying the C2 auth code — the
-- authorize() callback tolerates the columns being absent.

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS locked_until TIMESTAMP;

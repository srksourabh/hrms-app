-- Migration 0003: Add employee_invitations table for multi-tenant invite flow
-- Target schema: rukn_energy_services (existing tenant)
-- New tenants get this automatically via tenant-manager.ts

BEGIN;

CREATE TYPE invite_status AS ENUM ('pending', 'accepted', 'expired', 'revoked');
CREATE TYPE invite_role AS ENUM ('hr_manager', 'department_manager', 'payroll_admin', 'employee');

CREATE TABLE IF NOT EXISTS "employee_invitations" (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'employee',
  invited_by_user_id UUID NOT NULL,
  department_id UUID,
  full_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  expires_at TIMESTAMP NOT NULL,
  accepted_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS "invitations_email_idx" ON "employee_invitations" (email);
CREATE INDEX IF NOT EXISTS "invitations_token_idx" ON "employee_invitations" (token);
CREATE INDEX IF NOT EXISTS "invitations_status_idx" ON "employee_invitations" (status);

COMMIT;

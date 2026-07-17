-- 0004_add_onboarding_completed.sql
-- Flags whether a tenant has completed the initial company setup wizard.
-- New companies start with false and are redirected to the onboarding wizard.

ALTER TABLE tenants
ADD COLUMN onboarding_completed text NOT NULL DEFAULT 'false',
ADD COLUMN industry text,
ADD COLUMN company_size text,
ADD COLUMN website text;

-- Mark existing companies (RUKN Energy, demo companies) as completed so they skip the wizard
UPDATE tenants SET onboarding_completed = 'true' WHERE company_name ILIKE '%rukn%' OR company_name ILIKE '%demo%';

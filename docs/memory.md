# Memory — hrms-app (Taāzur)

## Project metadata
- **Created**: 2026-07-11
- **Stack**: Next.js 16 + tRPC + Drizzle + PostgreSQL
- **Auth**: NextAuth v5 (public schema)
- **Multi-tenancy**: Schema-per-tenant (Section 13.2 of PRD)
- **Deployment**: Vercel (web) / Docker (services)

## Architecture decisions

### ADR-001: Auth strategy
**Date**: 2026-07-11
**Decision**: NextAuth v5 with auth tables in public schema
**Reason**: Single-login SaaS requires tenant routing before per-tenant schema access. Auth tables (users, accounts, sessions) live in public schema with `tenant_id` on users table. Application data lives in per-tenant schemas.
**Trade-offs**: User records are globally accessible (mitigated by tenant_id FK); no per-tenant auth isolation

### ADR-002: Multi-tenancy model
**Date**: 2026-07-11
**Decision**: PostgreSQL schema-per-tenant
**Reason**: PRD Section 13.2 specifies schema-level isolation for data security. Each tenant gets a dedicated schema (e.g., `tenant_abc123`) with all application tables. The `public` schema holds tenant registry + auth tables.
**Trade-offs**: More complex connection management than tenant_id column filtering; requires dynamic schema creation on signup

### ADR-003: Database ORM
**Date**: 2026-07-11
**Decision**: Drizzle ORM
**Reason**: Lightweight, SQL-like API, good TypeScript inference, fast migrations
**Trade-offs**: No native multi-tenant schema switching; connection routing implemented via `search_path` and connection pooling per tenant

### ADR-004: Monorepo tool
**Date**: 2026-07-11
**Decision**: Turborepo + pnpm
**Reason**: Industry standard for TypeScript monorepos, parallel execution, caching

## Data model scope
Phase 1 entities (14 tables in tenant schema):
- departments, employees, employment_history, documents
- leave_types, leave_requests, leave_balances
- payroll_runs, payslips, wage_files, compliance_checks, final_settlements
- audit_logs, notifications

Plus 5 tables in public schema:
- tenants, users, accounts, sessions, verification_tokens

## Session notes

### 2026-07-11: Foundation + Taāzur PRD integration
- Built SaaS foundation (hrms-app)
- Applied Taāzur PRD v5.0 requirements
- Implemented schema-per-tenant multi-tenancy
- Auth tables moved to public schema for single-login flow
- Created tenant manager (create schema, route connections)
- Phase 1 data model with 19 tables across public + tenant schemas
- tRPC routers: auth, user, employee, department
- Updated signup flow to create tenant schema + admin user

### 2026-07-11: Design system (docs/design.md)
- Researched Saudi color psychology (flag green #006C35, sand/clay tones, gold accent)
- Researched Arabic typography (IBM Plex Sans Arabic for bilingual pairing with Inter)
- Researched 2026 UI trends (dark-first design, bento grids, neo-minimalism)
- Researched competitor HR platforms (Ojoor, TeamHub) for Saudi market patterns
- Created docs/design.md with: color tokens, type scale, RTL strategy, layout, component guidelines, dark mode specs, AI interface patterns, accessibility baseline

## Known issues
- In-memory rate limiting resets on server restart (use Upstash Redis in production)
- tenantDb connection pool grows per tenant; consider connection pooling with PgBouncer after 50 tenants
- No relation definitions in Drizzle yet; `with` queries not available until relations are defined
- Drizzle queries use raw table imports from schema; need to verify `ctx.db` supports all query patterns

## Environment
- **Dev**: `docker compose up` (Postgres + Redis)
- **Staging**: TBD
- **Prod**: TBD

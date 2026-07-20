# Architecture Review Agent

The Architecture Review Agent reviews any local workspace folder and produces:

- a CEO-readable architecture score out of 100;
- a category score for product architecture, database architecture, security, operations, tests, docs, and maintainability;
- exact findings with file and line evidence;
- a machine-readable JSON report for future automation.

## Run It

```powershell
pnpm arch:review -- --workspace .
```

Review another workspace:

```powershell
pnpm arch:review -- --workspace "C:\path\to\another\project"
```

Focus the report on a product workspace/module slug from `apps/web/lib/module-catalog.ts`:

```powershell
pnpm arch:review -- --workspace . --product-workspace performance-goals
```

Reports are written to:

```text
reports/architecture-reviews/
```

## What It Checks

- Database connection factories, env variables, fallback URLs, migration files, schema files, raw SQL, tenant isolation, and Supabase/RLS signals.
- Product architecture, module/workspace catalog status, route surface, API surface, and tRPC routers.
- Auth, RBAC, sensitive operational routes, hard-coded secret signals, and public secret exposure.
- Build, lint, typecheck, test, E2E, CI, deployment, health endpoint, logging, and audit signals.
- Documentation drift, stale claims, large files, TODO/FIXME markers, and loose TypeScript signals.

## Secret Safety

Real `.env` files are not read by default. The agent records that they exist but avoids printing secrets.

Only use this flag in a trusted local session:

```powershell
pnpm arch:review -- --workspace . --include-env-secrets
```


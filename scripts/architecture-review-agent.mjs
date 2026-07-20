#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { basename, dirname, extname, join, relative, resolve, sep } from "node:path";
import process from "node:process";

const VERSION = "1.0.0";
const DEFAULT_MAX_FILE_BYTES = 350_000;
const DEFAULT_MAX_FILES = 8_000;

const CATEGORY_WEIGHTS = {
  "Product architecture": 15,
  "Data architecture": 20,
  "Security and isolation": 20,
  "Operations readiness": 15,
  "Testing and quality": 15,
  "Documentation truth": 10,
  "Code maintainability": 5,
};

const SEVERITY_PENALTY = {
  critical: 12,
  high: 7,
  medium: 3,
  low: 1,
  info: 0,
};

const IGNORED_DIRECTORIES = new Set([
  ".git",
  ".hg",
  ".svn",
  "node_modules",
  ".next",
  ".turbo",
  ".vercel",
  ".cache",
  "dist",
  "build",
  "coverage",
  "playwright-report",
  "test-results",
  "out",
  "target",
  "vendor",
  "__pycache__",
  ".venv",
  "venv",
  "reports",
]);

const TEXT_EXTENSIONS = new Set([
  ".cjs",
  ".css",
  ".csv",
  ".env",
  ".example",
  ".html",
  ".js",
  ".json",
  ".jsx",
  ".md",
  ".mjs",
  ".prisma",
  ".ps1",
  ".py",
  ".rs",
  ".sql",
  ".toml",
  ".ts",
  ".tsx",
  ".txt",
  ".xml",
  ".yaml",
  ".yml",
]);

const TEXT_FILE_NAMES = new Set([
  ".dockerignore",
  ".env.example",
  ".env.sample",
  ".env.template",
  ".gitignore",
  "Dockerfile",
  "docker-compose.yml",
  "package.json",
  "pnpm-lock.yaml",
  "pnpm-workspace.yaml",
  "turbo.json",
  "vercel.json",
]);

const SECRET_ENV_NAMES = new Set([
  ".env",
  ".env.local",
  ".env.production",
  ".env.prod",
  ".env.development",
  ".env.test",
]);

function usage() {
  return `Architecture Review Agent v${VERSION}

Usage:
  pnpm arch:review -- --workspace <path>
  node scripts/architecture-review-agent.mjs --workspace <path> --product-workspace <slug>

Options:
  --workspace, -w          Local folder to review. Defaults to the current directory.
  --product-workspace      Optional product module/workspace slug to call out in the report.
  --output, -o             Output directory. Defaults to <workspace>/reports/architecture-reviews.
  --format                 markdown, json, or both. Defaults to both.
  --max-files              Safety cap for scanned files. Defaults to ${DEFAULT_MAX_FILES}.
  --max-file-bytes         Safety cap per file. Defaults to ${DEFAULT_MAX_FILE_BYTES}.
  --include-env-secrets    Read real .env files. Off by default; reports names only to avoid leaking secrets.
  --help, -h               Show this help.
`;
}

function parseArgs(argv) {
  const args = {
    workspace: process.cwd(),
    output: undefined,
    format: "both",
    productWorkspace: undefined,
    maxFiles: DEFAULT_MAX_FILES,
    maxFileBytes: DEFAULT_MAX_FILE_BYTES,
    includeEnvSecrets: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = argv[index + 1];
    if (arg === "--help" || arg === "-h") {
      console.log(usage());
      process.exit(0);
    }
    if (arg === "--workspace" || arg === "-w") {
      args.workspace = requiredValue(arg, next);
      index += 1;
      continue;
    }
    if (arg === "--output" || arg === "-o") {
      args.output = requiredValue(arg, next);
      index += 1;
      continue;
    }
    if (arg === "--format") {
      args.format = requiredValue(arg, next);
      index += 1;
      continue;
    }
    if (arg === "--product-workspace" || arg === "--module") {
      args.productWorkspace = requiredValue(arg, next);
      index += 1;
      continue;
    }
    if (arg === "--max-files") {
      args.maxFiles = Number.parseInt(requiredValue(arg, next), 10);
      index += 1;
      continue;
    }
    if (arg === "--max-file-bytes") {
      args.maxFileBytes = Number.parseInt(requiredValue(arg, next), 10);
      index += 1;
      continue;
    }
    if (arg === "--include-env-secrets") {
      args.includeEnvSecrets = true;
      continue;
    }
    throw new Error(`Unknown argument: ${arg}`);
  }

  if (!["markdown", "json", "both"].includes(args.format)) {
    throw new Error("--format must be markdown, json, or both");
  }
  if (!Number.isInteger(args.maxFiles) || args.maxFiles <= 0) {
    throw new Error("--max-files must be a positive integer");
  }
  if (!Number.isInteger(args.maxFileBytes) || args.maxFileBytes <= 0) {
    throw new Error("--max-file-bytes must be a positive integer");
  }

  args.workspace = resolve(args.workspace);
  args.output = resolve(args.output ?? join(args.workspace, "reports", "architecture-reviews"));
  return args;
}

function requiredValue(flag, value) {
  if (!value || value.startsWith("--")) throw new Error(`${flag} requires a value`);
  return value;
}

function normalizePath(path) {
  return path.split(sep).join("/");
}

function isSecretArtifactPath(relativePath) {
  const normalized = normalizePath(relativePath).toLowerCase();
  const name = basename(normalized);
  return (
    [
      "_db_url.txt",
      "db_url.txt",
      "database_url.txt",
      "secrets.txt",
      "secret.txt",
      "service-role.txt",
      "service_role.txt",
    ].includes(name) ||
    normalized.endsWith(".pem") ||
    normalized.endsWith(".key") ||
    normalized.endsWith(".p8") ||
    /(^|\/)(secrets?|credentials?)\.(json|yaml|yml|toml|txt)$/u.test(normalized)
  );
}

function isSecretEnvFile(path) {
  const name = basename(path);
  return SECRET_ENV_NAMES.has(name);
}

function isTextFile(path) {
  const name = basename(path);
  if (TEXT_FILE_NAMES.has(name)) return true;
  return TEXT_EXTENSIONS.has(extname(path));
}

function safeReadJson(file) {
  try {
    return JSON.parse(readFileSync(file, "utf8"));
  } catch {
    return undefined;
  }
}

function walkWorkspace(root, options) {
  const files = [];
  const unread = [];
  let truncated = false;

  function walk(directory) {
    if (files.length >= options.maxFiles) {
      truncated = true;
      return;
    }

    let entries = [];
    try {
      entries = readdirSync(directory, { withFileTypes: true });
    } catch {
      unread.push({ path: directory, reason: "directory could not be read" });
      return;
    }

    for (const entry of entries) {
      if (files.length >= options.maxFiles) {
        truncated = true;
        return;
      }

      const fullPath = join(directory, entry.name);
      if (entry.isDirectory()) {
        if (!IGNORED_DIRECTORIES.has(entry.name)) walk(fullPath);
        continue;
      }
      if (!entry.isFile()) continue;

      const relativePath = normalizePath(relative(root, fullPath));
      let stats;
      try {
        stats = statSync(fullPath);
      } catch {
        unread.push({ path: relativePath, reason: "file metadata could not be read" });
        continue;
      }

      const shouldRead =
        isTextFile(fullPath) &&
        stats.size <= options.maxFileBytes &&
        (options.includeEnvSecrets || !isSecretEnvFile(fullPath));

      if (!shouldRead) {
        unread.push({
          path: relativePath,
          reason: isSecretEnvFile(fullPath)
            ? "secret env file skipped by default"
            : stats.size > options.maxFileBytes
              ? `file exceeds ${options.maxFileBytes} bytes`
              : "binary or unsupported file type",
        });
        files.push({
          path: fullPath,
          relativePath,
          size: stats.size,
          extension: extname(fullPath),
          readable: false,
          content: "",
          lineCount: 0,
        });
        continue;
      }

      let content = "";
      try {
        content = readFileSync(fullPath, "utf8");
      } catch {
        unread.push({ path: relativePath, reason: "file content could not be read" });
      }
      files.push({
        path: fullPath,
        relativePath,
        size: stats.size,
        extension: extname(fullPath),
        readable: content.length > 0 || stats.size === 0,
        content,
        lineCount: content ? content.split(/\r?\n/u).length : 0,
      });
    }
  }

  walk(root);
  return { files, unread, truncated };
}

function redact(value) {
  return value
    .replace(/(postgres(?:ql)?:\/\/[^:\s/]+:)[^@\s/]+(@)/giu, "$1[REDACTED]$2")
    .replace(/(mysql:\/\/[^:\s/]+:)[^@\s/]+(@)/giu, "$1[REDACTED]$2")
    .replace(/(mongodb(?:\+srv)?:\/\/[^:\s/]+:)[^@\s/]+(@)/giu, "$1[REDACTED]$2")
    .replace(/(DATABASE_URL\s*=\s*)["']?[^"'\s]+/giu, "$1[REDACTED]")
    .replace(/(DIRECT_URL\s*=\s*)["']?[^"'\s]+/giu, "$1[REDACTED]")
    .replace(/(SUPABASE_SERVICE_ROLE_KEY\s*=\s*)["']?[^"'\s]+/giu, "$1[REDACTED]")
    .replace(/(AUTH_SECRET\s*=\s*)["']?[^"'\s]+/giu, "$1[REDACTED]")
    .replace(/(sk-[A-Za-z0-9_-]{12,})/gu, "sk-[REDACTED]")
    .replace(/(eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,})/gu, "[JWT_REDACTED]");
}

function lineEvidence(file, lineNumber, line) {
  return {
    file: file.relativePath,
    line: lineNumber,
    snippet: redact(line.trim()).slice(0, 240),
  };
}

function findLineMatches(files, pattern, { limit = 20, exclude = () => false } = {}) {
  const matches = [];
  for (const file of files) {
    if (!file.readable || exclude(file)) continue;
    const lines = file.content.split(/\r?\n/u);
    for (const [index, line] of lines.entries()) {
      pattern.lastIndex = 0;
      if (pattern.test(line)) {
        matches.push(lineEvidence(file, index + 1, line));
        if (matches.length >= limit) return matches;
      }
    }
  }
  return matches;
}

function includesAny(content, values) {
  return values.some((value) => content.includes(value));
}

function countMatches(content, pattern) {
  return [...content.matchAll(pattern)].length;
}

function packageDependencies(packageJson) {
  if (!packageJson) return new Set();
  return new Set([
    ...Object.keys(packageJson.dependencies ?? {}),
    ...Object.keys(packageJson.devDependencies ?? {}),
    ...Object.keys(packageJson.peerDependencies ?? {}),
    ...Object.keys(packageJson.optionalDependencies ?? {}),
  ]);
}

function getFiles(files, predicate) {
  return files.filter((file) => file.readable && predicate(file));
}

function makeFinding(findings, finding) {
  findings.push({
    id: finding.id,
    severity: finding.severity,
    category: finding.category,
    title: finding.title,
    impact: finding.impact,
    recommendation: finding.recommendation,
    evidence: finding.evidence?.slice(0, 8) ?? [],
  });
}

function analyzeWorkspace(root, scan, options) {
  const files = scan.files;
  const readableFiles = files.filter((file) => file.readable);
  const packageJsonPath = join(root, "package.json");
  const rootPackage = existsSync(packageJsonPath) ? safeReadJson(packageJsonPath) : undefined;
  const deps = packageDependencies(rootPackage);
  const runtimeText = readableFiles
    .filter(
      (file) =>
        !file.relativePath.startsWith("docs/") &&
        !file.relativePath.startsWith("reports/") &&
        file.relativePath !== "scripts/architecture-review-agent.mjs",
    )
    .map((file) => file.content)
    .join("\n");
  const findings = [];
  const positives = [];

  const packageFiles = getFiles(files, (file) => file.relativePath.endsWith("package.json"));
  const appPages = files.filter((file) => /(^|\/)app\/.*\/page\.tsx$/u.test(file.relativePath));
  const appApiRoutes = files.filter((file) => /(^|\/)app\/api\/.*\/route\.(ts|js)$/u.test(file.relativePath));
  const trpcRouters = files.filter((file) => /(^|\/)trpc\/routers\/.*\.(ts|js)$/u.test(file.relativePath));
  const schemaFiles = files.filter((file) => /(^|\/)schema\/.*\.(ts|js)$/u.test(file.relativePath));
  const migrationFiles = files.filter((file) => /(^|\/)(migrations|drizzle)\/.*\.(sql|ts|js)$/u.test(file.relativePath));
  const testFiles = files.filter((file) => /\.(test|spec)\.(ts|tsx|js|mjs|cjs)$/u.test(file.relativePath));
  const e2eFiles = files.filter((file) => /(^|\/)(e2e|playwright).*|playwright\.config\./u.test(file.relativePath));
  const ciFiles = files.filter((file) => /^\.github\/workflows\/.*\.(yml|yaml)$/u.test(file.relativePath));
  const docsFiles = files.filter((file) => file.relativePath.startsWith("docs/") && file.extension === ".md");
  const sourceFiles = files.filter(
    (file) => /\.(ts|tsx|js|mjs|cjs|py|rs)$/u.test(file.relativePath) && file.relativePath !== "scripts/architecture-review-agent.mjs",
  );

  const frameworkSignals = {
    next: deps.has("next") || includesAny(runtimeText, ["next.config", "from \"next", "from 'next"]),
    react: deps.has("react") || deps.has("react-dom"),
    trpc: deps.has("@trpc/server") || includesAny(runtimeText, ["@trpc/server", "createTRPCRouter"]),
    drizzle: deps.has("drizzle-orm") || includesAny(runtimeText, ["drizzle-orm", "drizzle("]),
    prisma: deps.has("prisma") || deps.has("@prisma/client") || includesAny(runtimeText, ["PrismaClient"]),
    supabase: deps.has("@supabase/supabase-js") || includesAny(runtimeText, ["supabase", "SUPABASE_"]),
    nextAuth: deps.has("next-auth") || includesAny(runtimeText, ["NextAuth", "@auth/"]),
    redis: includesAny(runtimeText, ["REDIS_URL", "Upstash", "ioredis", "redis://"]),
  };

  if (rootPackage) {
    positives.push(`Root package detected: ${rootPackage.name ?? "unnamed"} with ${packageFiles.length} package file(s).`);
  } else {
    makeFinding(findings, {
      id: "ARCH-001",
      severity: "high",
      category: "Product architecture",
      title: "No root package.json was found",
      impact: "The agent cannot verify scripts, dependencies, package manager, or workspace boundaries from a standard Node project manifest.",
      recommendation: "Add or restore a root package manifest, or run the agent against the actual project root.",
    });
  }

  if (existsSync(join(root, "pnpm-workspace.yaml")) || existsSync(join(root, "turbo.json"))) {
    positives.push("Monorepo/workspace boundaries are explicit.");
  } else if (packageFiles.length > 2) {
    makeFinding(findings, {
      id: "ARCH-002",
      severity: "medium",
      category: "Product architecture",
      title: "Multiple packages found without an obvious workspace manifest",
      impact: "Dependency ownership and build order can drift when the repository has many packages but no clear workspace map.",
      recommendation: "Add a workspace manifest, or document why these packages are intentionally independent.",
      evidence: packageFiles.slice(0, 5).map((file) => ({ file: file.relativePath, line: 1, snippet: "package.json" })),
    });
  }

  if (appPages.length > 0 || appApiRoutes.length > 0 || trpcRouters.length > 0) {
    positives.push(`Runtime surface detected: ${appPages.length} pages, ${appApiRoutes.length} API route files, ${trpcRouters.length} tRPC routers.`);
  }

  analyzeProductCatalog(files, findings, positives, options.productWorkspace);
  analyzeDatabase(root, files, schemaFiles, migrationFiles, findings, positives);
  analyzeSecurity(files, findings, positives);
  analyzeOperations(root, files, rootPackage, ciFiles, findings, positives);
  analyzeTesting(files, testFiles, e2eFiles, findings, positives);
  analyzeDocs(files, docsFiles, frameworkSignals, findings, positives);
  analyzeMaintainability(sourceFiles, findings, positives);

  if (scan.truncated) {
    makeFinding(findings, {
      id: "SCAN-001",
      severity: "medium",
      category: "Operations readiness",
      title: "Workspace scan hit the file-count safety cap",
      impact: "The report may miss architecture files beyond the configured scan cap.",
      recommendation: "Rerun with --max-files set higher, or point --workspace at a narrower project root.",
    });
  }

  if (scan.unread.some((item) => item.reason === "secret env file skipped by default")) {
    makeFinding(findings, {
      id: "SEC-ENV-SKIP",
      severity: "info",
      category: "Security and isolation",
      title: "Secret env files were intentionally not read",
      impact: "The agent avoids leaking credentials. It can still review env variable names from sample files and source references.",
      recommendation: "Use --include-env-secrets only in a trusted local session when you truly need real env-file inspection.",
      evidence: scan.unread
        .filter((item) => item.reason === "secret env file skipped by default")
        .slice(0, 8)
        .map((item) => ({ file: item.path, line: 1, snippet: item.reason })),
    });
  }

  const scores = scoreFindings(findings);
  const metrics = {
    workspaceRoot: root,
    scannedFiles: files.length,
    readableFiles: readableFiles.length,
    skippedFiles: scan.unread.length,
    totalLines: readableFiles.reduce((sum, file) => sum + file.lineCount, 0),
    packages: packageFiles.length,
    appPages: appPages.length,
    appApiRoutes: appApiRoutes.length,
    trpcRouters: trpcRouters.length,
    schemaFiles: schemaFiles.length,
    migrationFiles: migrationFiles.length,
    testFiles: testFiles.length,
    e2eSignals: e2eFiles.length,
    ciFiles: ciFiles.length,
    docsFiles: docsFiles.length,
    stack: Object.entries(frameworkSignals)
      .filter(([, present]) => present)
      .map(([name]) => name),
  };

  return {
    version: VERSION,
    generatedAt: new Date().toISOString(),
    options: {
      workspace: root,
      productWorkspace: options.productWorkspace ?? null,
      maxFiles: options.maxFiles,
      maxFileBytes: options.maxFileBytes,
      includeEnvSecrets: options.includeEnvSecrets,
    },
    metrics,
    scores,
    positives,
    findings: sortFindings(findings),
  };
}

function analyzeProductCatalog(files, findings, positives, productWorkspaceSlug) {
  const catalog = files.find((file) => file.relativePath.endsWith("module-catalog.ts"));
  if (!catalog?.readable) return;

  const slugMatches = [...catalog.content.matchAll(/slug:\s*"([^"]+)"/gu)].map((match) => match[1]);
  const statusMatches = [...catalog.content.matchAll(/status:\s*"(live|demo|mock)"/gu)].map((match) => match[1]);
  const statusCounts = statusMatches.reduce((acc, status) => {
    acc[status] = (acc[status] ?? 0) + 1;
    return acc;
  }, {});
  positives.push(
    `Product catalog found with ${slugMatches.length} workspace/module entries (${statusCounts.live ?? 0} live, ${statusCounts.demo ?? 0} demo, ${statusCounts.mock ?? 0} mock).`,
  );

  if (productWorkspaceSlug) {
    const slugIndex = slugMatches.indexOf(productWorkspaceSlug);
    if (slugIndex === -1) {
      makeFinding(findings, {
        id: "PROD-001",
        severity: "medium",
        category: "Product architecture",
        title: `Requested product workspace "${productWorkspaceSlug}" was not found`,
        impact: "The agent can review the repository, but cannot produce a module-specific architecture callout for this slug.",
        recommendation: "Use one of the slugs in the product module catalog, or add the missing workspace to the catalog.",
        evidence: [{ file: catalog.relativePath, line: 1, snippet: `Available slugs include: ${slugMatches.slice(0, 8).join(", ")}` }],
      });
    } else {
      positives.push(`Focused product workspace: ${productWorkspaceSlug}.`);
    }
  }

  if ((statusCounts.demo ?? 0) + (statusCounts.mock ?? 0) > (statusCounts.live ?? 0)) {
    makeFinding(findings, {
      id: "PROD-002",
      severity: "medium",
      category: "Product architecture",
      title: "Product catalog is still demo/mock heavy",
      impact: "A customer may see a broad product promise while many workspaces are not yet production-grade.",
      recommendation: "Separate live, demo, and mock modules in navigation and roadmap reporting, and keep release gates per workspace.",
      evidence: [{ file: catalog.relativePath, line: 1, snippet: `${statusCounts.live ?? 0} live, ${statusCounts.demo ?? 0} demo, ${statusCounts.mock ?? 0} mock` }],
    });
  }
}

function analyzeDatabase(root, files, schemaFiles, migrationFiles, findings, positives) {
  const dbConnectionEvidence = findLineMatches(
    files,
    /\b(DATABASE_URL|DIRECT_URL|SUPABASE_URL|SUPABASE_SERVICE_ROLE_KEY|postgres\(|drizzle\(|PrismaClient|new Pool|createClient\()/giu,
    { limit: 40 },
  );
  const dbConnectionFiles = new Set(dbConnectionEvidence.map((item) => item.file));

  if (dbConnectionEvidence.length > 0) {
    positives.push(`Database connection surface found in ${dbConnectionFiles.size} file(s).`);
  } else {
    makeFinding(findings, {
      id: "DATA-001",
      severity: "high",
      category: "Data architecture",
      title: "No database connection surface was detected",
      impact: "The agent cannot confirm where persistent product state lives or how data access is controlled.",
      recommendation: "Document the primary database driver, connection factory, migration path, and environment variables.",
    });
  }

  if (migrationFiles.length > 0) {
    positives.push(`Database migration history detected: ${migrationFiles.length} migration/schema migration file(s).`);
  } else if (schemaFiles.length > 0 || dbConnectionEvidence.length > 0) {
    makeFinding(findings, {
      id: "DATA-002",
      severity: "high",
      category: "Data architecture",
      title: "Schema files exist but migration history was not found",
      impact: "Database changes may not be replayable into a fresh environment.",
      recommendation: "Keep migration files next to the schema and verify a clean database can be built from them.",
    });
  }

  const envSchema = files.find((file) => /(^|\/)packages\/config\/src\/env\.ts$/u.test(file.relativePath));
  if (envSchema?.readable && envSchema.content.includes("DATABASE_URL")) {
    positives.push("DATABASE_URL is part of the typed environment validation layer.");
  } else if (dbConnectionEvidence.length > 0) {
    makeFinding(findings, {
      id: "DATA-003",
      severity: "medium",
      category: "Data architecture",
      title: "Database variables are not clearly validated in a central env layer",
      impact: "Deployments can start with missing or malformed database settings.",
      recommendation: "Validate required database environment variables at boot with a typed schema.",
      evidence: dbConnectionEvidence.slice(0, 5),
    });
  }

  const dbEnvReads = findLineMatches(files, /process\.env\.(DATABASE_URL|DIRECT_URL|SUPABASE_[A-Z0-9_]+)/gu, {
    limit: 25,
    exclude: (file) => file.relativePath.includes("node_modules"),
  });
  const envReadFiles = new Set(dbEnvReads.map((item) => item.file));
  if (envReadFiles.size > 3) {
    makeFinding(findings, {
      id: "DATA-004",
      severity: "low",
      category: "Data architecture",
      title: "Database env reads are spread across several files",
      impact: "Connection behavior can drift when multiple runtime files read database variables directly.",
      recommendation: "Route database env reads through one config/connection module where possible.",
      evidence: dbEnvReads,
    });
  }

  const fallbackUrls = findLineMatches(files, /postgres(?:ql)?:\/\/[^"'\s]+/giu, {
    limit: 12,
    exclude: (file) =>
      file.relativePath.startsWith("docs/") ||
      file.relativePath.startsWith("docker/") ||
      file.relativePath.endsWith(".env.example") ||
      isSecretArtifactPath(file.relativePath),
  });
  const suspiciousFallbacks = fallbackUrls.filter((item) => item.snippet.includes("localhost") || item.snippet.includes("[REDACTED]"));
  if (suspiciousFallbacks.length > 0) {
    makeFinding(findings, {
      id: "DATA-005",
      severity: "medium",
      category: "Data architecture",
      title: "Database connection code contains fallback PostgreSQL URLs",
      impact: "A production process can accidentally connect to a fallback or fail in a misleading way if env validation is bypassed.",
      recommendation: "Keep local fallbacks in development-only tooling, and make runtime server code fail closed when DATABASE_URL is missing.",
      evidence: suspiciousFallbacks,
    });
  }

  const tenantSignals = findLineMatches(files, /\b(tenantId|tenant_id|schemaName|schema_name|search_path|getTenantDb|createTenantSchema)\b/gu, {
    limit: 30,
  });
  if (tenantSignals.length > 0) {
    positives.push("Tenant/workspace isolation signals are present in the codebase.");
  }
  const searchPathSignals = tenantSignals.filter((item) => /search_path|getTenantDb|createTenantSchema/u.test(item.snippet));
  if (tenantSignals.length > 0 && searchPathSignals.length === 0) {
    makeFinding(findings, {
      id: "DATA-006",
      severity: "high",
      category: "Security and isolation",
      title: "Tenant identifiers exist but no database-level tenant isolation signal was found",
      impact: "A missing database isolation layer increases cross-workspace leakage risk.",
      recommendation: "Enforce isolation through schema-per-tenant, RLS, or a proven equivalent, then test it.",
      evidence: tenantSignals.slice(0, 8),
    });
  }

  const isolationTests = files.filter((file) => /tenant.*isolation|isolation.*tenant/iu.test(file.relativePath));
  if (tenantSignals.length > 0 && isolationTests.length === 0) {
    makeFinding(findings, {
      id: "DATA-007",
      severity: "high",
      category: "Testing and quality",
      title: "Tenant/workspace isolation exists but no isolation test file was found",
      impact: "Cross-workspace leakage is the highest-risk SaaS failure mode and should be automatically tested.",
      recommendation: "Add a test that writes to workspace A and proves workspace B cannot see the data.",
      evidence: tenantSignals.slice(0, 5),
    });
  } else if (isolationTests.length > 0) {
    positives.push(`Tenant/workspace isolation test signal found (${isolationTests.length} file(s)).`);
  }

  const tenantManager = files.find((file) => file.relativePath.endsWith("tenant-manager.ts"));
  if (tenantManager?.readable) {
    const generatedTables = [...tenantManager.content.matchAll(/CREATE TABLE IF NOT EXISTS\s+"([^"]+)"/giu)].map((match) => match[1]);
    const tenantSchemaCount = files.filter((file) => /(^|\/)schema\/tenant\/.*\.(ts|js)$/u.test(file.relativePath)).length;
    if (generatedTables.length > 0 && tenantSchemaCount > generatedTables.length + 4) {
      makeFinding(findings, {
        id: "DATA-008",
        severity: "critical",
        category: "Data architecture",
        title: "New tenant schema creation appears much smaller than the tenant domain schema",
        impact: "New workspaces may be created with only a partial database, causing modules to fail after signup/onboarding.",
        recommendation: "Generate tenant schemas from the canonical Drizzle/migration source, or make createTenantSchema replay the full tenant migration set.",
        evidence: [
          {
            file: tenantManager.relativePath,
            line: findLineNumber(tenantManager.content, "function generateTenantDDL"),
            snippet: `${generatedTables.length} generated table(s): ${generatedTables.join(", ")}; ${tenantSchemaCount} tenant schema file(s) exist.`,
          },
        ],
      });
    }
  }

  const unsafeSql = findLineMatches(files, /\.unsafe\(/gu, { limit: 20 });
  if (unsafeSql.length > 0) {
    const hasSchemaGuard = files.some((file) => file.readable && file.content.includes("assertSafeSchema"));
    makeFinding(findings, {
      id: "DATA-009",
      severity: hasSchemaGuard ? "low" : "medium",
      category: "Security and isolation",
      title: "Raw SQL escape hatches are present",
      impact: "Raw SQL is sometimes necessary, but each use needs input control and connection-context guarantees.",
      recommendation: "Keep raw SQL behind audited helpers, validate dynamic identifiers, and test search_path/tenant context behavior.",
      evidence: unsafeSql,
    });
  }

  const supabaseMigrations = files.filter((file) => /supabase\/migrations\/.*\.sql$/u.test(file.relativePath));
  if (supabaseMigrations.length > 0) {
    const rlsSignals = findLineMatches(supabaseMigrations, /enable row level security|create policy|alter table .* enable row level security/giu, {
      limit: 10,
    });
    if (rlsSignals.length === 0) {
      makeFinding(findings, {
        id: "DATA-010",
        severity: "medium",
        category: "Security and isolation",
        title: "Supabase migration files do not show RLS policy setup",
        impact: "If any schema is exposed through Supabase Data API, missing RLS can expose rows unexpectedly.",
        recommendation: "Confirm Supabase Data API exposure settings. Add explicit RLS policies for exposed tables or keep private schemas unexposed.",
        evidence: supabaseMigrations.slice(0, 5).map((file) => ({ file: file.relativePath, line: 1, snippet: "Supabase migration file" })),
      });
    }
  }

  const drizzleConfig = files.find((file) => file.relativePath.endsWith("drizzle.config.ts"));
  if (drizzleConfig?.readable && existsSync(join(root, "pnpm-lock.yaml"))) {
    positives.push("Drizzle config and lockfile are present, supporting repeatable database tooling.");
  }
}

function analyzeSecurity(files, findings, positives) {
  const secretArtifacts = files.filter((file) => isSecretArtifactPath(file.relativePath));
  if (secretArtifacts.length > 0) {
    makeFinding(findings, {
      id: "SEC-000",
      severity: "critical",
      category: "Security and isolation",
      title: "Secret-looking artifact files are present in the workspace",
      impact: "Credential files can be accidentally committed, synced, or exposed through backups even when .env files are ignored.",
      recommendation: "Remove these files from the workspace after confirming their values are stored in the proper secret manager. Rotate any real credentials that were committed or shared.",
      evidence: secretArtifacts.slice(0, 8).map((file) => ({
        file: file.relativePath,
        line: 1,
        snippet: "Secret-like artifact path detected; content is not printed.",
      })),
    });
  }

  const publicServiceKey = findLineMatches(files, /NEXT_PUBLIC_[A-Z0-9_]*(SERVICE_ROLE|SECRET|PRIVATE|TOKEN|DATABASE|DIRECT_URL)/gu, {
    limit: 15,
  });
  if (publicServiceKey.length > 0) {
    makeFinding(findings, {
      id: "SEC-001",
      severity: "critical",
      category: "Security and isolation",
      title: "Secret-looking variables are marked NEXT_PUBLIC",
      impact: "NEXT_PUBLIC variables are shipped to the browser in Next.js apps.",
      recommendation: "Never expose service-role keys, database URLs, private tokens, or secrets through NEXT_PUBLIC variables.",
      evidence: publicServiceKey,
    });
  }

  const hardcodedSecrets = findLineMatches(
    files,
    /(sk-[A-Za-z0-9_-]{12,}|-----BEGIN (?:RSA |OPENSSH |EC |DSA )?PRIVATE KEY-----|eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}|service_role[^"'\n]*["'][A-Za-z0-9._-]{40,}|(?:api[_-]?key|secret|token|private[_-]?key)\s*[:=]\s*["'][A-Za-z0-9._~+/=-]{24,}["']|(?:postgres(?:ql)?|mysql|mongodb(?:\+srv)?):\/\/[^:\s/]+:[^@\s/]+@(?!localhost|postgres\b|mysql\b)[^"'\s]+)/giu,
    {
      limit: 20,
      exclude: (file) =>
        file.relativePath.startsWith("docs/") ||
        file.relativePath.endsWith(".example") ||
        file.relativePath.includes("__tests__/") ||
        file.relativePath.includes("__tests__\\") ||
        file.relativePath.includes("/demo-identities.") ||
        file.relativePath.includes("\\demo-identities.") ||
        file.relativePath.includes("/i18n.") ||
        file.relativePath.includes("\\i18n.") ||
        isSecretArtifactPath(file.relativePath),
    },
  );
  if (hardcodedSecrets.length > 0) {
    makeFinding(findings, {
      id: "SEC-002",
      severity: "critical",
      category: "Security and isolation",
      title: "Hard-coded secret-like values were detected",
      impact: "Secrets in source code can leak through git history, logs, and developer machines.",
      recommendation: "Move secrets to the deployment secret store, rotate exposed credentials, and add a secret scanner to CI.",
      evidence: hardcodedSecrets,
    });
  }

  const debugRoutes = files.filter((file) => /(^|\/)app\/api\/.*(debug|migrate|seed).*\/route\.(ts|js)$/u.test(file.relativePath));
  if (debugRoutes.length > 0) {
    makeFinding(findings, {
      id: "SEC-003",
      severity: "high",
      category: "Security and isolation",
      title: "Debug, migration, or seed API routes exist in the web app",
      impact: "Operational endpoints inside the public app can become production attack paths if not strongly gated.",
      recommendation: "Require admin auth plus a server-only secret for each route, or move these actions to private scripts.",
      evidence: debugRoutes.slice(0, 8).map((file) => ({ file: file.relativePath, line: 1, snippet: "Operational API route" })),
    });
  }

  const rbacSignals = findLineMatches(files, /\b(RBAC|role|requireRole|requireCapability|canAccessProcedure|middleware)\b/giu, {
    limit: 12,
  });
  if (rbacSignals.length > 0) {
    positives.push("Role/capability access-control signals are present.");
  } else {
    makeFinding(findings, {
      id: "SEC-004",
      severity: "high",
      category: "Security and isolation",
      title: "No role or capability access-control surface was detected",
      impact: "Workspace architecture cannot be trusted without clear authorization boundaries.",
      recommendation: "Add explicit role/capability checks for every sensitive route and backend procedure.",
    });
  }

  const securityHeaderSignals = findLineMatches(files, /Content-Security-Policy|Strict-Transport-Security|X-Frame-Options|frame-ancestors/gu, {
    limit: 10,
  });
  if (securityHeaderSignals.length > 0) {
    positives.push("Security header configuration is present.");
  } else {
    makeFinding(findings, {
      id: "SEC-005",
      severity: "medium",
      category: "Security and isolation",
      title: "Security headers were not detected",
      impact: "The app may miss baseline browser protections such as CSP, HSTS, and frame blocking.",
      recommendation: "Set security headers at the framework or hosting layer and verify them in production smoke tests.",
    });
  }
}

function analyzeOperations(root, files, rootPackage, ciFiles, findings, positives) {
  const packageScripts = rootPackage?.scripts ?? {};
  const requiredScripts = ["build", "lint", "typecheck", "test"];
  const missingScripts = requiredScripts.filter((script) => !packageScripts[script]);
  if (missingScripts.length === 0) {
    positives.push("Build, lint, typecheck, and test scripts are available at the root.");
  } else {
    makeFinding(findings, {
      id: "OPS-001",
      severity: "medium",
      category: "Operations readiness",
      title: "Root quality scripts are incomplete",
      impact: "A reviewer cannot run one standard command set before release.",
      recommendation: `Add root scripts for: ${missingScripts.join(", ")}.`,
    });
  }

  const deploySignals = files.filter((file) =>
    /^(vercel\.json|netlify\.toml|railway\.json|Dockerfile|docker\/Dockerfile|docker\/docker-compose\.yml)$/u.test(file.relativePath),
  );
  if (deploySignals.length > 0) {
    positives.push(`Deployment/runtime configuration detected (${deploySignals.map((file) => file.relativePath).join(", ")}).`);
  } else {
    makeFinding(findings, {
      id: "OPS-002",
      severity: "medium",
      category: "Operations readiness",
      title: "Deployment configuration was not detected",
      impact: "Runtime assumptions may live outside the repo, making architecture reviews incomplete.",
      recommendation: "Add deployment config or a deployment runbook that describes build, env vars, regions, and health checks.",
    });
  }

  const healthRoutes = files.filter((file) => /(^|\/)app\/api\/health\/route\.(ts|js)$/u.test(file.relativePath));
  if (healthRoutes.length > 0) {
    positives.push("Health endpoint exists.");
  } else {
    makeFinding(findings, {
      id: "OPS-003",
      severity: "medium",
      category: "Operations readiness",
      title: "No health endpoint was detected",
      impact: "Production smoke tests and uptime checks need a stable low-risk endpoint.",
      recommendation: "Add a health endpoint that checks app boot and safe dependency readiness.",
    });
  }

  if (ciFiles.length > 0) {
    positives.push(`CI workflow detected (${ciFiles.length} workflow file(s)).`);
  } else if (existsSync(join(root, ".github"))) {
    makeFinding(findings, {
      id: "OPS-004",
      severity: "medium",
      category: "Operations readiness",
      title: "GitHub folder exists but no workflow files were detected",
      impact: "Quality checks may be manual-only.",
      recommendation: "Add CI workflows for install, lint, typecheck, tests, and build.",
    });
  } else {
    makeFinding(findings, {
      id: "OPS-005",
      severity: "low",
      category: "Operations readiness",
      title: "No checked-in CI workflow was detected",
      impact: "Local verification can diverge from hosted verification.",
      recommendation: "Add CI or document the external CI provider used for release gates.",
    });
  }

  const observabilitySignals = findLineMatches(files, /SENTRY_DSN|sentry|logger|audit log|auditLogs|web-vitals|vitals/giu, { limit: 12 });
  if (observabilitySignals.length > 0) {
    positives.push("Observability/audit signals are present.");
  } else {
    makeFinding(findings, {
      id: "OPS-006",
      severity: "medium",
      category: "Operations readiness",
      title: "Observability signals were not detected",
      impact: "Production issues can take longer to diagnose without logs, metrics, error tracking, or audit trails.",
      recommendation: "Add structured logging, error tracking, audit logging for sensitive actions, and web-vital monitoring where relevant.",
    });
  }
}

function analyzeTesting(files, testFiles, e2eFiles, findings, positives) {
  if (testFiles.length > 0) {
    positives.push(`Automated tests detected: ${testFiles.length} test/spec file(s).`);
  } else {
    makeFinding(findings, {
      id: "TEST-001",
      severity: "high",
      category: "Testing and quality",
      title: "No automated tests were detected",
      impact: "Architecture changes can regress without a safety net.",
      recommendation: "Add focused unit tests for core logic and integration tests for major runtime paths.",
    });
  }

  if (e2eFiles.length > 0) {
    positives.push("End-to-end testing signals are present.");
  } else {
    makeFinding(findings, {
      id: "TEST-002",
      severity: "medium",
      category: "Testing and quality",
      title: "No end-to-end test signal was detected",
      impact: "Product workspaces can look correct in code but fail in real browser flows.",
      recommendation: "Add Playwright or equivalent E2E checks for login, navigation, and one happy path per critical workspace.",
    });
  }

  const skippedTests = findLineMatches(files, /\.skip\(|it\.only\(|test\.only\(/gu, { limit: 12 });
  if (skippedTests.length > 0) {
    makeFinding(findings, {
      id: "TEST-003",
      severity: "medium",
      category: "Testing and quality",
      title: "Skipped or focused tests were detected",
      impact: "A focused test can accidentally hide failures in the full suite.",
      recommendation: "Remove .only before shipping and track skipped tests as explicit debt.",
      evidence: skippedTests,
    });
  }
}

function analyzeDocs(files, docsFiles, frameworkSignals, findings, positives) {
  if (docsFiles.length > 0) {
    positives.push(`Documentation corpus detected: ${docsFiles.length} Markdown file(s).`);
  } else {
    makeFinding(findings, {
      id: "DOC-001",
      severity: "medium",
      category: "Documentation truth",
      title: "No docs directory Markdown files were detected",
      impact: "Macro architecture decisions are harder to verify and transfer.",
      recommendation: "Add an architecture document and keep it tied to code-level verification.",
    });
  }

  const architectureDoc = files.find((file) => /(^|\/)(ARCHITECTURE|architecture)\.md$/u.test(file.relativePath));
  if (architectureDoc?.readable) {
    positives.push("Architecture document exists.");
  } else {
    makeFinding(findings, {
      id: "DOC-002",
      severity: "medium",
      category: "Documentation truth",
      title: "No dedicated architecture document was detected",
      impact: "Reviewers need a stable source of truth for macro architecture, data boundaries, and runtime flow.",
      recommendation: "Add docs/ARCHITECTURE.md or an equivalent architecture decision record.",
    });
  }

  if (frameworkSignals.drizzle && !frameworkSignals.prisma) {
    const prismaMentions = findLineMatches(files, /\bPrisma\b|@prisma\/client|PrismaClient/gu, {
      limit: 12,
      exclude: (file) => !file.relativePath.startsWith("docs/"),
    });
    if (prismaMentions.length > 0) {
      makeFinding(findings, {
        id: "DOC-003",
        severity: "medium",
        category: "Documentation truth",
        title: "Documentation mentions Prisma while runtime signals point to Drizzle",
        impact: "Architecture docs can mislead engineers about migration and query ownership.",
        recommendation: "Update PRD/architecture docs so the documented ORM matches the actual runtime ORM.",
        evidence: prismaMentions,
      });
    }
  }

  const staleClaims = findLineMatches(files, /\b(TODO|TBD|not yet|placeholder|mock only|demo only)\b/giu, {
    limit: 20,
    exclude: (file) => !file.relativePath.startsWith("docs/") || file.relativePath === "docs/architecture-review-agent.md",
  });
  if (staleClaims.length > 8) {
    makeFinding(findings, {
      id: "DOC-004",
      severity: "low",
      category: "Documentation truth",
      title: "Docs contain many roadmap or placeholder claims",
      impact: "Customers and builders can confuse planned work with shipped architecture.",
      recommendation: "Separate shipped truth, demo truth, and roadmap items into visibly different sections.",
      evidence: staleClaims,
    });
  }
}

function analyzeMaintainability(sourceFiles, findings, positives) {
  const largeFiles = sourceFiles
    .filter((file) => file.lineCount > 900 && file.relativePath !== "scripts/architecture-review-agent.mjs")
    .sort((a, b) => b.lineCount - a.lineCount)
    .slice(0, 10);
  if (largeFiles.length > 0) {
    makeFinding(findings, {
      id: "MAINT-001",
      severity: "low",
      category: "Code maintainability",
      title: "Very large source files were detected",
      impact: "Large files tend to accumulate unrelated responsibilities and become harder to review safely.",
      recommendation: "Split only when a clear boundary exists: schema domain, route group, feature module, or shared helper.",
      evidence: largeFiles.map((file) => ({ file: file.relativePath, line: 1, snippet: `${file.lineCount} lines` })),
    });
  } else {
    positives.push("No source files above the large-file threshold were detected.");
  }

  const anyCount = sourceFiles.reduce((sum, file) => sum + countMatches(file.content, /\bas any\b|: any\b|<any>/gu), 0);
  if (anyCount > 80) {
    makeFinding(findings, {
      id: "MAINT-002",
      severity: "low",
      category: "Code maintainability",
      title: "High TypeScript any usage was detected",
      impact: "Loose typing weakens compile-time guarantees around architecture boundaries.",
      recommendation: "Tighten types first in shared database, auth, and router interfaces.",
      evidence: findLineMatches(sourceFiles, /\bas any\b|: any\b|<any>/gu, { limit: 12 }),
    });
  }

  const todoMarkers = findLineMatches(sourceFiles, /\b(TODO|FIXME|HACK)\b/gu, { limit: 20 });
  if (todoMarkers.length > 12) {
    makeFinding(findings, {
      id: "MAINT-003",
      severity: "low",
      category: "Code maintainability",
      title: "Many TODO/FIXME/HACK markers were detected",
      impact: "Untracked code debt can hide release blockers.",
      recommendation: "Convert important markers into tracked issues and remove stale comments.",
      evidence: todoMarkers,
    });
  }
}

function findLineNumber(content, needle) {
  const index = content.indexOf(needle);
  if (index === -1) return 1;
  return content.slice(0, index).split(/\r?\n/u).length;
}

function scoreFindings(findings) {
  const categoryScores = {};
  for (const [category, weight] of Object.entries(CATEGORY_WEIGHTS)) {
    const penalty = findings
      .filter((finding) => finding.category === category)
      .reduce((sum, finding) => sum + SEVERITY_PENALTY[finding.severity], 0);
    categoryScores[category] = Math.max(0, weight - penalty);
  }

  const overall = Object.values(categoryScores).reduce((sum, score) => sum + score, 0);
  return {
    overall,
    max: 100,
    grade: gradeForScore(overall),
    categories: categoryScores,
    severityCounts: findings.reduce((acc, finding) => {
      acc[finding.severity] = (acc[finding.severity] ?? 0) + 1;
      return acc;
    }, {}),
  };
}

function gradeForScore(score) {
  if (score >= 90) return "A / ship-ready architecture";
  if (score >= 80) return "B / strong with targeted fixes";
  if (score >= 70) return "C / usable but needs architecture cleanup";
  if (score >= 60) return "D / high-risk";
  return "F / not ready";
}

function sortFindings(findings) {
  const order = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };
  return [...findings].sort((a, b) => order[a.severity] - order[b.severity] || a.id.localeCompare(b.id));
}

function severityLabel(severity) {
  return severity.toUpperCase();
}

function renderMarkdown(report) {
  const findingRows = report.findings
    .map((finding) => `| ${severityLabel(finding.severity)} | ${finding.category} | ${finding.id} | ${escapeTable(finding.title)} |`)
    .join("\n");

  const scoreRows = Object.entries(report.scores.categories)
    .map(([category, score]) => `| ${category} | ${score}/${CATEGORY_WEIGHTS[category]} |`)
    .join("\n");

  const stack = report.metrics.stack.length > 0 ? report.metrics.stack.join(", ") : "not detected";
  const topFindings = report.findings
    .filter((finding) => finding.severity !== "info")
    .slice(0, 5)
    .map((finding) => `- ${severityLabel(finding.severity)} ${finding.id}: ${finding.title}`)
    .join("\n");

  return `# Architecture Review Agent Report

Generated: ${report.generatedAt}

Workspace: \`${report.metrics.workspaceRoot}\`
${report.options.productWorkspace ? `Product workspace focus: \`${report.options.productWorkspace}\`\n` : ""}
Overall review score: **${report.scores.overall}/100**
Grade: **${report.scores.grade}**

## Executive View

- Stack detected: ${stack}.
- Scope scanned: ${report.metrics.scannedFiles} files, ${report.metrics.totalLines} readable lines, ${report.metrics.packages} package manifests.
- Runtime surface: ${report.metrics.appPages} pages, ${report.metrics.appApiRoutes} API routes, ${report.metrics.trpcRouters} tRPC routers.
- Data surface: ${report.metrics.schemaFiles} schema files, ${report.metrics.migrationFiles} migration files.
- Quality surface: ${report.metrics.testFiles} tests/specs, ${report.metrics.e2eSignals} E2E signals, ${report.metrics.ciFiles} CI workflows.

## Review Score

| Category | Score |
| --- | ---: |
${scoreRows}

## Top Findings

${topFindings || "- No blocking findings were detected."}

## Finding Index

| Severity | Category | ID | Finding |
| --- | --- | --- | --- |
${findingRows || "| INFO | All | NONE | No findings generated. |"}

## Detailed Findings

${report.findings.map(renderFinding).join("\n\n")}

## Positive Signals

${report.positives.map((item) => `- ${item}`).join("\n") || "- None recorded."}

## Minute-Level Checklist Covered

- Database env variables and connection factories.
- Migration and schema replay signals.
- Tenant/workspace isolation, search path, and RLS signals.
- Product workspace catalog, live/demo/mock status, and module routing signals.
- API, tRPC, auth, RBAC, and sensitive operational route signals.
- Build, lint, typecheck, test, E2E, CI, deployment, health, logging, and audit signals.
- Documentation drift, stale claims, large source files, TODO/FIXME markers, and TypeScript looseness.

## Rerun Command

\`\`\`powershell
pnpm arch:review -- --workspace "${report.metrics.workspaceRoot.replaceAll("\\", "\\\\")}"${report.options.productWorkspace ? ` --product-workspace ${report.options.productWorkspace}` : ""}
\`\`\`
`;
}

function renderFinding(finding) {
  const evidence =
    finding.evidence.length > 0
      ? finding.evidence.map((item) => `  - \`${item.file}:${item.line}\` - ${item.snippet}`).join("\n")
      : "  - No direct file evidence.";

  return `### ${severityLabel(finding.severity)} ${finding.id}: ${finding.title}

Category: ${finding.category}

Impact: ${finding.impact}

Recommendation: ${finding.recommendation}

Evidence:
${evidence}`;
}

function escapeTable(value) {
  return value.replaceAll("|", "\\|");
}

function writeOutputs(report, outputDir, format) {
  mkdirSync(outputDir, { recursive: true });
  const timestamp = report.generatedAt.replace(/[:.]/gu, "-");
  const base = `architecture-review-${timestamp}`;
  const outputs = [];

  if (format === "markdown" || format === "both") {
    const markdownPath = join(outputDir, `${base}.md`);
    writeFileSync(markdownPath, renderMarkdown(report), "utf8");
    outputs.push(markdownPath);
  }

  if (format === "json" || format === "both") {
    const jsonPath = join(outputDir, `${base}.json`);
    writeFileSync(jsonPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
    outputs.push(jsonPath);
  }

  return outputs;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!existsSync(args.workspace) || !statSync(args.workspace).isDirectory()) {
    throw new Error(`Workspace path does not exist or is not a directory: ${args.workspace}`);
  }

  const scan = walkWorkspace(args.workspace, args);
  const report = analyzeWorkspace(args.workspace, scan, args);
  const outputs = writeOutputs(report, args.output, args.format);

  console.log(`Architecture review complete: ${report.scores.overall}/100 (${report.scores.grade})`);
  console.log(`Findings: ${report.findings.length} total; ${JSON.stringify(report.scores.severityCounts)}`);
  for (const output of outputs) {
    console.log(`Wrote ${output}`);
  }
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}

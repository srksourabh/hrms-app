import { readFileSync, readdirSync } from "node:fs";
import { extname, join, resolve } from "node:path";
import process from "node:process";

const root = resolve(import.meta.dirname, "..");
const excludedDirectories = new Set([".git", ".next", "node_modules", "test-results", ".turbo", "coverage"]);
const excludedFiles = new Set([".env", ".env.local"]);
const textExtensions = new Set([".ts", ".tsx", ".js", ".mjs", ".json", ".jsonl", ".yaml", ".yml", ".toml", ".md"]);
const patterns = [
  ["private key", /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/gu],
  ["OpenAI-style key", /\bsk-(?:proj-)?[A-Za-z0-9_-]{20,}\b/gu],
  ["Google API key", /\bAIza[0-9A-Za-z_-]{30,}\b/gu],
  ["GitHub token", /\bgh[pousr]_[0-9A-Za-z]{20,}\b/gu],
  ["Slack token", /\bxox[baprs]-[0-9A-Za-z-]{20,}\b/gu],
  ["AWS access key", /\bAKIA[0-9A-Z]{16}\b/gu],
  [
    "credentialed database URL",
    /\b(?:postgres(?:ql)?|mysql|mongodb(?:\+srv)?):\/\/[^\s:/]+:[^\s@/]+@[^\s]+/giu,
    (value) => /(?:@localhost|@127\.0\.0\.1|@db(?:[:/]|$)|@postgres(?:[:/]|$)|example|\$\{)/iu.test(value),
  ],
  ["JWT", /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/gu],
];

function walk(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (excludedDirectories.has(entry.name)) return [];
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return walk(path);
    if (excludedFiles.has(entry.name)) return [];
    if (entry.name === ".env.example" || textExtensions.has(extname(entry.name))) return [path];
    return [];
  });
}

const hits = [];
let scannedFiles = 0;
for (const file of walk(root)) {
  scannedFiles += 1;
  const content = readFileSync(file, "utf8");
  for (const [label, pattern, allowed] of patterns) {
    for (const match of content.matchAll(pattern)) {
      const value = match[0];
      if (!allowed?.(value)) hits.push(`${file}: ${label}`);
    }
  }
}

if (hits.length > 0) {
  console.error(hits.join("\n"));
  process.exit(1);
}

console.log(`High-confidence secret scan passed: ${scannedFiles} text files scanned.`);

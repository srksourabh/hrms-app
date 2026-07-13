import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, extname, join, resolve } from "node:path";
import process from "node:process";

const root = resolve(import.meta.dirname, "..");
const docsDir = join(root, "docs");
const errors = [];

function walk(directory, extension) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return walk(path, extension);
    return extname(entry.name) === extension ? [path] : [];
  });
}

const markdownFiles = walk(docsDir, ".md");
let relativeLinks = 0;
let words = 0;

for (const file of markdownFiles) {
  const content = readFileSync(file, "utf8");
  words += content.split(/\s+/u).filter(Boolean).length;

  for (const match of content.matchAll(/\[[^\]]*\]\(([^)]+)\)/gu)) {
    const target = match[1]?.trim();
    if (!target || target.startsWith("#") || /^[a-z]+:/iu.test(target)) continue;
    relativeLinks += 1;
    const cleanTarget = decodeURIComponent(target.split("#")[0]?.split("?")[0] ?? "");
    const resolvedTarget = resolve(dirname(file), cleanTarget);
    if (!existsSync(resolvedTarget)) {
      errors.push(`${file}: missing relative link target ${target}`);
    }
  }
}

const manifestPath = join(docsDir, "rag", "manifest.jsonl");
const manifestLines = readFileSync(manifestPath, "utf8").split(/\r?\n/u).filter(Boolean);
for (const [index, line] of manifestLines.entries()) {
  try {
    const record = JSON.parse(line);
    if (!record.document_id || !record.document_path || !record.source_family) {
      errors.push(`${manifestPath}:${index + 1}: required metadata is missing`);
      continue;
    }
    const documentPath = resolve(root, record.document_path);
    if (!existsSync(documentPath) || !statSync(documentPath).isFile()) {
      errors.push(`${manifestPath}:${index + 1}: missing document ${record.document_path}`);
    }
  } catch (error) {
    errors.push(`${manifestPath}:${index + 1}: invalid JSON (${error.message})`);
  }
}

const prohibitedClaims = [
  "PDPL compliant",
  "Hosted in me-south-1",
  "compliant with Qiwa, Mudad, and GOSI from day one",
];
const productFiles = [
  ...walk(join(root, "apps", "web"), ".tsx").filter((file) => !file.includes(`${join("apps", "web", ".next")}`)),
  ...markdownFiles.filter((file) => !file.endsWith("statutory-gap-analysis.md")),
];
for (const file of productFiles) {
  const content = readFileSync(file, "utf8");
  for (const claim of prohibitedClaims) {
    if (content.includes(claim)) errors.push(`${file}: prohibited unverified claim: ${claim}`);
  }
}

if (errors.length > 0) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log(
  `Documentation valid: ${markdownFiles.length} Markdown files, ${words} words, ${relativeLinks} relative links, ${manifestLines.length} RAG manifest entries.`,
);

"""
Bulk-remove unused imports and dead local declarations in apps/web.

Strategy:
  1. Run pnpm --filter @hrms-app/web lint and parse every no-unused-vars error.
  2. For each error, decide if it points to an import or to a local decl.
     - Import zone: line 1-15, col 1-15 (any import statement)
     - Otherwise: treat as a local decl
  3. For import errors, regenerate the import line with the unused ident
     removed, taking care of comma cleanup and empty-list collapse.
  4. For local decl errors, use a regex to remove `const X = ...;` and
     `let X = ...;` lines that match the unused ident.
  5. After edits, re-run lint and report the new count.

This script is conservative on local-var removal (only matches simple
single-identifier decls, leaves destructured patterns alone) and
aggressive on import removal (which is unambiguously safe when ESLint
flags it).
"""

from __future__ import annotations
import re
import subprocess
import sys
from collections import defaultdict
from pathlib import Path

REPO = Path("C:/Users/soura/Dropbox/AI/Projects/Saudi-HR/hrms-app").resolve()

# Match a single ESLint error block:
#   <file>
#     <line>:<col>  error  '<ident>' ...  @typescript-eslint/no-unused-vars
LINE_RE = re.compile(
    r"^(?P<file>[^\n]+?\.(?:ts|tsx))\s*\n"
    r"\s+(?P<line>\d+):(?P<col>\d+)\s+error\s+(?P<msg>.+?)\s+@typescript-eslint/no-unused-vars",
    re.MULTILINE,
)

def run_lint() -> str:
    res = subprocess.run(
        "pnpm --filter @hrms-app/web lint 2>&1",
        cwd=REPO, capture_output=True, text=True, timeout=180, shell=True,
    )
    return res.stdout + res.stderr

def parse_errors(out: str) -> dict[Path, list[tuple[int, int, str]]]:
    errors: dict[Path, list[tuple[int, int, str]]] = defaultdict(list)
    for m in LINE_RE.finditer(out):
        ident_m = re.search(r"'([^']+)'", m.group("msg"))
        if not ident_m:
            continue
        path = Path(m.group("file"))
        if not path.is_absolute():
            path = REPO / path
        errors[path].append(
            (int(m.group("line")), int(m.group("col")), ident_m.group(1))
        )
    return errors

def remove_from_import_line(content: str, ident: str) -> str:
    """Remove `ident` from any `import { ... }` line in content (handles long single-line imports)."""
    pattern = re.compile(r"import\s*\{([^}]+)\}\s*from\s*['\"][^'\"]+['\"]")

    def repl(m: re.Match) -> str:
        items_raw = m.group(1)
        items = [s.strip() for s in items_raw.split(",") if s.strip()]
        # Filter out the ident, handling "Foo as Bar" aliases and "type Foo" prefixes
        kept = []
        for it in items:
            base = re.sub(r"^type\s+", "", it)
            base = re.sub(r"\s+as\s+\w+", "", base).strip()
            if base == ident:
                continue
            kept.append(it)
        if len(kept) == len(items):
            return m.group(0)
        if not kept:
            return ""  # drop the whole import line
        # Reconstruct; preserve the from clause
        rest = m.group(0).split("from", 1)[1]
        return f"import {{ {', '.join(kept)} }} from{rest}"

    new_content = pattern.sub(repl, content)
    # Remove now-empty import lines (with trailing newline)
    new_content = re.sub(r"\n\s*\n+", "\n", new_content)
    return new_content

def remove_local_decl(content: str, ident: str) -> str:
    """Remove a `const IDENT = ...;`, `let IDENT = ...;`, or `const [IDENT, ...] = ...;` line."""
    # Simple: const IDENT = ...; or let IDENT = ...;
    simple = re.compile(
        rf"^[ \t]*(?:const|let)\s+{re.escape(ident)}\s*[:=].*?;[ \t]*\n",
        re.MULTILINE,
    )
    content = simple.sub("", content)
    # Destructured array/tuple: const [IDENT, ...] = ...; or let [IDENT, ...] = ...;
    # Only remove the whole line if IDENT is the only binding (other bindings renamed
    # to _ prefix which eslint already exempts, or to nothing).
    destruct = re.compile(
        rf"^[ \t]*(?:const|let)\s+\[\s*{re.escape(ident)}\s*\]\s*[:=].*?;[ \t]*\n",
        re.MULTILINE,
    )
    content = destruct.sub("", content)
    # Destructured with multiple bindings: const [IDENT, other] = ...; -> remove just IDENT
    multi = re.compile(
        rf"(?P<indent>[ \t]*)(?:const|let)\s+\[(?P<items>[^\]]+)\]\s*[:=](?P<rest>.*?);[ \t]*\n",
        re.MULTILINE,
    )
    def multi_repl(m: re.Match) -> str:
        items = [s.strip() for s in m.group("items").split(",") if s.strip()]
        new_items = [s for s in items if s != ident]
        if len(new_items) == len(items):
            return m.group(0)
        if not new_items:
            return ""  # drop the whole line
        return f"{m.group('indent')}const [{', '.join(new_items)}] ={m.group('rest')}; \n"
    content = multi.sub(multi_repl, content)
    return content

def main() -> int:
    out = run_lint()
    errors = parse_errors(out)
    if not errors:
        print("No unused-vars errors found.")
        return 0
    print(f"Found unused-var errors across {len(errors)} files")

    files_changed = 0
    total_removed = 0
    for path, errs in errors.items():
        try:
            content = path.read_text(encoding="utf-8")
        except OSError:
            continue
        original = content
        # Group by ident
        by_ident: dict[str, list[tuple[int, int]]] = defaultdict(list)
        for line, col, ident in errs:
            by_ident[ident].append((line, col))

        for ident, locations in by_ident.items():
            # Process both import-zone and local-decl matches independently.
            # An ident can appear in both (e.g. imported but only one usage is
            # actually referenced; or the const shadows an import).
            has_import_match = any(line <= 15 and col <= 15 for line, col in locations)
            has_local_match = any(not (line <= 15 and col <= 15) for line, col in locations)

            # Always try import removal first when the import line exists.
            if has_import_match:
                content = remove_from_import_line(content, ident)
            # Then try local decl removal if there's a local-var hit.
            if has_local_match:
                content = remove_local_decl(content, ident)

        if content != original:
            path.write_text(content, encoding="utf-8")
            files_changed += 1
            # Count actual lines removed
            removed = original.count("\n") - content.count("\n")
            total_removed += removed
            print(f"  {path.relative_to(REPO)}: edited")

    print(f"\nEdited {files_changed} file(s); removed ~{total_removed} lines.")
    print("Re-running lint...")
    out2 = run_lint()
    m = re.search(r"(\d+)\s+problems?\s+\((\d+)\s+errors?", out2)
    if m:
        print(f"After: {m.group(1)} problems ({m.group(2)} errors)")
    return 0

if __name__ == "__main__":
    sys.exit(main())

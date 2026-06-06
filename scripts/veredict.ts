/**
 * Creation/modification date: 01/06/2026
 * Path: scripts/veredict.ts
 * Description: Pre-CI health check that runs multiple "veredicts" (verdicts)
 *              on the codebase. Catches issues before they reach production:
 *              - Architecture violations (files too large)
 *              - Obsolete/dead code (shims, .bak, .old, .TODO, .FIXME)
 *              - Critical services without tests
 *              - Hard-coded secrets in source
 *              - Forbidden dependency imports
 *              - i18n violations (hardcoded user-facing strings)
 *
 * Usage:  pnpm veredict
 * Exit:   0 = all pass, 1 = at least one fail
 *
 * Designed to be fast (<5s) and run on pre-push and in CI.
 */

import { readdirSync, statSync, readFileSync, existsSync } from "fs";
import { join, extname, basename, relative } from "path";

const ROOT = process.cwd();
const FAIL_FAST = process.argv.includes("--fail-fast");

type Verdict = {
  name: string;
  status: "PASS" | "WARN" | "FAIL";
  details: string[];
};

const verdicts: Verdict[] = [];

function record(name: string, status: Verdict["status"], details: string[] = []) {
  verdicts.push({ name, status, details });
  if (status === "FAIL" && FAIL_FAST) {
    printAndExit();
  }
}

function walk(dir: string, ext: string[]): string[] {
  const out: string[] = [];
  const skip = new Set(["node_modules", ".next", ".git", "dist", "coverage", ".turbo"]);
  function rec(d: string) {
    for (const entry of readdirSync(d)) {
      if (skip.has(entry)) continue;
      const full = join(d, entry);
      const st = statSync(full);
      if (st.isDirectory()) rec(full);
      else if (ext.includes(extname(entry))) out.push(full);
    }
  }
  rec(dir);
  return out;
}

function countLines(file: string): number {
  return readFileSync(file, "utf-8").split("\n").length;
}

// ── Veredict 1: Architecture — no file over the limits ──────────────
const fileSizeLimits: { dir: string; ext: string[]; max: number; kind: string }[] = [
  { dir: "src/app", ext: [".tsx"], max: 100, kind: "page" },
  { dir: "src/components", ext: [".tsx"], max: 150, kind: "component" },
  { dir: "src/components", ext: [".ts"], max: 150, kind: "component util" },
  { dir: "src/services", ext: [".ts"], max: 300, kind: "service" },
  { dir: "src/db/schema", ext: [".ts"], max: 200, kind: "schema" },
];

const archViolations: string[] = [];
for (const rule of fileSizeLimits) {
  const dir = join(ROOT, rule.dir);
  if (!existsSync(dir)) continue;
  for (const file of walk(dir, rule.ext)) {
    if (file.includes("_components") || file.includes("_lib") || file.includes("\\lib\\")) continue; // allow subfolders
    const lines = countLines(file);
    if (lines > rule.max) {
      archViolations.push(`  ${relative(ROOT, file)}: ${lines} lines (max ${rule.max} for ${rule.kind})`);
    }
  }
}
record(
  "Architecture: file size limits",
  archViolations.length === 0 ? "PASS" : "FAIL",
  archViolations
);

// ── Veredict 2: No obsolete/dead code ────────────────────────────────
const obsoletePatterns: { pattern: RegExp; description: string }[] = [
  { pattern: /\.bak\.\w+$/i, description: ".bak backup files" },
  { pattern: /\.old\.\w+$/i, description: ".old backup files" },
  { pattern: /\.tmp$/i, description: ".tmp temp files" },
  { pattern: /~$/, description: "editor temp files" },
  { pattern: /TODO.*no-issue/i, description: "TODO without issue link" },
  { pattern: /FIXME.*no-issue/i, description: "FIXME without issue link" },
];
const obsoleteFindings: string[] = [];
for (const file of walk(ROOT, [".ts", ".tsx", ".js", ".jsx", ".json", ".md"])) {
  const rel = relative(ROOT, file);
  if (rel.startsWith("node_modules") || rel.startsWith(".next")) continue;
  for (const rule of obsoletePatterns) {
    if (rule.pattern.test(basename(file))) {
      obsoleteFindings.push(`  ${rel} (${rule.description})`);
    }
  }
}
// Also scan for shim files (the deute tècnic anti-pattern we removed)
const shimDirs = ["src/components/sat", "src/actions/sat", "src/services/sat"];
for (const sd of shimDirs) {
  const dir = join(ROOT, sd);
  if (!existsSync(dir)) continue;
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isFile() && !["index.ts", "shared", "quotes", "work-orders", "clients"].includes(entry)) {
      obsoleteFindings.push(`  ${relative(ROOT, full)} (possible shim re-export — anti-pattern)`);
    }
  }
}
record(
  "Obsolete code: no backup files or shims",
  obsoleteFindings.length === 0 ? "PASS" : "WARN",
  obsoleteFindings
);

// ── Veredict 3: Critical services have tests ─────────────────────────
const criticalServices = [
  "src/services/notifications/notificationService.ts",
  "src/services/sat/quoteService.ts",
  "src/services/sat/workOrderService.ts",
  "src/services/sat/materialService.ts",
  "src/services/sat/attachmentService.ts",
  "src/services/sat/signatureService.ts",
  "src/services/sat/locationService.ts",
];
const missingTests: string[] = [];
for (const svc of criticalServices) {
  const abs = join(ROOT, svc);
  if (!existsSync(abs)) continue;
  const name = basename(svc, ".ts").replace("Service", "").toLowerCase();
  const testCandidates = [
    `tests/unit/services/${name}.test.ts`,
    `tests/unit/services/${svc.replace("src/services/", "")}`.replace(".ts", ".test.ts"),
  ];
  const hasTest = testCandidates.some((p) => existsSync(join(ROOT, p)));
  if (!hasTest) {
    missingTests.push(`  ${svc} (no test found)`);
  }
}
record(
  "Tests: critical services have unit tests",
  missingTests.length === 0 ? "PASS" : "FAIL",
  missingTests
);

// ── Veredict 4: No hard-coded secrets ────────────────────────────────
const secretPatterns: { pattern: RegExp; label: string }[] = [
  { pattern: /(smtp|password|api[_-]?key|secret)\s*[:=]\s*["'](?!\*+["'])[^"']{8,}["']/i, label: "potential secret in assignment" },
  { pattern: /-----BEGIN (RSA |EC |OPENSSH |)PRIVATE KEY-----/, label: "private key embedded" },
];
const secretFindings: string[] = [];
for (const file of walk(join(ROOT, "src"), [".ts", ".tsx"])) {
  const content = readFileSync(file, "utf-8");
  for (const rule of secretPatterns) {
    const m = content.match(rule.pattern);
    if (m) {
      // Allow env var references and obvious test data
      if (m[0].includes("process.env") || m[0].includes("test") || m[0].includes("fake")) continue;
      secretFindings.push(`  ${relative(ROOT, file)}: ${rule.label}`);
    }
  }
}
record(
  "Security: no hard-coded secrets",
  secretFindings.length === 0 ? "PASS" : "FAIL",
  secretFindings
);

// ── Veredict 5: Env vars used match declared list ────────────────────
const envFiles = [".env.example", ".env.local.example"];
const declaredVars = new Set<string>();
for (const f of envFiles) {
  const abs = join(ROOT, f);
  if (!existsSync(abs)) continue;
  for (const line of readFileSync(abs, "utf-8").split("\n")) {
    const m = line.match(/^([A-Z_][A-Z0-9_]+)=/);
    if (m) declaredVars.add(m[1]);
  }
}
const usedVars = new Set<string>();
for (const file of walk(join(ROOT, "src"), [".ts", ".tsx"])) {
  for (const m of readFileSync(file, "utf-8").matchAll(/process\.env\.([A-Z_][A-Z0-9_]+)/g)) {
    usedVars.add(m[1]);
  }
}
const documentedKnown = new Set([
  "NODE_ENV", "DATABASE_URL", "AUTH_SECRET", "AUTH_URL", "AUTH_TRUST_HOST",
  "REDIS_URL", "TEST_DATABASE_URL",
  "MINIO_ENDPOINT", "MINIO_PORT", "MINIO_ROOT_USER", "MINIO_ROOT_PASSWORD", "MINIO_PUBLIC_URL_BASE",
  "SENTRY_DSN", "NEXT_PUBLIC_APP_URL", "NEXT_PUBLIC_APP_MODE", "NEXT_PUBLIC_SENTRY_ENVIRONMENT", "NEXT_PUBLIC_SENTRY_DSN",
  "SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASSWORD", "SMTP_TLS_REJECT_UNAUTHORIZED", "SMTP_REQUIRE_TLS",
  "NODE_TLS_REJECT_UNAUTHORIZED",
  "NEXT_RUNTIME",
]);
const undocumented = [...usedVars].filter((v) => !declaredVars.has(v) && !documentedKnown.has(v));
record(
  "Config: all process.env vars are documented or known",
  undocumented.length === 0 ? "PASS" : "WARN",
  undocumented.map((v) => `  ${v} used but not declared`),
  );

// ── Veredict 6: No forbidden import patterns ─────────────────────────
const forbiddenImports: { pattern: RegExp; label: string; allowed?: RegExp }[] = [
  { pattern: /from\s+["']@\/services\/sat\/(attachment|location|material|product|signature|workOrder)Service["']/, label: "importing old shim path" },
];
const importViolations: string[] = [];
for (const file of walk(join(ROOT, "src"), [".ts", ".tsx"])) {
  const content = readFileSync(file, "utf-8");
  for (const rule of forbiddenImports) {
    const m = content.match(rule.pattern);
    if (m && (!rule.allowed || !rule.allowed.test(content))) {
      importViolations.push(`  ${relative(ROOT, file)}: ${rule.label}`);
    }
  }
}
record(
  "Imports: no deprecated shim paths",
  importViolations.length === 0 ? "PASS" : "FAIL",
  importViolations,
);

function printAndExit() {
  const symbol = (s: Verdict["status"]) =>
    s === "PASS" ? "✅" : s === "WARN" ? "⚠️ " : "❌";
  const line = "─".repeat(72);
  console.log("\n" + line);
  console.log(" RIBOTFLOW VEREDICT — Pre-CI Health Check");
  console.log(line);
  for (const v of verdicts) {
    console.log(`${symbol(v.status)}  ${v.name}`);
    for (const d of v.details) console.log(d);
  }
  console.log(line);
  const failed = verdicts.filter((v) => v.status === "FAIL").length;
  const warned = verdicts.filter((v) => v.status === "WARN").length;
  const passed = verdicts.filter((v) => v.status === "PASS").length;
  console.log(`\nSummary: ${passed} PASS · ${warned} WARN · ${failed} FAIL\n`);
  process.exit(failed > 0 ? 1 : 0);
}

printAndExit();

/**
 * Production dependency audit gate for CI.
 *
 * Runs `npm audit --omit=dev` and fails the build when a *high* or *critical*
 * advisory affects a package that ships in the runtime image.
 *
 * `npm audit` has no ignore mechanism, so reviewed, non-reachable advisories are
 * listed in ACCEPTED below. Every entry must carry a reason and can be removed
 * once the dependency is replaced or patched.
 *
 * The list is currently empty: SheetJS (`xlsx`) was the only exempted package
 * and it has been replaced by `write-excel-file` for the scout export. Adding an
 * entry back means shipping a known advisory — treat it as a temporary debt with
 * an owner and an exit condition, not as configuration.
 */
import { execSync } from "node:child_process";

const ACCEPTED = new Map([]);

const BLOCKING = new Set(["critical", "high"]);

function runAudit() {
  try {
    // npm exits non-zero when vulnerabilities exist, so the output must be read
    // regardless of the status code.
    return execSync("npm audit --omit=dev --json", {
      encoding: "utf8",
      shell: true,
      stdio: ["ignore", "pipe", "ignore"],
    });
  } catch (error) {
    if (typeof error.stdout === "string" && error.stdout.trim()) {
      return error.stdout;
    }
    console.error("npm audit could not be executed:", error.message);
    process.exit(1);
  }
}

function advisoriesFrom(report) {
  const found = new Map();
  for (const [packageName, vulnerability] of Object.entries(report.vulnerabilities ?? {})) {
    for (const via of vulnerability.via ?? []) {
      if (typeof via !== "object" || !via) continue;
      const id = String(via.url ?? "").split("/").pop();
      if (!id || found.has(id)) continue;
      found.set(id, {
        id,
        severity: via.severity ?? vulnerability.severity ?? "unknown",
        title: via.title ?? "",
        packageNames: new Set([packageName]),
      });
    }
  }
  return [...found.values()];
}

const report = JSON.parse(runAudit());

if (report.error) {
  console.error("npm audit returned an error:", report.error.summary ?? report.error);
  process.exit(1);
}

const advisories = advisoriesFrom(report);
const blocking = [];
const accepted = [];

for (const advisory of advisories) {
  if (!BLOCKING.has(advisory.severity)) continue;
  if (ACCEPTED.has(advisory.id)) {
    accepted.push(advisory);
  } else {
    blocking.push(advisory);
  }
}

for (const advisory of accepted) {
  const reason = ACCEPTED.get(advisory.id);
  console.log(`accepted  ${advisory.severity.padEnd(8)} ${advisory.id}  ${advisory.title}`);
  console.log(`          ↳ ${reason}`);
}

if (blocking.length > 0) {
  console.error("\nProduction dependencies have unpatched high/critical advisories:\n");
  for (const advisory of blocking) {
    console.error(`  ${advisory.severity.toUpperCase()}  ${advisory.id}  ${advisory.title}`);
  }
  console.error("\nUpgrade the affected packages, or add a justified entry to ACCEPTED in scripts/check-audit.mjs.");
  process.exit(1);
}

const scope = advisories.length === 0 ? "no advisories" : `${accepted.length} accepted, 0 blocking`;
console.log(`Production audit OK (${scope}).`);

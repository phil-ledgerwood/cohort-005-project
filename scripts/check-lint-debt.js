// A ratchet on the size-rule exemptions in .oxlintrc.json.
//
// The explicit file lists that turn max-lines, max-lines-per-function,
// max-params and max-depth "off" are debt. This script lints without them,
// counts the violations per rule, and compares the counts with
// lint-debt.json. More violations fail. Fewer ask you to lower the baseline.
//
// It counts violations, not exempted files, so splitting a file and moving
// its exemption to the new files is free; writing a new long function is not.
//
// Usage: node scripts/check-lint-debt.js [--update]

import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const SIZE_RULES = [
  "max-lines",
  "max-lines-per-function",
  "max-params",
  "max-depth",
];
const LINTED = ["app", "scripts", "request-logger"];
const BASELINE = "lint-debt.json";

// .oxlintrc.json allows full-line // comments; JSON.parse does not.
const config = JSON.parse(
  readFileSync(".oxlintrc.json", "utf8")
    .split("\n")
    .filter((line) => !/^\s*\/\//.test(line))
    .join("\n")
);

const isGlob = (file) => file.includes("*");

// Keep each size rule's settings, and the overrides that are policy (globs,
// such as "tests may have long functions"). Drop the per-file exemptions.
const debtConfig = {
  rules: Object.fromEntries(
    SIZE_RULES.map((rule) => [rule, config.rules[rule]])
  ),
  overrides: config.overrides
    .filter(({ files }) => files.every(isGlob))
    .map(({ files, rules }) => ({
      files,
      rules: Object.fromEntries(
        Object.entries(rules).filter(([rule]) => SIZE_RULES.includes(rule))
      ),
    }))
    .filter(({ rules }) => Object.keys(rules).length > 0),
};

const dir = mkdtempSync(join(tmpdir(), "lint-debt-"));
const configPath = join(dir, "oxlintrc.json");
writeFileSync(configPath, JSON.stringify(debtConfig));

let output;
try {
  output = execFileSync(
    "npx",
    ["oxlint", "-c", configPath, "-f", "json", ...LINTED],
    {
      encoding: "utf8",
      maxBuffer: 64 * 1024 * 1024,
      stdio: ["ignore", "pipe", "ignore"],
    }
  );
} catch (error) {
  // oxlint exits 1 when it finds anything, which is the normal case here.
  output = error.stdout;
} finally {
  rmSync(dir, { recursive: true, force: true });
}

const counts = Object.fromEntries(SIZE_RULES.map((rule) => [rule, 0]));
for (const { code } of JSON.parse(output).diagnostics) {
  const rule = SIZE_RULES.find((name) => code === `eslint(${name})`);
  if (rule) counts[rule] += 1;
}

if (process.argv.includes("--update")) {
  writeFileSync(BASELINE, `${JSON.stringify(counts, null, 2)}\n`);
  console.log(`Wrote ${BASELINE}:`, counts);
  process.exit(0);
}

const baseline = JSON.parse(readFileSync(BASELINE, "utf8"));
const grown = SIZE_RULES.filter((rule) => counts[rule] > baseline[rule]);
const shrunk = SIZE_RULES.filter((rule) => counts[rule] < baseline[rule]);

if (grown.length > 0) {
  console.error("The size-rule debt grew:\n");
  for (const rule of grown) {
    console.error(`  ${rule}: ${baseline[rule]} -> ${counts[rule]}`);
  }
  console.error(`
New code meets the size rules: break the new function, file, parameter list
or nesting up. Adding a file to an exemption list in .oxlintrc.json does not
help: this check ignores those lists. Moving code that was already exempt into
a new file is fine, since the count does not change.`);
  process.exit(1);
}

if (shrunk.length > 0) {
  console.error(
    `The size-rule debt shrank (${shrunk.join(", ")}). Lock it in: run \`node scripts/check-lint-debt.js --update\` and commit ${BASELINE}.`
  );
  process.exit(1);
}

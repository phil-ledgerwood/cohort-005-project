// Fails when a module in app/modules/ has no tests. Every module's entry
// points are its contract, and app/modules/README.md says tests go through
// them, in <module>/tests/.
// Usage: node scripts/check-module-tests.js

import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

const MODULES = "app/modules";
const isTest = (file) => /\.test\.tsx?$/.test(file);

const untested = readdirSync(MODULES, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map(({ name }) => name)
  .filter((name) => {
    const tests = join(MODULES, name, "tests");
    return !existsSync(tests) || !readdirSync(tests).some(isTest);
  });

if (untested.length > 0) {
  console.error("These modules have no tests:\n");
  for (const name of untested) console.error(`  ${MODULES}/${name}/`);
  console.error(`
Add a <name>.test.ts in each module's tests/ folder that calls the module
through its entry points. See app/modules/README.md, and app/modules/example/
for the shape.`);
  process.exit(1);
}

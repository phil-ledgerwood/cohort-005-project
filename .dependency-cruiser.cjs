// @ts-check
// Deep-module enforcement for dependency-cruiser.
//
// Each package under the packages root is a DEEP MODULE: a lot of behaviour
// behind a small interface. A package's PUBLIC SURFACE is its ENTRY POINTS:
// the files at the package root. Implementation lives in SUBFOLDERS and is
// private (by convention `lib/` for implementation and `tests/` for tests,
// though any subfolder is private). A package may expose several small entry
// points (index.ts, client.ts, server.ts, …); prefer that over one giant
// barrel index.
//
// The only thing you should ever need to edit here is PACKAGES_ROOT.

/** Where packages live. One immediate child dir per package (flat, no nesting). */
const PACKAGES_ROOT = "app/modules";

// --- derived patterns (no need to edit) -------------------------------------
const R = PACKAGES_ROOT;
/**
 * A package's private internals: anything nested inside a package subfolder.
 * The package's root files are its entry points and are NOT matched here:
 * they stay importable from outside.
 */
const PACKAGE_INTERNALS = `^${R}/[^/]+/[^/]+/`;

/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: "entrypoint-boundary-from-app",
      comment:
        "App/root code may import a package's entry points (its root files), but nothing inside its subfolders.",
      severity: "error",
      from: { pathNot: `^${R}/` }, // importer is NOT inside any package
      to: { path: PACKAGE_INTERNALS },
    },
    {
      name: "entrypoint-boundary-across-packages",
      comment:
        "A package's own files import each other freely, but may reach OTHER packages only through their entry points, never their internals.",
      severity: "error",
      // importer is inside a package ($1), but is not a test file
      from: { path: `^${R}/([^/]+)/`, pathNot: `^${R}/[^/]+/tests/` },
      to: {
        path: PACKAGE_INTERNALS,
        pathNot: `^${R}/$1/`, // same package → intra-package freedom
      },
    },
    {
      name: "tests-through-entrypoints",
      comment:
        "A package's tests exercise it through its entry points like everyone else: they may import any package's entry points and their own tests/ fixtures, but never any package's internals, not even their own.",
      severity: "error",
      from: { path: `^${R}/([^/]+)/tests/` }, // a test file, in package $1
      to: {
        path: PACKAGE_INTERNALS,
        pathNot: `^${R}/$1/tests/`, // own tests/ fixtures → allowed
      },
    },
    {
      name: "tests-folder-is-private",
      comment:
        "A package's tests/ folder is reachable only from tests: nothing else may import fixtures.",
      severity: "error",
      from: { pathNot: `^${R}/[^/]+/tests/` }, // importer is not itself a test
      to: { path: `^${R}/[^/]+/tests/` },
    },
    {
      name: "no-circular",
      comment:
        "No dependency cycles. Scope to `^${R}/` if you want to allow cycles outside packages. Type-only edges do not count: they vanish at runtime, and an adapter importing its port's types is not a cycle.",
      severity: "error",
      from: {},
      to: {
        circular: true,
        viaOnly: { dependencyTypesNot: ["type-only"] },
      },
    },

    // --- Layering (optional, off by default) ----------------------------------
    // Interface-hiding controls HOW you import (through the entry points).
    // Layering controls WHICH packages may depend on which. Add your own rules
    // here, e.g.:
    //
    // {
    //   name: "ui-may-not-depend-on-billing",
    //   severity: "error",
    //   from: { path: `^${R}/ui/` },
    //   to:   { path: `^${R}/billing/` },
    // },

    {
      name: "instructor-analytics-route-no-db",
      comment:
        "The instructor analytics route gets its data from the instructor-analytics module, never by querying the database itself.",
      severity: "error",
      from: { path: "^app/routes/instructor\\.analytics\\.tsx$" },
      to: { path: ["^app/db/", "^node_modules/(drizzle-orm|better-sqlite3)/"] },
    },
    {
      name: "components-no-db-connection",
      comment:
        "Components ship to the browser, so they may not open the database connection: it pulls better-sqlite3 into the client bundle and breaks hydration. Get data through a loader instead.",
      severity: "error",
      from: { path: "^app/components/" },
      to: {
        path: ["^app/db/index\\.ts$", "^node_modules/better-sqlite3/"],
      },
    },
    {
      name: "components-not-from-routes",
      comment:
        "Dependencies point from routes to components, never back. A component that needs a route's loader data takes it as explicit props, or the shape lives outside the route.",
      severity: "error",
      from: { path: "^app/components/" },
      // A route's generated `+types` never resolve (they sit behind tsconfig
      // rootDirs), so match the import as written as well.
      to: { path: ["^app/routes/", "^~/routes/", "\\+types/"] },
    },
    {
      name: "modules-not-from-components",
      comment:
        "Modules hold behaviour; components render it. A type both need lives in the module (or app/lib), and the component imports it from there.",
      severity: "error",
      from: { path: `^${R}/` },
      to: { path: "^app/components/" },
    },
  ],
  options: {
    doNotFollow: { path: "node_modules" },
    // See type-only imports too: a component importing a route's +types is
    // still a dependency on the route.
    tsPreCompilationDeps: true,
    tsConfig: { fileName: "tsconfig.json" },
    enhancedResolveOptions: {
      extensions: [".ts", ".tsx", ".js", ".jsx", ".json"],
    },
  },
};

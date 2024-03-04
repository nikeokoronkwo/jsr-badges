// ex. scripts/build_npm.ts
import { build, emptyDir } from "https://deno.land/x/dnt/mod.ts";

await emptyDir("./npm");

await build({
  typeCheck: false,
  entryPoints: ["./bin.ts"],
  outDir: "./npm",
  shims: {
    // see JS docs for overview and more options
    deno: true,
  },
  package: {
    // package.json properties
    name: "jsr-badges",
    version: Deno.args[0],
    description: "Create JSR Badges for use in your JavaScript Registry Projects",
    license: "MIT",
    repository: {
      type: "git",
      url: "https://github.com/nikeokoronkwo/jsr-badges",
    },
    bugs: {
      url: "https://github.com/nikeokoronkwo/jsr-badges/issues",
    },
  },
  postBuild() {
    // steps to run after building and before running the tests
    Deno.copyFileSync("LICENSE", "npm/LICENSE");
    Deno.copyFileSync("README.md", "npm/README.md");
    Deno.copyFileSync("CHANGELOG.md", "npm/CHANGELOG.md");
    // Deno.copyFileSync("tsconfig.json", "npm/tsconfig.json");
  },
});
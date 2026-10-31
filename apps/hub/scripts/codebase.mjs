// Snapshot the monorepo's own source (lines per folder) into src/lib/codebase.json, for the
// hex map on the home page. Only files git tracks, only hand-written code. Run before a deploy:
//   pnpm --filter @empire/hub codebase
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(import.meta.dirname, "..", "..", "..");
const CODE = /\.(tsx?|mjs|cjs|js|css|sql)$/;
// reference copies, generated or vendored files: not lines anyone here wrote
const SKIP = /(^|\/)(public|node_modules|dist|\.next)\/|database\.types\.ts$|\.d\.ts$|^[^ -~]/;
const DEPTH = 4; // apps/<app>/src/<area>

const files = execFileSync("git", ["ls-files", "-z"], { cwd: ROOT, encoding: "utf8" })
  .split("\0")
  .filter((f) => CODE.test(f) && !SKIP.test(f));

const dirs = new Map();
let lines = 0;
for (const f of files) {
  const n = readFileSync(join(ROOT, f), "utf8").split("\n").length;
  const dir = f.split("/").slice(0, -1).slice(0, DEPTH).join("/") || ".";
  const d = dirs.get(dir) ?? { path: dir, files: 0, lines: 0 };
  d.files += 1;
  d.lines += n;
  dirs.set(dir, d);
  lines += n;
}
if (files.length < 50) throw new Error(`only ${files.length} files found: wrong root?`);

const out = {
  generated: new Date().toISOString().slice(0, 10),
  files: files.length,
  lines,
  dirs: [...dirs.values()].sort((a, b) => b.lines - a.lines),
};
writeFileSync(
  join(import.meta.dirname, "..", "src", "lib", "codebase.json"),
  JSON.stringify(out, null, 2) + "\n",
);
console.log(`${out.files} files · ${out.lines} lines · ${out.dirs.length} folders`);

// Snapshot when the studio actually works: every commit in this repo, counted by weekday and
// hour (Bangkok time), into src/lib/rhythm.json for the circadian ring. Run before a deploy:
//   pnpm --filter @empire/hub rhythm
import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { join } from "node:path";

const root = join(import.meta.dirname, "../../..");
// author dates as Unix seconds; the hour is taken in Asia/Bangkok whatever the machine's zone
const out = execFileSync("git", ["log", "--all", "--no-merges", "--format=%at"], {
  cwd: root,
  encoding: "utf8",
});
const stamps = out.split("\n").filter(Boolean).map(Number);
if (stamps.length === 0) throw new Error("no commits found");

const fmt = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Bangkok",
  weekday: "short",
  hour: "2-digit",
  hourCycle: "h23",
});
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const grid = DAYS.map(() => Array.from({ length: 24 }, () => 0));
for (const s of stamps) {
  const parts = Object.fromEntries(
    fmt.formatToParts(new Date(s * 1000)).map((p) => [p.type, p.value]),
  );
  const d = DAYS.indexOf(parts.weekday);
  const h = Number(parts.hour);
  if (d >= 0 && h >= 0 && h < 24) grid[d][h] += 1;
}

const first = new Date(Math.min(...stamps) * 1000).toISOString().slice(0, 10);
const last = new Date(Math.max(...stamps) * 1000).toISOString().slice(0, 10);
const data = { commits: stamps.length, from: first, to: last, grid };
// written the way prettier lays it out, so format:check stays green after a rerun
const file = join(import.meta.dirname, "../src/lib/rhythm.json");
const prettier = await import("prettier");
const options = (await prettier.resolveConfig(file)) ?? {};
writeFileSync(file, await prettier.format(JSON.stringify(data), { ...options, parser: "json" }));
console.log(`${String(stamps.length)} commits, ${first} → ${last}`);

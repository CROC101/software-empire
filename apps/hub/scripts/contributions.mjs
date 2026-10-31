// Snapshot the public GitHub contribution calendar into src/lib/contributions.json, so the
// activity skyline shows real days without fetching at request time. Run before a deploy:
//   pnpm --filter @empire/hub contributions
import { writeFileSync } from "node:fs";

const USER = "Sarawut2005-icloud";
const res = await fetch(`https://github.com/users/${USER}/contributions`, {
  headers: { "User-Agent": "crocwork-hub" },
});
if (!res.ok) throw new Error(`GitHub answered ${res.status}`);
const html = await res.text();

// each day is a <td data-date id> with its count in the matching <tool-tip for>
const tips = new Map(
  [...html.matchAll(/<tool-tip[^>]*for="([^"]+)"[^>]*>([^<]*)<\/tool-tip>/g)].map((m) => [
    m[1],
    m[2],
  ]),
);
const days = [...html.matchAll(/data-date="(\d{4}-\d{2}-\d{2})"[^>]*id="([^"]+)"/g)].map((m) => {
  const n = /^(\d+)/.exec(tips.get(m[2]) ?? "");
  return { date: m[1], count: n ? Number(n[1]) : 0 };
});
if (days.length < 300) throw new Error(`only ${days.length} days found: the page layout changed`);

const end = days
  .map((d) => d.date)
  .sort()
  .at(-1);
const active = days.filter((d) => d.count > 0).sort((a, b) => a.date.localeCompare(b.date));
const out = { user: USER, end, fetched: new Date().toISOString().slice(0, 10), days: active };
writeFileSync(
  new URL("../src/lib/contributions.json", import.meta.url),
  JSON.stringify(out, null, 2) + "\n",
);
console.log(
  `${active.reduce((s, d) => s + d.count, 0)} contributions on ${active.length} days, up to ${end}`,
);

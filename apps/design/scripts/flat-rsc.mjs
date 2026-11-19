// Next 16 static export writes RSC segment payloads as `__next.<seg>/<sub>/__PAGE__.txt`, but the client
// router asks for the flat name `__next.<seg>.<sub>.__PAGE__.txt` (404 on any static host). Copy each nested
// payload to its flat name. shortcut: drop this once Next writes the flat names itself.
import { copyFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

const out = path.resolve(import.meta.dirname, "../out");

function files(dir) {
  return readdirSync(dir).flatMap((n) => {
    const p = path.join(dir, n);
    return statSync(p).isDirectory() ? files(p) : [p];
  });
}

/** `a/__next.x/c/$d$slug/__PAGE__.txt` -> `a/__next.x.c.$d$slug.__PAGE__.txt`; null when not nested in a segment dir. */
export function flatName(rel) {
  const parts = rel.split(/[\\/]/);
  const i = parts.findIndex((p, j) => p.startsWith("__next.") && j < parts.length - 1);
  if (i < 0) return null;
  return [...parts.slice(0, i), parts.slice(i).join(".")].join("/");
}

if (process.argv.includes("--self-test")) {
  const t = flatName("c/dock/__next.!KHNpdGUp/c/$d$slug/__PAGE__.txt");
  if (t !== "c/dock/__next.!KHNpdGUp.c.$d$slug.__PAGE__.txt")
    throw new Error(`flatName: ${String(t)}`);
  if (flatName("c/dock/__next._tree.txt") !== null) throw new Error("flatName: flat file changed");
  console.log("flat-rsc self-test ok");
} else {
  let n = 0;
  for (const f of files(out)) {
    const flat = flatName(path.relative(out, f));
    if (!flat) continue;
    copyFileSync(f, path.join(out, flat));
    n++;
  }
  console.log(`flat-rsc: ${String(n)} payloads`);
}

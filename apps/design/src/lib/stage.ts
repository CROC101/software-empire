import { clampValue, type Entry, type Values } from "@/registry/meta";

/** Backgrounds the stage can put behind a part. */
export const surfaces = ["grid", "dots", "solid", "contrast"] as const;
export type Surface = (typeof surfaces)[number];

export const surfaceClass: Record<Surface, string> = {
  grid: "stage-grid",
  dots: "stage-dots",
  solid: "bg-background",
  contrast: "bg-(--em-ink-975)",
};

/** components were drawn for the dark ink stage; blocks and pages paint their own background */
export const defaultSurface = (component: boolean): Surface => (component ? "contrast" : "solid");

export type StageMessage = { type: "croc:stage"; values: Values; surface: Surface };

/**
 * The /p/<slug> iframe takes its props from the playground by postMessage. Same origin is checked
 * by the caller; this keeps only known keys, each clamped to its control, and a known surface.
 */
export function readStage(data: unknown, e: Entry): { values: Values; surface: Surface } | null {
  if (typeof data !== "object" || data === null) return null;
  const m = data as Partial<Record<keyof StageMessage, unknown>>;
  if (m.type !== "croc:stage" || typeof m.values !== "object" || m.values === null) return null;
  if (!surfaces.includes(m.surface as Surface)) return null;
  const raw = m.values as Record<string, unknown>;
  const values: Values = {};
  for (const c of e.controls) values[c.key] = c.key in raw ? clampValue(c, raw[c.key]) : c.value;
  return { values, surface: m.surface as Surface };
}

/** where the playground keeps a part's last props, so full screen and a reload show exactly what was set */
export const stageKey = (slug: string) => `croc-stage:${slug}`;

export const stageText = (s: { values: Values; surface: Surface }): string =>
  JSON.stringify({ type: "croc:stage", ...s });

/** read back through readStage, so a stale or hand-edited entry is clamped like a message */
export function parseStage(
  raw: string | null,
  e: Entry,
): { values: Values; surface: Surface } | null {
  if (!raw) return null;
  try {
    return readStage(JSON.parse(raw), e);
  } catch {
    return null;
  }
}

export const pms = ["pnpm", "npm", "yarn", "bun"] as const;
export type Pm = (typeof pms)[number] | "croc-ui";

/** one install line per package manager, all through the shadcn CLI, plus our own croc-ui */
export function installCommand(pm: Pm, base: string, slug: string): string {
  const url = `${base}/r/${slug}.json`;
  switch (pm) {
    case "pnpm":
      return `pnpm dlx shadcn@latest add ${url}`;
    case "npm":
      return `npx shadcn@latest add ${url}`;
    case "yarn":
      return `yarn dlx shadcn@latest add ${url}`;
    case "bun":
      return `bunx --bun shadcn@latest add ${url}`;
    case "croc-ui":
      return `curl -fsSL ${base}/croc-ui.mjs -o croc-ui.mjs && node croc-ui.mjs add ${slug}`;
  }
}

const propLine = (c: Entry["controls"][number]) =>
  `- ${c.key}: ${
    c.type === "range"
      ? `number ${String(c.min)}-${String(c.max)}`
      : c.type === "select"
        ? c.options.map((o) => `"${o}"`).join(" | ")
        : c.type === "toggle"
          ? "boolean"
          : "string"
  }, default ${typeof c.value === "string" ? `"${c.value}"` : String(c.value)}`;

/** what "Copy prompt for AI" puts on the clipboard: everything an agent needs to install and use the part */
export function aiPrompt(
  e: Entry,
  o: { base: string; dependencies: readonly string[]; usage?: string; brief: string },
): string {
  const url = `${o.base}/r/${e.slug}.json`;
  return [
    `<component name="${e.name}" slug="${e.slug}">`,
    `<summary>${e.summary}</summary>`,
    `<registry>${url}</registry>`,
    `<install>npx shadcn@latest add ${url}</install>`,
    `<dependencies>${o.dependencies.join(", ") || "react only"}</dependencies>`,
    "<props>",
    ...(e.controls.length ? e.controls.map(propLine) : ["none"]),
    "</props>",
    ...(o.usage ? ["<usage>", o.usage, "</usage>"] : []),
    `<brief>${o.brief}</brief>`,
    "</component>",
  ].join("\n");
}

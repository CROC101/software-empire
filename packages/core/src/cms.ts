import { z } from "zod";

/**
 * CMS content (supabase migration cms_content). Each app declares the editable parts of its pages
 * here-style as a `CmsPage` with defaults that live next to the design; a row in `cms.entries`
 * only overrides one field, or one section's visibility / order. Reading never throws: if the
 * database is down or a row is malformed, the page shows its defaults.
 */

// same-site path, https, or (links only) mailto / in-page anchor; never javascript:, data:, //host
const sitePath = /^\/($|[^/\\])/;
// http only for the local Supabase, which serves uploads from http://127.0.0.1:54321
const imagePattern = /^(https:\/\/|http:\/\/(localhost|127\.0\.0\.1)(:\d+)?\/|\/[^/\\])/;
const imageUrl = z
  .string()
  .max(2000, "ลิงก์รูปยาวเกินไป")
  .regex(imagePattern, "รูปต้องเป็นลิงก์ https:// หรือ /ไฟล์ในเว็บ");
const href = z
  .string()
  .max(2000, "ลิงก์ยาวเกินไป")
  .refine(
    (u) =>
      u.startsWith("https://") || u.startsWith("mailto:") || u.startsWith("#") || sitePath.test(u),
    "ลิงก์ต้องขึ้นต้นด้วย https:// mailto: # หรือ /",
  );

export const cmsValue = {
  text: z.object({ text: z.string().max(2000, "ข้อความยาวเกิน 2,000 ตัวอักษร") }),
  number: z.object({ n: z.number("ใส่ได้เฉพาะตัวเลข").min(-1e12).max(1e12) }),
  image: z.object({ url: imageUrl, alt: z.string().max(300, "คำอธิบายรูปยาวเกินไป") }),
  link: z.object({ label: z.string().max(200, "ข้อความบนลิงก์ยาวเกินไป"), href }),
  section: z.object({ visible: z.boolean(), order: z.number().int().min(0).max(999) }),
};

export type CmsKind = keyof typeof cmsValue;
export type CmsValue<K extends CmsKind> = z.infer<(typeof cmsValue)[K]>;

export type CmsField =
  | { kind: "text"; label: string; default: string; multiline?: boolean }
  | { kind: "number"; label: string; default: number }
  | { kind: "image"; label: string; default: CmsValue<"image"> }
  | { kind: "link"; label: string; default: CmsValue<"link"> };

export type CmsSection = {
  /** kebab-case id; also the row key of its visibility / order switch */
  key: string;
  label: string;
  /** field keys are stored as `<section>.<field>` */
  fields?: Record<string, CmsField>;
  /** false for parts that must stay (the hero): no show / hide or reorder */
  movable?: boolean;
};

export type CmsPage = { app: string; page: string; label: string; sections: CmsSection[] };

export const cmsRow = z.object({
  key: z.string(),
  kind: z.enum(["text", "number", "image", "link", "section"]),
  value: z.unknown(),
});
export type CmsRow = z.infer<typeof cmsRow>;

/** Public rows of one page via PostgREST, without the SDK. Never throws; [] on any failure. */
export async function readCms(
  env: { url: string; publishableKey: string },
  app: string,
  page: string,
  init?: RequestInit,
): Promise<CmsRow[]> {
  const query = new URLSearchParams({
    select: "key,kind,value",
    app: `eq.${app}`,
    page: `eq.${page}`,
  });
  try {
    const res = await fetch(`${env.url}/rest/v1/entries?${query.toString()}`, {
      ...init,
      headers: { apikey: env.publishableKey, "Accept-Profile": "cms" },
      signal: AbortSignal.timeout(1500),
    });
    if (!res.ok) return [];
    const rows = z.array(cmsRow).safeParse(await res.json());
    return rows.success ? rows.data : [];
  } catch {
    return [];
  }
}

export type CmsContent = ReturnType<typeof resolveCms>;

/** Merges a page's rows over its defaults. Unknown keys and malformed values fall back. */
export function resolveCms(page: CmsPage, rows: readonly CmsRow[]) {
  const rowOf = new Map(rows.map((r) => [r.key, r]));
  const fieldOf = (path: string) => {
    const [section, name] = path.split(".");
    const field = page.sections.find((s) => s.key === section)?.fields?.[name ?? ""];
    if (!field) throw new Error(`cms: ${page.app}/${page.page} has no field "${path}"`);
    return field;
  };
  function value<K extends CmsKind>(key: string, kind: K): CmsValue<K> | undefined {
    const row = rowOf.get(key);
    if (row?.kind !== kind) return undefined;
    const parsed = cmsValue[kind].safeParse(row.value);
    return parsed.success ? (parsed.data as CmsValue<K>) : undefined;
  }
  const typed = <F extends CmsField["kind"]>(path: string, kind: F) => {
    const field = fieldOf(path);
    if (field.kind !== kind) throw new Error(`cms: "${path}" is ${field.kind}, not ${kind}`);
    return field as Extract<CmsField, { kind: F }>;
  };

  return {
    text: (path: string) => value(path, "text")?.text ?? typed(path, "text").default,
    number: (path: string) => value(path, "number")?.n ?? typed(path, "number").default,
    image: (path: string) => value(path, "image") ?? typed(path, "image").default,
    link: (path: string) => value(path, "link") ?? typed(path, "link").default,
    /** Every section in display order with its visibility; new sections keep their code order. */
    sections: () =>
      page.sections
        .map((s, i) => {
          const own = s.movable === false ? undefined : value(s.key, "section");
          return { key: s.key, visible: own?.visible ?? true, order: own?.order ?? i, i };
        })
        .sort((a, b) => a.order - b.order || a.i - b.i)
        .map(({ key, visible }) => ({ key, visible })),
  };
}

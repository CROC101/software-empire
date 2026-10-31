"use server";

import { cmsValue, resolveCms, type CmsField, type CmsRow } from "@empire/core/cms";
import { updateTag } from "next/cache";
import { z } from "zod";
import { CMS_PAGES, CMS_TAG } from "@/lib/cms";
import { createClient } from "@/lib/supabase/server";

export type SaveState = { ok: boolean; message: string } | null;

/**
 * Every action re-checks: a server action is a public POST endpoint, the proxy only knows that
 * someone is signed in. RLS on cms.entries enforces the same rule a second time.
 */
async function adminClient() {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims) return null;
  const { data } = await supabase.schema("cms").rpc("is_admin");
  return data === true ? supabase : null;
}

const ids = z.object({
  app: z.string().regex(/^[a-z0-9-]{1,32}$/),
  page: z.string().regex(/^[a-z0-9-]{1,64}$/),
  section: z.string().regex(/^[a-z0-9-]{1,64}$/),
});

const pageOf = (app: string, page: string) =>
  CMS_PAGES.find((p) => p.app === app && p.page === page);

const field = (form: FormData, name: string) => {
  const v = form.get(name);
  return typeof v === "string" ? v.trim() : "";
};

/** The value a field's inputs hold, in the shape cms.entries stores. */
function readField(f: CmsField, key: string, form: FormData) {
  switch (f.kind) {
    case "text":
      return cmsValue.text.safeParse({ text: field(form, key) });
    case "number": {
      const raw = field(form, key).replace(/,/g, "");
      return cmsValue.number.safeParse({ n: raw === "" ? Number.NaN : Number(raw) });
    }
    case "image":
      return cmsValue.image.safeParse({
        url: field(form, `${key}:url`),
        alt: field(form, `${key}:alt`),
      });
    case "link":
      return cmsValue.link.safeParse({
        label: field(form, `${key}:label`),
        href: field(form, `${key}:href`),
      });
  }
}

const defaultOf = (f: CmsField) =>
  f.kind === "text" ? { text: f.default } : f.kind === "number" ? { n: f.default } : f.default;

export async function saveSection(_: SaveState, form: FormData): Promise<SaveState> {
  const where = ids.safeParse({
    app: form.get("app"),
    page: form.get("page"),
    section: form.get("section"),
  });
  if (!where.success) return { ok: false, message: "ไม่รู้จักส่วนนี้" };
  const { app, page, section } = where.data;
  const supabase = await adminClient();
  if (!supabase) return { ok: false, message: "บัญชีนี้แก้เนื้อหาไม่ได้ ลองเข้าสู่ระบบใหม่" };
  const fields = pageOf(app, page)?.sections.find((s) => s.key === section)?.fields;
  if (!fields) return { ok: false, message: "ไม่รู้จักส่วนนี้" };

  const upserts: {
    app: string;
    page: string;
    key: string;
    kind: CmsField["kind"];
    value: Record<string, string | number>;
  }[] = [];
  const back: string[] = [];
  for (const [name, f] of Object.entries(fields)) {
    const key = `${section}.${name}`;
    const parsed = readField(f, key, form);
    if (!parsed.success)
      return {
        ok: false,
        message: `${f.label}: ${parsed.error.issues[0]?.message ?? "ไม่ถูกต้อง"}`,
      };
    // back to the default: drop the row, so a later change of the default in code shows through
    if (JSON.stringify(parsed.data) === JSON.stringify(defaultOf(f))) back.push(key);
    else upserts.push({ app, page, key, kind: f.kind, value: parsed.data });
  }

  const entries = supabase.schema("cms").from("entries");
  if (upserts.length) {
    const { error } = await entries.upsert(upserts);
    if (error) return { ok: false, message: "บันทึกไม่สำเร็จ ลองอีกครั้ง" };
  }
  if (back.length) {
    const { error } = await entries.delete().eq("app", app).eq("page", page).in("key", back);
    if (error) return { ok: false, message: "บันทึกไม่สำเร็จ ลองอีกครั้ง" };
  }
  updateTag(CMS_TAG);
  const at = new Intl.DateTimeFormat("th-TH", {
    timeStyle: "short",
    timeZone: "Asia/Bangkok",
  }).format(new Date());
  return { ok: true, message: `บันทึกแล้ว เวลา ${at}` };
}

const arrangeInput = ids.extend({
  visible: z.boolean().optional(),
  move: z.union([z.literal(-1), z.literal(1)]).optional(),
});

/** Shows / hides a section or moves it one place; rewrites every movable section's order. */
export async function arrangeSection(input: z.input<typeof arrangeInput>): Promise<SaveState> {
  const parsed = arrangeInput.safeParse(input);
  if (!parsed.success) return { ok: false, message: "ไม่รู้จักส่วนนี้" };
  const { app, page, section, visible, move } = parsed.data;
  const supabase = await adminClient();
  if (!supabase) return { ok: false, message: "บัญชีนี้แก้เนื้อหาไม่ได้ ลองเข้าสู่ระบบใหม่" };
  const def = pageOf(app, page);
  if (!def?.sections.some((s) => s.key === section && s.movable !== false)) {
    return { ok: false, message: "ส่วนนี้ย้ายหรือซ่อนไม่ได้" };
  }

  const { data, error } = await supabase
    .schema("cms")
    .from("entries")
    .select("key, kind, value")
    .eq("app", app)
    .eq("page", page)
    .eq("kind", "section");
  if (error) return { ok: false, message: "โหลดลำดับไม่สำเร็จ ลองอีกครั้ง" };

  const movable = new Set(def.sections.filter((s) => s.movable !== false).map((s) => s.key));
  const list = resolveCms(def, data as CmsRow[])
    .sections()
    .filter((s) => movable.has(s.key));
  const at = list.findIndex((s) => s.key === section);
  const item = list[at];
  if (!item) return { ok: false, message: "ไม่รู้จักส่วนนี้" };
  if (visible !== undefined) item.visible = visible;
  const to = at + (move ?? 0);
  if (to < 0 || to >= list.length) return { ok: true, message: "" };
  list.splice(at, 1);
  list.splice(to, 0, item);

  const rows = list.map((s, order) => ({
    app,
    page,
    key: s.key,
    kind: "section" as const,
    value: { visible: s.visible, order },
  }));
  const { error: saveError } = await supabase.schema("cms").from("entries").upsert(rows);
  if (saveError) return { ok: false, message: "บันทึกไม่สำเร็จ ลองอีกครั้ง" };
  updateTag(CMS_TAG);
  return { ok: true, message: "" };
}

const IMAGE_TYPES = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
};

/**
 * A one-time upload URL for an image in cms-media. The file goes from the browser straight to
 * storage (no 1 MB server-action limit); the bucket itself caps size (5 MB) and type.
 */
export async function imageUploadUrl(
  type: string,
): Promise<{ error: string } | { signedUrl: string; publicUrl: string }> {
  const ext = IMAGE_TYPES[type as keyof typeof IMAGE_TYPES] as string | undefined;
  if (!ext) return { error: "ใช้ได้เฉพาะ PNG JPG WEBP GIF AVIF" };
  const supabase = await adminClient();
  if (!supabase) return { error: "บัญชีนี้แก้เนื้อหาไม่ได้" };
  const bucket = supabase.storage.from("cms-media");
  const path = `${crypto.randomUUID()}.${ext}`;
  const { data, error } = await bucket.createSignedUploadUrl(path);
  if (error) return { error: "เตรียมอัปโหลดไม่สำเร็จ" };
  return { signedUrl: data.signedUrl, publicUrl: bucket.getPublicUrl(path).data.publicUrl };
}

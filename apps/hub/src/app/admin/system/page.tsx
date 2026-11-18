import { subsystems } from "@empire/core/subsystems";
import type { Metadata } from "next";
import { z } from "zod";
import { getApps, getSettings, passed } from "@/lib/site";
import { requireAdmin } from "../guard";
import { AppForm, SettingsForm } from "./system-forms";

export const metadata: Metadata = { title: "ระบบ · หลังบ้าน" };

const log = z.array(
  z.object({
    at: z.string(),
    action: z.string(),
    actor: z.string().nullable(),
    detail: z.record(z.string(), z.unknown()).nullable(),
  }),
);

const when = new Intl.DateTimeFormat("th-TH", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Bangkok",
});

/** Thai wall-clock time for <input type="datetime-local">. */
const thaiLocal = (iso: string) =>
  new Date(Date.parse(iso) + 7 * 3_600_000).toISOString().slice(0, 16);

const name = (slug: string) =>
  slug === "hub" ? "Hub (หน้าหลัก)" : (subsystems.find((s) => s.slug === slug)?.name ?? slug);

const show = (value: unknown) =>
  value == null ? "–" : typeof value === "string" ? value : JSON.stringify(value);

/** What changed, field by field: "status: open → maintenance". */
function changes(detail: Record<string, unknown> | null) {
  const before = (detail?.old ?? {}) as Record<string, unknown>;
  const after = (detail?.new ?? {}) as Record<string, unknown>;
  return Object.keys(after)
    .filter((key) => key !== "slug" && JSON.stringify(before[key]) !== JSON.stringify(after[key]))
    .map((key) => `${key}: ${show(before[key])} → ${show(after[key])}`);
}

export default async function AdminSystemPage() {
  const supabase = await requireAdmin("/admin/system");
  const [settings, apps, { data }] = await Promise.all([
    getSettings(),
    getApps(),
    supabase.schema("hub").rpc("admin_log"),
  ]);
  const entries = log.safeParse(data);
  const history = entries.success
    ? entries.data.filter((e) => e.action === "settings" || e.action === "app")
    : [];
  const open = passed(settings.launch_at);

  return (
    <main className="mx-auto grid max-w-6xl gap-6 px-4 pb-20 pt-4 sm:px-6">
      <div>
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">System</p>
        <h1 className="mt-1 font-heading text-3xl font-black">เปิด ปิด และประกาศ</h1>
        <p className="mt-1 text-muted-foreground">
          เปลี่ยนแล้วมีผลทันทีทุกแอป ไม่ต้อง deploy · แอดมินที่ผ่าน 2FA เข้าได้เสมอ
        </p>
      </div>

      <SettingsForm
        launchAt={thaiLocal(settings.launch_at)}
        soonMessage={settings.soon_message}
        announcement={settings.announcement}
        open={open}
      />

      <section aria-labelledby="apps-title" className="grid gap-3">
        <h2 id="apps-title" className="font-heading text-xl font-bold">
          สวิตช์แต่ละระบบ
        </h2>
        <div className="grid gap-3 md:grid-cols-2">
          {apps.map((a) => (
            <AppForm key={a.slug} {...a} name={name(a.slug)} />
          ))}
        </div>
        {apps.length === 0 && <p className="text-destructive">โหลดสวิตช์ไม่สำเร็จ</p>}
      </section>

      <section aria-labelledby="history-title" className="cw-glass rounded-2xl p-5">
        <h2 id="history-title" className="font-heading text-lg font-bold">
          ประวัติการเปลี่ยน
        </h2>
        {history.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">ยังไม่มี</p>
        ) : (
          <ul className="mt-3 divide-y text-sm">
            {history.map((e) => {
              const slug = (e.detail?.new as { slug?: string } | undefined)?.slug;
              return (
                <li key={e.at} className="py-2">
                  <span className="font-semibold">
                    {e.action === "settings" ? "ตั้งค่าเว็บ" : name(slug ?? "")}
                  </span>
                  <ul className="mt-1 break-words font-mono text-xs">
                    {changes(e.detail).map((line) => (
                      <li key={line}>{line}</li>
                    ))}
                  </ul>
                  <span className="block text-xs text-muted-foreground">
                    โดย {e.actor ?? "–"} · {when.format(new Date(e.at))}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
}

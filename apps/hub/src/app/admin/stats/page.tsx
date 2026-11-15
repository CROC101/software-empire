import type { Metadata } from "next";
import { z } from "zod";
import { requireAdmin } from "../guard";
import { OnlineNow } from "./online-now";

export const metadata: Metadata = { title: "สถิติ · หลังบ้าน" };

const count = z.coerce.number();
const visits = z.object({
  days: z.array(z.object({ day: z.string(), visits: count, people: count })),
  apps: z.array(z.object({ app: z.string(), visits: count, people: count })),
  recent: z.array(
    z.object({
      at: z.string(),
      app: z.string(),
      path: z.string(),
      user_id: z.string(),
      email: z.string().nullable(),
    }),
  ),
});
const log = z.array(
  z.object({
    at: z.string(),
    action: z.string(),
    actor: z.string().nullable(),
    target: z.string().nullable(),
  }),
);
const users = z.array(z.object({ id: z.string(), email: z.string().nullable() }));

const ACTION = {
  ban: "ระงับ",
  unban: "ปลดระงับ",
  make_admin: "ตั้งแอดมิน",
  remove_admin: "ถอดแอดมิน",
} as Record<string, string>;
const DAYS = 14;
const when = new Intl.DateTimeFormat("th-TH", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "Asia/Bangkok",
});
const dayLabel = new Intl.DateTimeFormat("th-TH", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});

/** The last 14 days as a full row of days, so quiet days show as empty bars. */
function fillDays(days: z.infer<typeof visits>["days"]) {
  const byDay = new Map(days.map((d) => [d.day, d]));
  const today = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Bangkok" }));
  return Array.from({ length: DAYS }, (_, i) => {
    const d = new Date(
      Date.UTC(today.getFullYear(), today.getMonth(), today.getDate() - (DAYS - 1 - i)),
    );
    const key = d.toISOString().slice(0, 10);
    return {
      key,
      label: dayLabel.format(d),
      visits: byDay.get(key)?.visits ?? 0,
      people: byDay.get(key)?.people ?? 0,
    };
  });
}

export default async function AdminStatsPage() {
  const supabase = await requireAdmin("/admin/stats");
  const hub = supabase.schema("hub");
  const [v, l, u] = await Promise.all([
    hub.rpc("admin_visits", { days: DAYS }),
    hub.rpc("admin_log"),
    hub.rpc("admin_users"),
  ]);
  const stats = visits.safeParse(v.data);
  const actions = log.safeParse(l.data);
  const people = users.safeParse(u.data);
  const emails = Object.fromEntries(
    (people.success ? people.data : []).map((p) => [p.id, p.email ?? p.id]),
  );

  if (!stats.success) {
    return (
      <main className="mx-auto max-w-6xl px-4 pt-4 sm:px-6">
        <p className="text-destructive">โหลดสถิติไม่สำเร็จ</p>
      </main>
    );
  }
  const days = fillDays(stats.data.days);
  const top = Math.max(1, ...days.map((d) => d.visits));
  const total = days.reduce((sum, d) => sum + d.visits, 0);
  const appTop = Math.max(1, ...stats.data.apps.map((a) => a.visits));

  return (
    <main className="mx-auto grid max-w-6xl gap-6 px-4 pb-20 pt-4 sm:px-6">
      <div>
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">Stats</p>
        <h1 className="mt-1 font-heading text-3xl font-black">สถิติการเข้าใช้</h1>
        <p className="mt-1 text-muted-foreground">
          นับเฉพาะคนที่ล็อกอิน · {DAYS} วันล่าสุด {total.toLocaleString("th-TH")} หน้า
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <section aria-labelledby="days-title" className="cw-glass rounded-2xl p-5">
          <h2 id="days-title" className="font-heading text-lg font-bold">
            หน้าที่เปิดต่อวัน
          </h2>
          <ol className="mt-4 flex h-44 items-end gap-1 sm:gap-2">
            {days.map((d) => (
              <li
                key={d.key}
                className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1"
              >
                <span className="font-mono text-[10px] tabular-nums text-muted-foreground">
                  {d.visits || ""}
                </span>
                <span
                  className="w-full rounded-t bg-primary"
                  style={{ height: `${(d.visits / top) * 100}%`, minHeight: d.visits ? 4 : 1 }}
                  title={`${d.label}: ${d.visits} หน้า · ${d.people} คน`}
                />
                <span className="hidden truncate text-[10px] text-muted-foreground sm:block">
                  {d.label}
                </span>
              </li>
            ))}
          </ol>
        </section>
        <OnlineNow emails={emails} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section aria-labelledby="apps-title" className="cw-glass rounded-2xl p-5">
          <h2 id="apps-title" className="font-heading text-lg font-bold">
            แยกตามแอป
          </h2>
          {stats.data.apps.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">ยังไม่มีข้อมูล</p>
          ) : (
            <ul className="mt-3 grid gap-3 text-sm">
              {stats.data.apps.map((a) => (
                <li key={a.app}>
                  <span className="flex justify-between gap-3">
                    <span className="font-semibold">{a.app}</span>
                    <span className="tabular-nums text-muted-foreground">
                      {a.visits} หน้า · {a.people} คน
                    </span>
                  </span>
                  <span className="mt-1 block h-1.5 rounded-full bg-muted">
                    <span
                      className="block h-full rounded-full bg-primary"
                      style={{ width: `${(a.visits / appTop) * 100}%` }}
                    />
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="log-title" className="cw-glass rounded-2xl p-5">
          <h2 id="log-title" className="font-heading text-lg font-bold">
            บันทึกการจัดการบัญชี
          </h2>
          {!actions.success || actions.data.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">ยังไม่มี</p>
          ) : (
            <ul className="mt-3 divide-y text-sm">
              {actions.data.map((a) => (
                <li key={`${a.at}-${a.target}-${a.action}`} className="py-2">
                  <span className="font-semibold">{ACTION[a.action] ?? a.action}</span>{" "}
                  {a.target ?? "บัญชีที่ลบแล้ว"}
                  <span className="block text-xs text-muted-foreground">
                    โดย {a.actor ?? "–"} · {when.format(new Date(a.at))}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section aria-labelledby="recent-title" className="cw-glass overflow-x-auto rounded-2xl">
        <h2 id="recent-title" className="px-5 pt-5 font-heading text-lg font-bold">
          เข้าใช้ล่าสุด
        </h2>
        <table className="mt-3 w-full min-w-[36rem] text-left text-sm">
          <thead className="border-b text-xs text-muted-foreground">
            <tr>
              <th scope="col" className="px-5 py-2 font-semibold">
                เวลา
              </th>
              <th scope="col" className="px-5 py-2 font-semibold">
                ใคร
              </th>
              <th scope="col" className="px-5 py-2 font-semibold">
                หน้า
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {stats.data.recent.map((r, i) => (
              <tr key={`${r.at}-${r.user_id}-${i}`}>
                <td className="whitespace-nowrap px-5 py-2">{when.format(new Date(r.at))}</td>
                <td className="max-w-56 truncate px-5 py-2">{r.email ?? r.user_id.slice(0, 8)}</td>
                <td className="max-w-72 truncate px-5 py-2">
                  <span className="font-semibold">{r.app}</span> {r.path}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {stats.data.recent.length === 0 && (
          <p className="px-5 py-6 text-sm text-muted-foreground">ยังไม่มี</p>
        )}
      </section>
    </main>
  );
}

import { RollingCounter } from "@empire/ui";
import { ArrowUpRight, Flag, PenLine, ShoppingBag, Users } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { z } from "zod";
import { appUrl } from "@/lib/apps";
import { CMS_PAGES } from "@/lib/cms";
import { subsystems } from "@/lib/subsystems";
import { requireAdmin } from "./guard";

export const metadata: Metadata = {
  title: "ภาพรวมหลังบ้าน",
  robots: { index: false, follow: false },
};

const n = z.coerce.number().catch(0);
// shape of cms.admin_overview() (migration cms_admin_overview); anything missing reads as 0
const overview = z
  .object({
    users: z.object({ total: n, week: n }).catch({ total: 0, week: 0 }),
    community: z
      .object({ members: n, posts: n, reels: n, messages: n, open_reports: n })
      .catch({ members: 0, posts: 0, reels: 0, messages: 0, open_reports: 0 }),
    commerce: z
      .object({ sellers: n, services: n, orders: n, open_orders: n })
      .catch({ sellers: 0, services: 0, orders: 0, open_orders: 0 }),
    canva: z.object({ designs: n }).catch({ designs: 0 }),
    toolboxes: z.object({ favorites: n, people: n }).catch({ favorites: 0, people: 0 }),
    cms: z
      .object({
        pages: z.array(z.object({ app: z.string(), page: z.string(), count: n })).catch([]),
        recent: z
          .array(
            z.object({
              at: z.string(),
              action: z.string(),
              app: z.string(),
              page: z.string(),
              key: z.string(),
              old_value: z.unknown(),
              new_value: z.unknown(),
              actor: z.string().nullable().catch(null),
            }),
          )
          .catch([]),
      })
      .catch({ pages: [], recent: [] }),
  })
  .partial();

const EYEBROW = "font-mono text-xs uppercase tracking-[0.2em]";
const when = new Intl.DateTimeFormat("th-TH", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Bangkok",
});

/** A stored CMS value in a few words, for the change log. */
function brief(v: unknown): string {
  if (!v || typeof v !== "object") return "ค่าเริ่มต้น";
  const o = v as Record<string, unknown>;
  if (typeof o.text === "string") return o.text;
  if (typeof o.n === "number") return o.n.toLocaleString("th-TH");
  if (typeof o.label === "string") return `${o.label} → ${String(o.href)}`;
  if (typeof o.url === "string") return o.url;
  if (typeof o.visible === "boolean")
    return `${o.visible ? "แสดง" : "ซ่อน"} · ลำดับ ${String(o.order)}`;
  return "…";
}

function Stat({
  label,
  value,
  hint,
  icon,
}: {
  label: string;
  value: number;
  hint?: string;
  icon: ReactNode;
}) {
  return (
    <div className="cw-glass flex flex-col gap-2 rounded-xl p-5">
      <span className="flex items-center gap-2 text-sm text-muted-foreground">
        <span aria-hidden className="cw-blue [&_svg]:size-4">
          {icon}
        </span>
        {label}
      </span>
      <span className="text-4xl font-black">
        <RollingCounter value={value} />
      </span>
      {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
    </div>
  );
}

/**
 * The back office's front page: real counts from every app's database, which systems are live,
 * what the CMS changes and who changed it. Admins only (requireAdmin + the SQL function itself).
 */
export default async function AdminOverview() {
  const supabase = await requireAdmin("/admin");
  const { data, error } = await supabase.schema("cms").rpc("admin_overview");
  const o = overview.parse(error ? {} : (data ?? {}));
  const users = o.users ?? { total: 0, week: 0 };
  const community = o.community ?? { members: 0, posts: 0, reels: 0, messages: 0, open_reports: 0 };
  const commerce = o.commerce ?? { sellers: 0, services: 0, orders: 0, open_orders: 0 };
  const cms = o.cms ?? { pages: [], recent: [] };
  const communityUrl = appUrl("community");
  const labelOf = (app: string, page: string) =>
    CMS_PAGES.find((p) => p.app === app && p.page === page)?.label ?? page;

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-10 px-4 pb-24 sm:px-6">
      <div>
        <p className={`${EYEBROW} cw-blue`}>back office</p>
        <h1 className="pk-depth mt-2 text-4xl font-black sm:text-5xl">ภาพรวมทั้งระบบ</h1>
        <p className="mt-2 max-w-xl text-muted-foreground">
          ตัวเลขทุกตัวดึงจากฐานข้อมูลจริงตอนเปิดหน้านี้
        </p>
        {error && (
          <p role="alert" className="mt-3 text-sm text-destructive">
            โหลดตัวเลขไม่สำเร็จ ลองรีเฟรชอีกครั้ง
          </p>
        )}
      </div>

      <section aria-label="ตัวเลขหลัก" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          label="สมาชิกทั้งหมด"
          value={users.total}
          hint={`เพิ่ม ${users.week.toLocaleString("th-TH")} คนใน 7 วัน`}
          icon={<Users />}
        />
        <Stat label="โพสต์ใน Community" value={community.posts} icon={<PenLine />} />
        <Stat
          label="ออเดอร์ที่ยังไม่จบ"
          value={commerce.open_orders}
          hint={`จากทั้งหมด ${commerce.orders.toLocaleString("th-TH")} ออเดอร์`}
          icon={<ShoppingBag />}
        />
        <Stat
          label="รายงานที่รอตรวจ"
          value={community.open_reports}
          hint={community.open_reports ? "มีเรื่องรอดูใน Community" : "ไม่มีเรื่องค้าง"}
          icon={<Flag />}
        />
      </section>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <section aria-labelledby="ov-apps" className="cw-glass rounded-xl p-5">
          <h2 id="ov-apps" className="text-xl font-black">
            ระบบย่อย
          </h2>
          <ul className="mt-4 divide-y">
            {subsystems.map((s) => {
              const live = Boolean(appUrl(s.slug));
              const facts: Record<string, string> = {
                community: `${community.members.toLocaleString("th-TH")} สมาชิก · ${community.reels.toLocaleString("th-TH")} รีลส์ · ${community.messages.toLocaleString("th-TH")} ข้อความ`,
                commerce: `${commerce.sellers.toLocaleString("th-TH")} ผู้ขาย · ${commerce.services.toLocaleString("th-TH")} บริการที่เปิดขาย`,
                canva: `${(o.canva?.designs ?? 0).toLocaleString("th-TH")} งานออกแบบ`,
                toolboxes: `${(o.toolboxes?.favorites ?? 0).toLocaleString("th-TH")} ดาวจาก ${(o.toolboxes?.people ?? 0).toLocaleString("th-TH")} คน`,
              };
              return (
                <li key={s.slug} className="flex items-center gap-3 py-3">
                  <span
                    aria-hidden
                    className={`size-2.5 shrink-0 rounded-full ${live ? "bg-success" : "bg-warning"}`}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-bold">{s.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {live ? (facts[s.slug] ?? "เปิดใช้แล้ว") : "กำลังทำ"}
                    </p>
                  </div>
                  {live && (
                    <a
                      href={`/go/${s.slug}`}
                      className="flex items-center gap-1 text-sm font-bold cw-blue hover:underline"
                    >
                      เปิด <ArrowUpRight aria-hidden className="size-4" />
                    </a>
                  )}
                </li>
              );
            })}
          </ul>
          {communityUrl && community.open_reports > 0 && (
            <a
              href={`${communityUrl}/admin`}
              className="mt-4 inline-flex text-sm font-bold cw-blue hover:underline"
            >
              ไปดูรายงานใน Community →
            </a>
          )}
        </section>

        <section aria-labelledby="ov-cms" className="cw-glass rounded-xl p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 id="ov-cms" className="text-xl font-black">
              เนื้อหาที่แก้ไปแล้ว
            </h2>
            <Link href="/admin/content" className="text-sm font-bold cw-blue hover:underline">
              แก้เนื้อหา →
            </Link>
          </div>
          {cms.pages.length ? (
            <ul className="mt-4 flex flex-wrap gap-2">
              {cms.pages.map((p) => (
                <li key={`${p.app}/${p.page}`}>
                  <Link
                    href={`/admin/content?p=${p.app}/${p.page}`}
                    className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm hover:border-[var(--em-blue-500)]"
                  >
                    <span className="font-mono text-xs text-muted-foreground">{p.app}</span>
                    {labelOf(p.app, p.page)}
                    <span className="font-bold cw-blue">{p.count}</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">
              ยังไม่ได้แก้อะไร ทุกหน้าใช้ข้อความตั้งต้นในโค้ดอยู่
            </p>
          )}

          <h3 className="mt-6 text-sm font-bold text-muted-foreground">ล่าสุด</h3>
          {cms.recent.length ? (
            <ol className="mt-2 flex flex-col gap-3">
              {cms.recent.map((r, i) => (
                <li
                  key={`${r.at}-${String(i)}`}
                  className="border-l-2 border-[var(--em-blue-500)] pl-3 text-sm"
                >
                  <p>
                    <span className="font-bold">{labelOf(r.app, r.page)}</span>{" "}
                    <span className="font-mono text-xs text-muted-foreground">{r.key}</span>
                  </p>
                  <p className="text-muted-foreground">
                    <span className="line-through decoration-1">{brief(r.old_value)}</span>
                    {" → "}
                    <span className="text-foreground">
                      {r.action === "DELETE" ? "กลับเป็นค่าเริ่มต้น" : brief(r.new_value)}
                    </span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {r.actor ?? "ไม่ทราบ"} · {when.format(new Date(r.at))}
                  </p>
                </li>
              ))}
            </ol>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">ยังไม่มีการแก้ไข</p>
          )}
        </section>
      </div>
    </main>
  );
}

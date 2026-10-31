import { resolveCms, type CmsRow } from "@empire/core/cms";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CMS_PAGES } from "@/lib/cms";
import { SectionCard, type FieldView } from "../editor";
import { requireAdmin } from "../guard";
import { PageMenu } from "../page-menu";

export const metadata: Metadata = {
  title: "จัดการเนื้อหา",
  robots: { index: false, follow: false },
};

export default async function ContentPage({
  searchParams,
}: {
  searchParams: Promise<{ p?: string }>;
}) {
  const supabase = await requireAdmin("/admin/content");

  const { p } = await searchParams;
  const current = CMS_PAGES.find((x) => `${x.app}/${x.page}` === p) ?? CMS_PAGES[0];
  if (!current) notFound();
  const { data } = await supabase
    .schema("cms")
    .from("entries")
    .select("key, kind, value")
    .eq("app", current.app)
    .eq("page", current.page);
  const content = resolveCms(current, (data ?? []) as CmsRow[]);
  const sectionOf = new Map(current.sections.map((s) => [s.key, s]));
  const movable = content.sections().filter((s) => sectionOf.get(s.key)?.movable !== false);
  const fixed = content.sections().filter((s) => sectionOf.get(s.key)?.movable === false);
  const ordered = [...fixed, ...movable];

  const valueOf = (path: string, kind: string) =>
    kind === "text"
      ? content.text(path)
      : kind === "number"
        ? content.number(path)
        : kind === "image"
          ? content.image(path)
          : content.link(path);

  const apps = [...new Set(CMS_PAGES.map((x) => x.app))];

  return (
    <>
      <main className="mx-auto grid max-w-6xl gap-6 px-4 pb-24 sm:px-6 lg:grid-cols-[15rem_1fr]">
        <div className="lg:col-span-2">
          <h1 className="pk-depth text-4xl font-black sm:text-5xl">จัดการเนื้อหา</h1>
          <p className="mt-2 max-w-xl text-muted-foreground">
            ผมแก้ข้อความ ตัวเลข รูป และลิงก์ของแต่ละหน้าได้ที่นี่ ซ่อนหรือสลับลำดับส่วนต่าง ๆ ได้
            บันทึกแล้วหน้าเว็บเปลี่ยนทันที
          </p>
        </div>

        <nav
          aria-label="หน้าที่แก้ได้"
          className="cw-glass h-fit rounded-xl p-3 lg:sticky lg:top-6"
        >
          <PageMenu
            current={`${current.app}/${current.page}`}
            apps={apps.map((app) => ({
              app,
              pages: CMS_PAGES.filter((x) => x.app === app).map((x) => ({
                id: `${x.app}/${x.page}`,
                label: x.label,
              })),
            }))}
          />
        </nav>

        <div className="flex min-w-0 flex-col gap-4">
          <p className="text-sm text-muted-foreground">
            {current.app} / <span className="font-semibold text-foreground">{current.label}</span>
          </p>
          {ordered.map((s, i) => {
            const def = sectionOf.get(s.key);
            if (!def) return null;
            const fields: FieldView[] = Object.entries(def.fields ?? {}).map(([name, field]) => ({
              name,
              field,
              value: valueOf(`${s.key}.${name}`, field.kind),
            }));
            const at = i - fixed.length;
            return (
              <SectionCard
                key={s.key}
                app={current.app}
                page={current.page}
                section={s.key}
                label={def.label}
                movable={def.movable !== false}
                visible={s.visible}
                first={at <= 0}
                last={at === movable.length - 1}
                fields={fields}
              />
            );
          })}
        </div>
      </main>
    </>
  );
}

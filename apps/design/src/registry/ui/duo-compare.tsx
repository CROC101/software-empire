import { Check, Minus } from "lucide-react";

const rows = [
  {
    f: "ซิงก์ข้ามเครื่อง",
    a: "ทันที",
    b: "ทุก 15 นาที",
    why: "แก้ในมือถือ เปิดคอมก็เห็นเลย",
  },
  { f: "ใช้งานออฟไลน์", a: true, b: false, why: "บนเครื่องบินหรือในลิฟต์ก็ยังเขียนต่อได้" },
  { f: "ประวัติย้อนหลัง", a: "ไม่จำกัด", b: "30 วัน", why: "กู้ร่างเมื่อปีก่อนกลับมาได้" },
  { f: "แชร์ให้ทีม", a: true, b: true, why: "ส่งลิงก์ให้เพื่อนร่วมงานดูหรือแก้ได้" },
  { f: "ส่งออกเป็นไฟล์", a: "Markdown, PDF", b: "PDF", why: "ย้ายไปเครื่องมืออื่นได้ไม่ติดล็อก" },
] as const;

function Cell({ v }: { v: string | boolean }) {
  if (v === true) return <Check aria-label="มี" className="size-4 text-primary" />;
  if (v === false) return <Minus aria-label="ไม่มี" className="size-4 text-muted-foreground" />;
  return <span>{v}</span>;
}

/**
 * Two products side by side, feature by feature, with a plain-words column on what each row means
 * for the reader. A real table from 42rem up; on a phone each row becomes its own small card.
 */
export default function DuoCompare({
  a = "แผนเรือ",
  b = "แผนแพ",
  why = true,
}: {
  a?: string;
  b?: string;
  why?: boolean;
}) {
  return (
    <section className="@container bg-background px-4 py-16 text-foreground @lg:px-8">
      <div className="mx-auto max-w-5xl">
        <h2 className="font-heading text-3xl font-black @lg:text-4xl">
          {a} หรือ {b}
        </h2>
        <p className="mt-3 max-w-xl text-muted-foreground">ต่างกันห้าข้อ เลือกตามที่คุณใช้จริง</p>

        <table className="mt-10 hidden w-full border-collapse text-left text-sm @2xl:table">
          <thead>
            <tr className="border-b border-border text-muted-foreground">
              <th scope="col" className="py-3 pr-4 font-medium">
                ฟีเจอร์
              </th>
              <th scope="col" className="px-4 py-3 font-semibold text-foreground">
                {a}
              </th>
              <th scope="col" className="px-4 py-3 font-semibold text-foreground">
                {b}
              </th>
              {why && (
                <th scope="col" className="py-3 pl-4 font-medium">
                  ได้อะไร
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.f} className="border-b border-border">
                <th scope="row" className="py-4 pr-4 font-medium">
                  <span className="mr-3 font-mono text-xs text-muted-foreground tabular-nums">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  {r.f}
                </th>
                <td className="bg-muted/50 px-4 py-4">
                  <Cell v={r.a} />
                </td>
                <td className="px-4 py-4">
                  <Cell v={r.b} />
                </td>
                {why && <td className="py-4 pl-4 text-muted-foreground">{r.why}</td>}
              </tr>
            ))}
          </tbody>
        </table>

        <ol className="mt-8 grid gap-3 @2xl:hidden">
          {rows.map((r, i) => (
            <li key={r.f} className="rounded-lg border border-border bg-card p-4">
              <p className="font-medium">
                <span className="mr-2 font-mono text-xs text-muted-foreground tabular-nums">
                  {String(i + 1).padStart(2, "0")}
                </span>
                {r.f}
              </p>
              <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
                <div className="rounded-md bg-muted/50 p-2">
                  <dt className="text-xs text-muted-foreground">{a}</dt>
                  <dd className="mt-1">
                    <Cell v={r.a} />
                  </dd>
                </div>
                <div className="rounded-md p-2">
                  <dt className="text-xs text-muted-foreground">{b}</dt>
                  <dd className="mt-1">
                    <Cell v={r.b} />
                  </dd>
                </div>
              </dl>
              {why && <p className="mt-3 text-sm text-muted-foreground">{r.why}</p>}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

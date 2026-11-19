import { Check, Minus } from "lucide-react";

const plans = ["เริ่มต้น", "โปร", "ทีม"];
const rows: [string, (boolean | string)[]][] = [
  ["โปรเจกต์", ["1", "ไม่จำกัด", "ไม่จำกัด"]],
  ["ชิ้นส่วนทั้งหมด", [false, true, true]],
  ["เทมเพลตเต็มหน้า", [false, true, true]],
  ["สมาชิกในทีม", ["1", "1", "20"]],
  ["สิทธิ์ตามบทบาท", [false, false, true]],
  ["ระบบดีไซน์ของแบรนด์", [false, false, true]],
  ["ตอบกลับ", ["ชุมชน", "24 ชม.", "4 ชม."]],
];

/** A feature-by-plan table. On narrow screens it scrolls sideways while the feature column stays put. */
export default function PricingCompare() {
  return (
    <section className="bg-background text-foreground">
      <div className="mx-auto max-w-4xl px-6 py-16">
        <h2 className="font-heading text-3xl font-black">เทียบทุกแพ็กเกจ</h2>
        <div
          tabIndex={0}
          role="region"
          aria-label="ตารางเทียบแพ็กเกจ"
          className="mt-8 overflow-x-auto rounded-xl border border-border focus-visible:ring-2 focus-visible:ring-ring"
        >
          <table className="w-full min-w-[34rem] text-sm">
            <thead>
              <tr className="border-b border-border">
                <th scope="col" className="sticky left-0 bg-card px-4 py-3 text-left font-semibold">
                  ฟีเจอร์
                </th>
                {plans.map((p) => (
                  <th
                    key={p}
                    scope="col"
                    className={`px-4 py-3 text-center font-semibold ${p === "โปร" ? "bg-primary/10 text-primary" : "bg-card"}`}
                  >
                    {p}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(([f, vals]) => (
                <tr key={f} className="border-b border-border last:border-0">
                  <th
                    scope="row"
                    className="sticky left-0 bg-background px-4 py-3 text-left font-normal"
                  >
                    {f}
                  </th>
                  {vals.map((v, i) => (
                    <td
                      key={i}
                      className={`px-4 py-3 text-center ${i === 1 ? "bg-primary/5" : ""}`}
                    >
                      {v === true ? (
                        <Check aria-label="มี" className="mx-auto size-4 text-primary" />
                      ) : v === false ? (
                        <Minus
                          aria-label="ไม่มี"
                          className="mx-auto size-4 text-muted-foreground"
                        />
                      ) : (
                        v
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

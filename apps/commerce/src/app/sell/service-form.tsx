import { Label } from "@empire/ui";
import { CATEGORIES } from "@/lib/market";
import { ActionForm } from "../action-form";
import { saveService } from "../actions";

export type ServiceDraft = {
  id: string | null;
  title: string;
  description: string;
  category: string;
  price_satang: number;
  delivery_days: number;
  tags: string[];
  published: boolean;
};

export const EMPTY_SERVICE: ServiceDraft = {
  id: null,
  title: "",
  description: "",
  category: "DEVELOPMENT",
  price_satang: 100000,
  delivery_days: 7,
  tags: [],
  published: false,
};

const FIELD = "rounded-md border bg-background px-3 py-2";

/** Create or edit one service. Limits mirror the SQL CHECKs; the server action re-validates with Zod. */
export function ServiceForm({ service }: { service: ServiceDraft }) {
  return (
    <ActionForm
      action={saveService}
      hidden={service.id ? { serviceId: service.id } : {}}
      submit={service.id ? "บันทึกการแก้ไข" : "สร้างบริการ"}
      variant="aurora"
      className="flex flex-col gap-4"
    >
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="title">ชื่อบริการ</Label>
        <input
          id="title"
          name="title"
          required
          minLength={5}
          maxLength={120}
          defaultValue={service.title}
          className={FIELD}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="description">รายละเอียด</Label>
        <textarea
          id="description"
          name="description"
          required
          minLength={20}
          maxLength={5000}
          rows={7}
          defaultValue={service.description}
          className={FIELD}
          placeholder="ทำอะไรให้ ได้อะไร ไม่รวมอะไร ต้องการอะไรจากผู้ซื้อ"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="category">หมวดหมู่</Label>
          <select id="category" name="category" defaultValue={service.category} className={FIELD}>
            {Object.entries(CATEGORIES).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="price">ราคา (บาท)</Label>
          <input
            id="price"
            name="price"
            inputMode="decimal"
            required
            defaultValue={String(service.price_satang / 100)}
            className={`${FIELD} tabular-nums`}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="deliveryDays">ส่งงานภายใน (วัน)</Label>
          <input
            id="deliveryDays"
            name="deliveryDays"
            type="number"
            min={1}
            max={90}
            required
            defaultValue={service.delivery_days}
            className={FIELD}
          />
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="tags">แท็ก (คั่นด้วยจุลภาค สูงสุด 10)</Label>
        <input
          id="tags"
          name="tags"
          defaultValue={service.tags.join(", ")}
          className={FIELD}
          placeholder="nextjs, supabase"
        />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="published"
          defaultChecked={service.published}
          className="size-4"
        />
        เผยแพร่ให้ทุกคนเห็น (ไม่ติ๊ก = เก็บเป็นฉบับร่าง)
      </label>
    </ActionForm>
  );
}

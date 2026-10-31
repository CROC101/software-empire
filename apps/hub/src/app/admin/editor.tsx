"use client";

import { Button, Input, Label } from "@empire/ui";
import { cmsValue, type CmsField } from "@empire/core/cms";
import { ArrowDown, ArrowUp } from "lucide-react";
import { useRouter } from "next/navigation";
import { useActionState, useState, useTransition } from "react";
import { arrangeSection, imageUploadUrl, saveSection, type SaveState } from "./actions";

export type FieldView = { name: string; field: CmsField; value: unknown };

type Props = {
  app: string;
  page: string;
  section: string;
  label: string;
  movable: boolean;
  visible: boolean;
  first: boolean;
  last: boolean;
  fields: FieldView[];
};

/** One section of a page: its show switch, its place, and a form for its fields. */
export function SectionCard({
  app,
  page,
  section,
  label,
  movable,
  visible,
  first,
  last,
  fields,
}: Props) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [arrangeError, setArrangeError] = useState("");
  const [state, save, saving] = useActionState<SaveState, FormData>(saveSection, null);
  const [dirty, setDirty] = useState(false);

  const arrange = (change: { visible?: boolean; move?: -1 | 1 }) => {
    start(async () => {
      const res = await arrangeSection({ app, page, section, ...change });
      setArrangeError(res?.ok ? "" : (res?.message ?? ""));
      router.refresh();
    });
  };

  return (
    <section
      aria-labelledby={`s-${section}`}
      className={`rounded-xl border bg-card p-4 shadow-sm sm:p-5 ${visible ? "" : "opacity-70"}`}
    >
      <div className="flex flex-wrap items-center gap-3">
        <h2 id={`s-${section}`} className="mr-auto text-lg font-black">
          {label}
        </h2>
        {movable && (
          <>
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                role="switch"
                className="size-5 accent-[var(--em-blue-600)]"
                checked={visible}
                disabled={pending}
                onChange={(e) => arrange({ visible: e.target.checked })}
              />
              {visible ? "แสดงบนหน้าเว็บ" : "ซ่อนอยู่"}
            </label>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="size-11"
              aria-label="เลื่อนขึ้น"
              disabled={first || pending}
              onClick={() => arrange({ move: -1 })}
            >
              <ArrowUp aria-hidden />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="size-11"
              aria-label="เลื่อนลง"
              disabled={last || pending}
              onClick={() => arrange({ move: 1 })}
            >
              <ArrowDown aria-hidden />
            </Button>
          </>
        )}
      </div>
      {arrangeError && (
        <p role="alert" className="mt-2 text-sm text-destructive">
          {arrangeError}
        </p>
      )}

      {fields.length > 0 && (
        <form
          action={(form) => {
            setDirty(false);
            save(form);
          }}
          onChange={() => setDirty(true)}
          className="mt-4 flex flex-col gap-4"
        >
          <input type="hidden" name="app" value={app} />
          <input type="hidden" name="page" value={page} />
          <input type="hidden" name="section" value={section} />
          {fields.map((f) => (
            <FieldInput key={f.name} id={`${section}.${f.name}`} view={f} />
          ))}
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={saving}
              className="cw-btn-blue rounded-xl px-5 py-2.5 text-sm font-bold disabled:opacity-60"
            >
              {saving ? "กำลังบันทึก…" : "บันทึกส่วนนี้"}
            </button>
            {dirty ? (
              <span className="text-sm text-warning">ยังไม่ได้บันทึก</span>
            ) : state?.ok ? (
              <span role="status" className="text-sm text-success">
                {state.message}
              </span>
            ) : state ? (
              <span role="alert" className="text-sm text-destructive">
                {state.message}
              </span>
            ) : null}
          </div>
        </form>
      )}
    </section>
  );
}

function FieldInput({ id, view }: { id: string; view: FieldView }) {
  const { field, value } = view;
  if (field.kind === "text") {
    const v = typeof value === "string" ? value : field.default;
    return (
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={id}>{field.label}</Label>
        {field.multiline ? (
          <textarea
            id={id}
            name={id}
            defaultValue={v}
            maxLength={2000}
            rows={3}
            className="rounded-md border bg-background px-3 py-2 text-base focus-visible:outline-2 focus-visible:outline-ring"
          />
        ) : (
          <Input id={id} name={id} defaultValue={v} maxLength={2000} />
        )}
      </div>
    );
  }
  if (field.kind === "number") {
    return (
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={id}>{field.label}</Label>
        <Input
          id={id}
          name={id}
          inputMode="decimal"
          defaultValue={String(typeof value === "number" ? value : field.default)}
          className="max-w-48 tabular-nums"
        />
        <p className="text-xs text-muted-foreground">หน้าเว็บจะนับไปหาเลขใหม่เอง</p>
      </div>
    );
  }
  if (field.kind === "link") {
    const v = (value ?? field.default) as typeof field.default;
    return (
      <fieldset className="grid gap-3 sm:grid-cols-2">
        <legend className="mb-1.5 text-sm font-medium">{field.label}</legend>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`${id}:label`}>ข้อความบนลิงก์</Label>
          <Input id={`${id}:label`} name={`${id}:label`} defaultValue={v.label} maxLength={200} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`${id}:href`}>ลิงก์ไปที่</Label>
          <Input
            id={`${id}:href`}
            name={`${id}:href`}
            defaultValue={v.href}
            placeholder="https://"
          />
        </div>
      </fieldset>
    );
  }
  return (
    <ImageInput
      id={id}
      label={field.label}
      value={(value ?? field.default) as typeof field.default}
    />
  );
}

function ImageInput({
  id,
  label,
  value,
}: {
  id: string;
  label: string;
  value: { url: string; alt: string };
}) {
  const [url, setUrl] = useState(value.url);
  const [note, setNote] = useState("");
  const upload = async (file: File) => {
    setNote("กำลังอัปโหลด…");
    const ticket = await imageUploadUrl(file.type);
    if ("error" in ticket) {
      setNote(ticket.error);
      return;
    }
    const res = await fetch(ticket.signedUrl, {
      method: "PUT",
      body: file,
      headers: { "content-type": file.type, "x-upsert": "false" },
    }).catch(() => null);
    if (!res?.ok) {
      setNote("อัปโหลดไม่สำเร็จ ไฟล์ต้องไม่เกิน 5 MB");
      return;
    }
    setUrl(ticket.publicUrl);
    setNote("อัปโหลดแล้ว กดบันทึกเพื่อใช้รูปนี้");
  };
  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="mb-1.5 text-sm font-medium">{label}</legend>
      <div className="flex flex-wrap items-start gap-4">
        {/* preview only what the database would accept (https or a site path), never a typed
            javascript: / data: URL */}
        {cmsValue.image.shape.url.safeParse(url).success && (
          // eslint-disable-next-line @next/next/no-img-element -- any https host the admin picks
          <img src={url} alt="" className="size-24 rounded-md border object-cover" />
        )}
        <div className="flex min-w-60 flex-1 flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`${id}:url`}>ลิงก์รูป</Label>
            <Input
              id={`${id}:url`}
              name={`${id}:url`}
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`${id}:alt`}>คำอธิบายรูป (alt)</Label>
            <Input id={`${id}:alt`} name={`${id}:alt`} defaultValue={value.alt} maxLength={300} />
          </div>
          <label className="w-fit cursor-pointer text-sm font-bold cw-blue hover:underline">
            อัปโหลดรูปใหม่
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif,image/avif"
              className="sr-only"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void upload(file);
              }}
            />
          </label>
          {note && (
            <p role="status" className="text-sm text-muted-foreground">
              {note}
            </p>
          )}
        </div>
      </div>
    </fieldset>
  );
}

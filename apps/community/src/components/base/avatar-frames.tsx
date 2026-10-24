import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, LayoutGrid, Loader2, User } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Avatar } from "@/components/base/user-name";
import { profileKey } from "@/components/base/profile-data";
import { api } from "@/lib/backend/api";
import { AVATAR_FRAMES, type AvatarFrame, type MyProfile } from "@/lib/backend/types";

/// กรอบรูปโปรไฟล์ ("แต่งโปรไฟล์") — วงแหวนรอบรูป เจ้าของเลือกเอง ทุกคนที่เห็นโปรไฟล์เห็นกรอบด้วย
///
/// ทุกกรอบใช้ได้ฟรีตอนนี้ (หมวด "ล็อค" + ปลดล็อกด้วยการเช็กอินต่อเนื่องค่อยเพิ่มทีหลัง)
/// สีมาจาก token ของ @empire/ui ทั้งหมด ไม่มีค่าสีดิบ

export const FRAME_INFO: Record<AvatarFrame, { label: string; note: string; ring: string }> = {
  classic: {
    label: "คลาสสิก",
    note: "ได้รับตั้งแต่สมัครสมาชิก",
    ring: "conic-gradient(from 210deg, var(--em-gold-300), var(--em-gold-500), var(--em-gold-300))",
  },
  lavender: {
    label: "ลาเวนเดอร์",
    note: "ม่วงอ่อน นุ่ม ๆ",
    ring: "conic-gradient(from 210deg, var(--em-violet-300), var(--em-violet-600), var(--em-violet-300))",
  },
  rosegold: {
    label: "โรสโกลด์",
    note: "ชมพูทองอุ่น ๆ",
    ring: "conic-gradient(from 210deg, var(--em-coral-400), var(--em-gold-300), var(--em-coral-500), var(--em-coral-400))",
  },
  aurora: {
    label: "ออโรร่า",
    note: "แสงเหนือไล่หลายสี",
    ring: "conic-gradient(from 0deg, var(--em-teal-400), var(--em-sky-500), var(--em-violet-500), var(--em-fuchsia-400), var(--em-teal-400))",
  },
  ocean: {
    label: "โอเชียน",
    note: "ฟ้า crocwork",
    ring: "conic-gradient(from 210deg, var(--em-blue-500), var(--em-sky-500), var(--em-blue-700), var(--em-blue-500))",
  },
  mono: {
    label: "โมโน",
    note: "เรียบ ขาวดำ",
    ring: "conic-gradient(from 210deg, var(--em-ink-200), var(--em-ink-700), var(--em-ink-200))",
  },
};

/// วงแหวนกรอบรอบลูก (รูปโปรไฟล์) — กรอบกว้างตามขนาดที่ห่อ
export function FrameRing({
  frame,
  children,
  className = "",
}: {
  frame: AvatarFrame;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`block size-full rounded-full p-[3px] md:p-[4px] ${className}`}
      style={{ background: FRAME_INFO[frame].ring }}
    >
      <span className="block size-full rounded-full bg-background p-[2px] md:p-[3px]">
        {children}
      </span>
    </span>
  );
}

type Tab = "all" | "general";

/// ตัวเลือกกรอบแบบในแอปดูดวง: ตัวอย่างใหญ่ด้านบน แท็บ "ทั้งหมด / ทั่วไป" และตารางกรอบ
/// เลือกแล้วบันทึกทันที (PATCH /profiles/me) แคชโปรไฟล์อัปเดตตาม
export function FramePicker({ profile }: { profile: MyProfile }) {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>("all");
  const current = profile.avatarFrame ?? "classic";
  const [preview, setPreview] = useState<AvatarFrame>(current);

  const save = useMutation({
    mutationFn: (frame: AvatarFrame) =>
      api.patch<MyProfile>("/profiles/me", { avatarFrame: frame }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: profileKey(profile.coreUserId) }),
    onError: () => setPreview(current),
  });

  const pick = (frame: AvatarFrame) => {
    setPreview(frame);
    if (frame !== current) save.mutate(frame);
  };

  return (
    <section aria-labelledby="frame-picker-title" className="flex flex-col gap-5">
      <h2 id="frame-picker-title" className="text-nx-label font-semibold">
        รูปและกรอบโปรไฟล์
      </h2>

      <div className="flex flex-col items-center gap-2 rounded-xl border border-border bg-muted/40 py-6">
        <div className="size-28">
          <FrameRing frame={preview}>
            <span className="block size-full overflow-hidden rounded-full">
              <Avatar coreUserId={profile.coreUserId} size={112} showOnline={false} />
            </span>
          </FrameRing>
        </div>
        <p className="mt-2 text-lg font-bold">{FRAME_INFO[preview].label}</p>
        <p className="text-nx-caption text-muted-foreground" aria-live="polite">
          {save.isPending ? (
            <span className="inline-flex items-center gap-1">
              <Loader2 aria-hidden className="size-3 animate-spin" /> กำลังบันทึก…
            </span>
          ) : save.isError ? (
            "บันทึกไม่สำเร็จ ลองใหม่อีกครั้ง"
          ) : (
            FRAME_INFO[preview].note
          )}
        </p>
      </div>

      <div role="tablist" aria-label="หมวดกรอบ" className="grid grid-cols-2 gap-2">
        {(
          [
            ["all", "ทั้งหมด", LayoutGrid],
            ["general", "ทั่วไป", User],
          ] as const
        ).map(([id, label, Icon]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={`flex items-center justify-center gap-1.5 rounded-lg border py-2 text-nx-label font-semibold transition-colors ${
              tab === id
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border hover:bg-accent"
            }`}
          >
            <Icon aria-hidden className="size-4" />
            {label}
          </button>
        ))}
      </div>

      {/* "ทั่วไป" = กรอบที่ทุกคนได้ — ตอนนี้คือทุกกรอบ แท็บมีไว้รอหมวดล็อกในอนาคต */}
      <div
        role="radiogroup"
        aria-label="กรอบโปรไฟล์"
        className="grid grid-cols-3 gap-3 sm:grid-cols-6"
      >
        {AVATAR_FRAMES.map((frame) => {
          const selected = preview === frame;
          return (
            <button
              key={frame}
              type="button"
              role="radio"
              aria-checked={selected}
              disabled={save.isPending}
              onClick={() => pick(frame)}
              className={`relative flex flex-col items-center gap-2 rounded-xl border p-3 transition-[transform,border-color] active:scale-95 disabled:opacity-60 ${
                selected
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-foreground/30"
              }`}
            >
              <span className="size-12">
                <FrameRing frame={frame}>
                  <span className="grid size-full place-items-center rounded-full bg-muted">
                    <User aria-hidden className="size-5 text-muted-foreground" />
                  </span>
                </FrameRing>
              </span>
              <span className={`text-nx-caption ${selected ? "font-bold text-primary" : ""}`}>
                {FRAME_INFO[frame].label}
              </span>
              {selected && (
                <span className="absolute right-1.5 top-1.5 grid size-5 place-items-center rounded-full bg-primary text-primary-foreground">
                  <Check aria-hidden className="size-3" strokeWidth={3} />
                </span>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}

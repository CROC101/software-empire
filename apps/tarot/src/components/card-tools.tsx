import { CircleHelp, Maximize2, X } from "lucide-react";
import { useId, useRef } from "react";
import { cardImage } from "@/lib/deck";
import type { Drawn } from "@/lib/reading";

const icon =
  "grid size-11 place-items-center rounded-full bg-[color-mix(in_oklab,var(--em-ink-975)_70%,transparent)] text-[var(--em-ink-100)] hover:bg-[color-mix(in_oklab,var(--em-ink-0)_14%,transparent)]";
const sheet =
  "m-auto rounded-xl border border-[color-mix(in_oklab,var(--em-ink-0)_14%,transparent)] bg-[var(--em-ink-950)] text-[var(--em-ink-50)] backdrop:bg-black/70";

/** Under a revealed card: how to read it, and the card full screen. */
export function CardTools({ drawn }: { drawn: Drawn }) {
  const help = useRef<HTMLDialogElement>(null);
  const big = useRef<HTMLDialogElement>(null);
  // three cards on screen means three of these: ids must not repeat
  const titleId = useId();
  const name = `${drawn.card.th} (${drawn.card.en})${drawn.reversed ? " กลับหัว" : ""}`;
  return (
    <div className="flex justify-center gap-3">
      <button
        type="button"
        className={icon}
        aria-label="วิธีอ่านไพ่ใบนี้"
        onClick={() => help.current?.showModal()}
      >
        <CircleHelp className="size-5" aria-hidden />
      </button>
      <button
        type="button"
        className={icon}
        aria-label="ดูไพ่เต็มจอ"
        onClick={() => big.current?.showModal()}
      >
        <Maximize2 className="size-5" aria-hidden />
      </button>

      <dialog
        ref={help}
        aria-labelledby={titleId}
        className={`${sheet} w-[min(26rem,calc(100%-2rem))] p-5`}
      >
        <h2 id={titleId} className="text-lg font-black text-[var(--em-ink-0)]">
          อ่านไพ่ใบนี้ยังไง
        </h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed">
          <li>
            <b>ไพ่ตั้งตรง</b> คือพลังของไพ่ที่ไหลได้เต็มที่
          </li>
          <li>
            <b>ไพ่กลับหัว</b> คือพลังเดียวกันที่ติดขัด ล่าช้า หรือหันเข้าข้างใน ไม่ได้แปลว่าร้ายเสมอ
          </li>
          <li>คำสำคัญคือแก่นของไพ่ ลองถามตัวเองว่าคำไหนตรงกับเรื่องที่คิดอยู่</li>
          <li>คำทำนายเป็นมุมมองให้ทบทวน การตัดสินใจยังเป็นของคุณ</li>
        </ul>
        <form method="dialog" className="mt-4">
          <button className="min-h-11 w-full rounded-md bg-primary font-bold text-primary-foreground">
            เข้าใจแล้ว
          </button>
        </form>
      </dialog>

      <dialog
        ref={big}
        aria-label={name}
        className="m-auto max-h-none max-w-none bg-transparent p-0 backdrop:bg-black/85"
        onClick={(e) => {
          if (e.target === e.currentTarget) big.current?.close();
        }}
      >
        <img
          src={cardImage(drawn.card)}
          alt={name}
          width={420}
          height={731}
          className={`h-[min(88dvh,calc(92vw*731/420))] w-auto rounded-xl ${drawn.reversed ? "rotate-180" : ""}`}
        />
        <form method="dialog" className="absolute top-3 right-3">
          <button className={icon} aria-label="ปิด">
            <X className="size-5" aria-hidden />
          </button>
        </form>
      </dialog>
    </div>
  );
}

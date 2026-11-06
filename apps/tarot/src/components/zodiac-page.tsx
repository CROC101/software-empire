import { useMemo, useState } from "react";
import { useTarotData } from "@/lib/data";
import { cardImage, elementOf, ELEMENT_TH } from "@/lib/deck";
import { bangkokDay, dailyCard, interpret } from "@/lib/reading";
import { harmony, signOf, SIGNS, type Sign } from "@/lib/zodiac";
import { CardBack } from "./card-back";
import { FlipCard } from "./flip-card";

const HARMONY = {
  same: "ไพ่ธาตุเดียวกับราศีคุณ พลังของวันไหลง่าย ทำตามจังหวะตัวเองได้เลย",
  help: "ธาตุของไพ่หนุนราศีคุณ วันนี้มีแรงส่งจากข้างนอก",
  pull: "ธาตุของไพ่ดึงไปคนละทางกับราศีคุณ ใจเย็นและยืดหยุ่นไว้",
} as const;

/** Today's card for a sign: the reader's own from their birthday, or any sign they pick. */
export function ZodiacPage() {
  const { profile } = useTarotData();
  const own = profile?.birth_date ? signOf(profile.birth_date) : null;
  const [picked, setPicked] = useState<Sign | null>(null);
  const sign = picked ?? own;
  const day = bangkokDay();
  const drawn = useMemo(() => (sign ? dailyCard(`sign:${sign.id}`, day) : null), [sign, day]);
  const [open, setOpen] = useState(false);

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 pb-28 pt-4 text-[var(--em-ink-50)]">
      <header className="text-center">
        <p className="font-heading text-xs font-semibold uppercase tracking-[0.2em] text-[var(--em-blue-300)]">
          ดวงราศี
        </p>
        <h1 className="text-2xl font-black text-[var(--em-ink-0)]">ไพ่ประจำราศีวันนี้</h1>
        {!own && (
          <p className="text-sm text-[var(--em-ink-300)]">
            ใส่วันเกิดในแท็บ “ฉัน” แล้วนกฮูกจะรู้ราศีของคุณเอง
          </p>
        )}
      </header>

      <fieldset>
        <legend className="sr-only">เลือกราศี</legend>
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
          {SIGNS.map((s) => (
            <button
              key={s.id}
              type="button"
              aria-pressed={sign?.id === s.id}
              onClick={() => {
                setPicked(s);
                setOpen(false);
              }}
              className="flex min-h-14 flex-col items-center justify-center rounded-md border border-[color-mix(in_oklab,var(--em-ink-0)_18%,transparent)] text-sm aria-pressed:border-[var(--em-blue-300)] aria-pressed:bg-[color-mix(in_oklab,var(--em-blue-400)_22%,transparent)]"
            >
              <span aria-hidden className="text-lg leading-none">
                {s.symbol}
              </span>
              {s.th}
            </button>
          ))}
        </div>
      </fieldset>

      {sign && drawn && (
        <>
          <section aria-labelledby="sign-title" className="tt-panel space-y-1 p-4 text-center">
            <h2 id="sign-title" className="text-xl font-black text-[var(--em-gold-300)]">
              {sign.symbol} ราศี{sign.th}
              {own?.id === sign.id && (
                <span className="ml-2 text-sm font-semibold text-[var(--em-blue-200)]">
                  ราศีของคุณ
                </span>
              )}
            </h2>
            <p className="text-sm text-[var(--em-ink-300)]">
              {ELEMENT_TH[sign.element]} · {sign.trait}
            </p>
          </section>

          <div className="grid place-items-center">
            <FlipCard
              flipped={open}
              onFlipChange={setOpen}
              ariaLabel={
                open ? `ไพ่ราศี${sign.th} ${drawn.card.th}` : `แตะเพื่อเปิดไพ่ราศี${sign.th}`
              }
              className="aspect-[420/731] w-40"
              front={<CardBack />}
              back={
                <img
                  src={cardImage(drawn.card)}
                  alt={drawn.card.th}
                  width={420}
                  height={731}
                  className={`size-full object-cover ${drawn.reversed ? "rotate-180" : ""}`}
                />
              }
            />
          </div>

          {open && (
            <section aria-labelledby="sign-card" className="tt-panel space-y-3 p-4">
              <h3 id="sign-card" className="text-lg font-black text-[var(--em-ink-0)]">
                {drawn.card.th}
                <span className="ml-2 text-sm font-normal text-[var(--em-ink-300)]">
                  {drawn.reversed ? "กลับหัว" : "ตั้งตรง"} · {ELEMENT_TH[elementOf(drawn.card)]}
                </span>
              </h3>
              <p className="leading-relaxed">{interpret(drawn, "general")}</p>
              <p className="rounded-md bg-[color-mix(in_oklab,var(--em-blue-400)_14%,transparent)] p-3 text-sm">
                {HARMONY[harmony(sign.element, elementOf(drawn.card))]}
              </p>
              <p className="text-sm text-[var(--em-ink-200)]">
                <span className="font-semibold text-[var(--em-gold-300)]">คำแนะนำ · </span>
                {drawn.card.advice}
              </p>
            </section>
          )}
          <p className="text-center text-xs text-[var(--em-ink-400)]">
            ราศีนับแบบไทย (ดวงอาทิตย์ย้ายราศีราววันสงกรานต์) วันเปลี่ยนราศีอาจคลาดได้หนึ่งวัน
          </p>
        </>
      )}
    </div>
  );
}

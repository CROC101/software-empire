import { MeshMascot } from "@empire/ui";
import {
  ChevronRight,
  CircleHelp,
  Coins,
  GraduationCap,
  Heart,
  HeartPulse,
  Layers,
  Maximize2,
  Sparkles,
  Star,
  Sun,
  Wallet,
} from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { Link } from "react-router";
import { cardAt, cardImage, elementOf, ELEMENT_TH } from "@/lib/deck";
import { bangkokDay, dailyCard, interpret, type Drawn } from "@/lib/reading";
import { useSession } from "@/lib/session";
import { Announcement } from "./announce";
import { CardBack as CardBackArt } from "./card-back";
import { CheckIn } from "./check-in";
import { FlipCard } from "./flip-card";

const thaiDate = new Intl.DateTimeFormat("th-TH", {
  timeZone: "Asia/Bangkok",
  weekday: "long",
  day: "numeric",
  month: "long",
});

const TOPICS = [
  { to: "/read?topic=general", label: "ภาพรวม", blurb: "ชีวิตช่วงนี้", icon: Sun },
  { to: "/read?topic=love", label: "ความรัก", blurb: "ใจเขาใจเรา", icon: Heart },
  { to: "/read?topic=work", label: "การงาน", blurb: "งานและเป้าหมาย", icon: Layers },
  { to: "/read?topic=money", label: "การเงิน", blurb: "รายรับรายจ่าย", icon: Wallet },
  { to: "/read?topic=study", label: "การเรียน", blurb: "สอบและสมาธิ", icon: GraduationCap },
  { to: "/read?topic=health", label: "สุขภาพ", blurb: "กายและใจ", icon: HeartPulse },
  { to: "/zodiac", label: "ดวงราศี", blurb: "ไพ่ประจำราศี", icon: Star },
  { to: "/read?spread=yesno", label: "ใช่หรือไม่", blurb: "ถามเรื่องเดียว", icon: CircleHelp },
  { to: "/read?spread=celtic", label: "เซลติกครอส", blurb: "ดูลึกครบทุกด้าน", icon: Sparkles },
] as const;

/** The back every card shares: the night pattern with the moon in the middle. */
function CardBack() {
  return <CardBackArt />;
}

function CardFace({ drawn }: { drawn: Drawn }) {
  return (
    <img
      src={cardImage(drawn.card)}
      alt={`${drawn.card.th} (${drawn.card.en})${drawn.reversed ? " กลับหัว" : ""}`}
      width={420}
      height={731}
      decoding="async"
      className={`size-full object-cover ${drawn.reversed ? "rotate-180" : ""}`}
    />
  );
}

/** Home: the day's card in its orbit, what it means, and the ways into a reading. */
export function HomePage() {
  const { user } = useSession();
  const day = bangkokDay();
  const drawn = useMemo(() => dailyCard(user?.id ?? "guest", day), [user?.id, day]);
  const [open, setOpen] = useState(false);
  const big = useRef<HTMLDialogElement>(null);
  const help = useRef<HTMLDialogElement>(null);
  const element = elementOf(drawn.card);

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 pb-28 pt-2 text-[var(--em-ink-50)]">
      <section aria-labelledby="daily-title" className="flex flex-col items-center text-center">
        <h1 id="daily-title" className="text-2xl font-black text-[var(--em-ink-0)]">
          <span aria-hidden className="text-[var(--em-gold-300)]">
            ✦{" "}
          </span>
          ไพ่ประจำวัน
          <span aria-hidden className="text-[var(--em-gold-300)]">
            {" "}
            ✦
          </span>
        </h1>
        <p className="text-sm text-[var(--em-ink-300)]">{thaiDate.format(new Date())}</p>

        <div className="relative my-6 grid w-full place-items-center py-6">
          <div aria-hidden className="tt-orbit" />
          <FlipCard
            flipped={open}
            onFlipChange={setOpen}
            ariaLabel={open ? `ไพ่ประจำวัน ${drawn.card.th}` : "แตะหรือลากเพื่อเปิดไพ่ประจำวัน"}
            className="aspect-[420/731] w-44 sm:w-48"
            front={<CardBack />}
            back={<CardFace drawn={drawn} />}
          />
          {/* the owl peeks round the card, the way a reader leans in */}
          <MeshMascot
            kind="owl"
            label="นกฮูกหมอดูของ crocwork"
            className="absolute right-2 bottom-0 size-20 sm:right-6"
          />
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => help.current?.showModal()}
            aria-label="ไพ่ประจำวันคืออะไร"
            className="grid size-11 place-items-center rounded-full bg-[color-mix(in_oklab,var(--em-ink-975)_70%,transparent)] hover:bg-[color-mix(in_oklab,var(--em-ink-0)_14%,transparent)]"
          >
            <CircleHelp className="size-5" aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => big.current?.showModal()}
            disabled={!open}
            aria-label="ดูไพ่เต็มจอ"
            className="grid size-11 place-items-center rounded-full bg-[color-mix(in_oklab,var(--em-ink-975)_70%,transparent)] hover:bg-[color-mix(in_oklab,var(--em-ink-0)_14%,transparent)] disabled:opacity-40"
          >
            <Maximize2 className="size-5" aria-hidden />
          </button>
        </div>
        {!open && (
          <p className="mt-3 text-sm text-[var(--em-ink-200)]">ตั้งสมาธิ แล้วแตะหรือลากไพ่</p>
        )}
      </section>

      {open && (
        <section aria-labelledby="meaning-title" className="tt-panel space-y-3 p-4 text-center">
          <p className="font-heading text-xs font-semibold uppercase tracking-[0.2em] text-[var(--em-blue-300)]">
            ความหมายของไพ่
          </p>
          <h2 id="meaning-title" className="text-2xl font-black text-[var(--em-gold-300)]">
            {drawn.card.th}
          </h2>
          <p className="font-heading text-sm text-[var(--em-ink-300)]">{drawn.card.en}</p>
          <div className="flex justify-center gap-2 text-xs font-semibold">
            <span className="rounded-full bg-[color-mix(in_oklab,var(--em-success)_25%,transparent)] px-3 py-1">
              {drawn.reversed ? "ไพ่กลับหัว" : "ไพ่ตั้งตรง"}
            </span>
            <span className="rounded-full bg-[color-mix(in_oklab,var(--em-coral-500)_25%,transparent)] px-3 py-1">
              {ELEMENT_TH[element]}
            </span>
          </div>
          <p className="text-sm text-[var(--em-blue-200)]">{drawn.card.keywords.join(" · ")}</p>
          <p className="text-left leading-relaxed">{interpret(drawn, "general")}</p>
          <p className="rounded-md bg-[color-mix(in_oklab,var(--em-gold-300)_12%,transparent)] p-3 text-left text-sm">
            <span className="font-semibold text-[var(--em-gold-300)]">คำแนะนำ · </span>
            {drawn.card.advice}
          </p>
        </section>
      )}

      <Announcement />

      <section aria-labelledby="read-title" className="space-y-3">
        <h2 id="read-title" className="font-bold text-[var(--em-ink-0)]">
          อ่านไพ่
        </h2>
        <Link
          to="/read"
          className="tt-panel flex items-center gap-4 p-4 hover:border-[var(--em-blue-300)]"
        >
          <span aria-hidden className="relative h-16 w-20 shrink-0">
            {[0, 21, 17].map((n, i) => (
              <img
                key={n}
                src={cardImage(cardAt(n))}
                alt=""
                width={36}
                height={62}
                loading="lazy"
                className="absolute bottom-0 h-14 w-auto rounded-sm shadow-md"
                style={{ left: `${String(i * 18)}px`, rotate: `${String((i - 1) * 10)}deg` }}
              />
            ))}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-bold text-[var(--em-ink-0)]">อ่านไพ่ทาโรต์</span>
            <span className="block text-sm text-[var(--em-ink-300)]">
              ตั้งคำถาม เลือกไพ่ แล้วรับคำทำนาย
            </span>
          </span>
          <ChevronRight className="size-5 text-[var(--em-blue-300)]" aria-hidden />
        </Link>
        <ul className="grid grid-cols-3 gap-2">
          {TOPICS.map(({ to, label, blurb, icon: Icon }) => (
            <li key={to}>
              <Link
                to={to}
                className="tt-panel flex min-h-24 flex-col items-center justify-center gap-1.5 p-2 text-center hover:border-[var(--em-blue-300)]"
              >
                <span className="grid size-10 shrink-0 place-items-center rounded-md bg-[color-mix(in_oklab,var(--em-blue-400)_22%,transparent)] text-[var(--em-blue-200)]">
                  <Icon className="size-5" aria-hidden />
                </span>
                <span className="block text-sm font-semibold text-[var(--em-ink-0)]">{label}</span>
                <span className="block text-[11px] leading-tight text-[var(--em-ink-300)]">
                  {blurb}
                </span>
              </Link>
            </li>
          ))}
        </ul>
        <p className="flex items-center gap-1.5 text-xs text-[var(--em-ink-400)]">
          <Coins className="size-3.5" aria-hidden /> เซลติกครอสและความรัก 5 ใบใช้เหรียญ ที่เหลือฟรี
        </p>
      </section>

      <CheckIn />

      <dialog
        ref={help}
        aria-labelledby="daily-help-title"
        className="m-auto w-[min(26rem,calc(100%-2rem))] rounded-xl border border-[color-mix(in_oklab,var(--em-ink-0)_14%,transparent)] bg-[var(--em-ink-950)] p-5 text-[var(--em-ink-50)] backdrop:bg-black/70"
      >
        <h2 id="daily-help-title" className="text-lg font-black text-[var(--em-ink-0)]">
          ไพ่ประจำวันคืออะไร
        </h2>
        <ul className="mt-3 space-y-3 text-sm leading-relaxed">
          <li>
            <b>วันละหนึ่งใบ</b> ทุกคนได้ไพ่ของตัวเอง เปลี่ยนตอนเที่ยงคืนตามเวลาไทย ทั้งวันเป็นใบเดิม
          </li>
          <li>
            <b>เป็นธีมของวัน</b> ไม่ใช่คำตอบของคำถามใด
            ลองถือไว้ในใจแล้วสังเกตว่าวันนี้เรื่องไหนตรงกับไพ่
          </li>
          <li>
            <b>ตั้งตรงหรือกลับหัว</b> กลับหัวคือพลังเดียวกันที่ติดขัดหรือหันเข้าข้างใน
            ไม่ได้แปลว่าร้าย
          </li>
          <li>
            <b>อยากถามเรื่องเฉพาะ</b> ไปที่ “อ่านไพ่” แล้วเลือกหัวข้อหรือกระดานไพ่
          </li>
        </ul>
        <p className="mt-4 rounded-md bg-[color-mix(in_oklab,var(--em-ink-0)_6%,transparent)] p-3 text-xs text-[var(--em-ink-300)]">
          คำทำนายเพื่อความบันเทิงและการทบทวนตัวเอง ไม่ใช่คำแนะนำทางการแพทย์ การเงิน หรือกฎหมาย
        </p>
        <form method="dialog" className="mt-4">
          <button className="min-h-11 w-full rounded-md bg-primary font-bold text-primary-foreground">
            เข้าใจแล้ว
          </button>
        </form>
      </dialog>

      <dialog
        ref={big}
        aria-label={`${drawn.card.th} เต็มจอ`}
        className="m-auto max-h-none max-w-none overflow-visible bg-transparent p-0 backdrop:bg-black/85"
      >
        <div className="flex flex-col items-center gap-4">
          <FlipCard
            defaultFlipped
            ariaLabel={`${drawn.card.th} ลากเพื่อหมุนไพ่`}
            className="aspect-[420/731] h-[min(78dvh,calc(88vw*731/420))]"
            front={<CardBack />}
            back={<CardFace drawn={drawn} />}
          />
          <p className="text-sm text-[var(--em-ink-200)]">ลากเพื่อหมุนไพ่ หรือแตะเพื่อพลิก</p>
          <form method="dialog">
            <button className="min-h-11 rounded-md border border-[color-mix(in_oklab,var(--em-ink-0)_30%,transparent)] px-6 text-[var(--em-ink-0)]">
              ปิด
            </button>
          </form>
        </div>
      </dialog>
    </div>
  );
}

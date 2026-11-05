import { MeshMascot } from "@empire/ui";
import { LogOut, RotateCcw, Shuffle } from "lucide-react";
import { useMemo, useState } from "react";
import { useTarotData } from "@/lib/data";
import {
  bangkokDay,
  dailyCard,
  draw,
  interpret,
  SPREADS,
  TOPICS,
  type Drawn,
  type SpreadId,
  type Topic,
} from "@/lib/reading";
import { signInUrl, signOut, useSession } from "@/lib/session";
import { CheckIn } from "./check-in";
import { ProfileForm } from "./profile-form";
import { CardMeaning, TarotCard } from "./tarot-card";

const thaiDate = new Intl.DateTimeFormat("th-TH", {
  timeZone: "Asia/Bangkok",
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

/** The card of the day: one per person per Bangkok day, turned over by a tap. */
export function DailyPage() {
  const { user } = useSession();
  const { profile } = useTarotData();
  const day = bangkokDay();
  const drawn = useMemo(() => dailyCard(user?.id ?? "guest", day), [user?.id, day]);
  const [open, setOpen] = useState(false);

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 pb-28 pt-4">
      <header className="flex flex-col items-center text-center">
        <MeshMascot kind="owl" label="นกฮูกหมอดูของ crocwork" className="size-24" />
        <p className="mt-1 font-heading text-xs font-semibold uppercase tracking-[0.2em] text-[var(--em-blue-300)]">
          ไพ่ประจำวัน
        </p>
        <h1 className="text-2xl font-black text-[var(--em-ink-0)]">
          {profile ? `สวัสดี ${profile.nickname}` : "ไพ่ของคุณวันนี้"}
        </h1>
        <p className="text-sm text-[var(--em-ink-300)]">{thaiDate.format(new Date())}</p>
      </header>

      <TarotCard
        drawn={drawn}
        open={open}
        onOpen={() => setOpen(true)}
        label="แตะเพื่อเปิดไพ่ประจำวัน"
        className="mx-auto w-48 sm:w-56"
      />
      {open ? (
        <CardMeaning drawn={drawn} text={interpret(drawn, "general")} />
      ) : (
        <p className="text-center text-sm text-[var(--em-ink-200)]">ตั้งสมาธิ แล้วแตะที่ไพ่</p>
      )}
      <CheckIn />
    </div>
  );
}

type Stage =
  | { name: "setup" }
  | { name: "pick"; pool: Drawn[]; picked: number[] }
  | { name: "result"; cards: Drawn[]; shown: number };

/** Ask a question, pick a topic and spread, choose cards from a face-down fan, read them. */
export function ReadPage() {
  const [topic, setTopic] = useState<Topic>("general");
  const [spread, setSpread] = useState<SpreadId>("three");
  const [question, setQuestion] = useState("");
  const [stage, setStage] = useState<Stage>({ name: "setup" });
  const positions = SPREADS[spread].positions;

  const shuffle = () => setStage({ name: "pick", pool: draw(12), picked: [] });

  const pick = (i: number) => {
    if (stage.name !== "pick" || stage.picked.includes(i)) return;
    const picked = [...stage.picked, i];
    if (picked.length < positions.length) setStage({ ...stage, picked });
    else {
      const cards = picked.flatMap((p) => stage.pool[p] ?? []);
      setStage({ name: "result", cards, shown: 0 });
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 pb-28 pt-6 text-[var(--em-ink-50)]">
      <header className="text-center">
        <p className="font-heading text-xs font-semibold uppercase tracking-[0.2em] text-[var(--em-blue-300)]">
          อ่านไพ่ทาโรต์
        </p>
        <h1 className="text-2xl font-black text-[var(--em-ink-0)]">ตั้งคำถามในใจ แล้วเลือกไพ่</h1>
      </header>

      {stage.name === "setup" && (
        <div className="tt-panel space-y-5 p-4">
          <fieldset>
            <legend className="mb-2 text-sm font-semibold">เรื่องที่อยากรู้</legend>
            <div className="grid grid-cols-4 gap-2">
              {TOPICS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  aria-pressed={topic === t.id}
                  onClick={() => setTopic(t.id)}
                  className="min-h-11 rounded-md border border-[color-mix(in_oklab,var(--em-ink-0)_18%,transparent)] text-sm aria-pressed:border-[var(--em-blue-300)] aria-pressed:bg-[color-mix(in_oklab,var(--em-blue-400)_22%,transparent)]"
                >
                  {t.label}
                </button>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend className="mb-2 text-sm font-semibold">จำนวนไพ่</legend>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(SPREADS) as SpreadId[]).map((id) => (
                <button
                  key={id}
                  type="button"
                  aria-pressed={spread === id}
                  onClick={() => setSpread(id)}
                  className="min-h-11 rounded-md border border-[color-mix(in_oklab,var(--em-ink-0)_18%,transparent)] text-sm aria-pressed:border-[var(--em-blue-300)] aria-pressed:bg-[color-mix(in_oklab,var(--em-blue-400)_22%,transparent)]"
                >
                  {SPREADS[id].label}
                  <span className="block text-xs text-[var(--em-ink-300)]">
                    {SPREADS[id].positions.join(" · ")}
                  </span>
                </button>
              ))}
            </div>
          </fieldset>
          <label className="block space-y-1.5">
            <span className="text-sm font-semibold">คำถาม (ไม่บังคับ)</span>
            <input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              maxLength={120}
              placeholder="เช่น งานใหม่จะไปได้ดีไหม"
              className="min-h-11 w-full rounded-md border border-[color-mix(in_oklab,var(--em-ink-0)_18%,transparent)] bg-[color-mix(in_oklab,var(--em-ink-975)_60%,transparent)] px-3"
            />
          </label>
          <button
            type="button"
            onClick={shuffle}
            className="flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-primary font-bold text-primary-foreground"
          >
            <Shuffle className="size-4" aria-hidden /> สับไพ่
          </button>
        </div>
      )}

      {stage.name === "pick" && (
        <div className="space-y-4">
          <p className="text-center text-sm" role="status">
            เลือกไพ่อีก {positions.length - stage.picked.length} ใบ
            {positions[stage.picked.length] ? ` · ${positions[stage.picked.length] ?? ""}` : ""}
          </p>
          <ul className="grid grid-cols-4 gap-2 sm:grid-cols-6">
            {stage.pool.map((d, i) => (
              <li key={d.card.id}>
                <button
                  type="button"
                  onClick={() => pick(i)}
                  disabled={stage.picked.includes(i)}
                  aria-label={`ไพ่ใบที่ ${String(i + 1)}`}
                  className="block w-full transition-transform hover:-translate-y-1 disabled:-translate-y-3 disabled:opacity-40"
                >
                  <TarotCard drawn={null} open={false} />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {stage.name === "result" && (
        <div className="space-y-6">
          {question.trim() && (
            <p className="tt-panel p-3 text-center text-sm">“{question.trim()}”</p>
          )}
          <div className="flex justify-center gap-3">
            {stage.cards.map((d, i) => (
              <TarotCard
                key={d.card.id}
                drawn={d}
                open={i < stage.shown}
                onOpen={
                  i === stage.shown
                    ? () => setStage({ ...stage, shown: stage.shown + 1 })
                    : undefined
                }
                label={`เปิดไพ่ ${positions[i] ?? ""}`}
                className={stage.cards.length > 1 ? "w-28" : "w-48"}
              />
            ))}
          </div>
          {stage.shown < stage.cards.length && (
            <p className="text-center text-sm text-[var(--em-ink-200)]">
              แตะไพ่ใบที่ {stage.shown + 1} ({positions[stage.shown] ?? ""}) เพื่อเปิด
            </p>
          )}
          {stage.cards.slice(0, stage.shown).map((d, i) => (
            <CardMeaning
              key={d.card.id}
              drawn={d}
              position={stage.cards.length > 1 ? positions[i] : undefined}
              text={interpret(d, topic)}
            />
          ))}
          {stage.shown === stage.cards.length && (
            <button
              type="button"
              onClick={() => setStage({ name: "setup" })}
              className="flex min-h-11 w-full items-center justify-center gap-2 rounded-md border border-[color-mix(in_oklab,var(--em-ink-0)_25%,transparent)] font-bold"
            >
              <RotateCcw className="size-4" aria-hidden /> อ่านใหม่
            </button>
          )}
        </div>
      )}
      <p className="text-center text-xs text-[var(--em-ink-400)]">
        คำทำนายเพื่อความบันเทิงและการทบทวนตัวเอง ไม่ใช่คำแนะนำทางการแพทย์ การเงิน หรือกฎหมาย
      </p>
    </div>
  );
}

/** Profile, coins and sign-out; signed-out readers get a way in. */
export function MePage() {
  const { user, ready } = useSession();
  const { status, loaded } = useTarotData();
  const [saved, setSaved] = useState(false);

  if (!ready) return null;
  if (!user) {
    return (
      <div className="mx-auto flex w-full max-w-md flex-col items-center gap-4 px-4 pb-28 pt-10 text-center text-[var(--em-ink-50)]">
        <MeshMascot kind="owl" label="นกฮูกหมอดูของ crocwork" className="size-28" />
        <h1 className="text-2xl font-black text-[var(--em-ink-0)]">เข้าสู่ระบบ crocwork</h1>
        <p className="text-sm text-[var(--em-ink-200)]">
          บัญชีเดียวใช้ได้ทุกระบบของ crocwork เก็บเหรียญและโปรไฟล์ของคุณไว้
        </p>
        <a
          href={signInUrl(window.location.href)}
          className="inline-flex min-h-11 items-center rounded-md bg-primary px-6 font-bold text-primary-foreground"
        >
          เข้าสู่ระบบ
        </a>
      </div>
    );
  }
  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 pb-28 pt-6 text-[var(--em-ink-50)]">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-[var(--em-ink-0)]">โปรไฟล์ของฉัน</h1>
        <button
          type="button"
          onClick={() => void signOut()}
          className="inline-flex min-h-11 items-center gap-2 rounded-md px-3 text-sm text-[var(--em-ink-200)] hover:bg-[color-mix(in_oklab,var(--em-ink-0)_8%,transparent)]"
        >
          <LogOut className="size-4" aria-hidden /> ออกจากระบบ
        </button>
      </header>
      <dl className="grid grid-cols-2 gap-3">
        <div className="tt-panel p-4">
          <dt className="text-xs text-[var(--em-ink-300)]">เหรียญ</dt>
          <dd className="font-heading text-2xl font-bold tabular-nums text-[var(--em-gold-300)]">
            {status?.coins ?? 0}
          </dd>
        </div>
        <div className="tt-panel p-4">
          <dt className="text-xs text-[var(--em-ink-300)]">เช็กอินติดกัน</dt>
          <dd className="font-heading text-2xl font-bold tabular-nums">
            {status?.streak ?? 0} วัน
          </dd>
        </div>
      </dl>
      {loaded && (
        <div className="tt-panel p-4">
          <ProfileForm onSaved={() => setSaved(true)} />
          {saved && (
            <p role="status" className="mt-3 text-center text-sm text-[var(--em-gold-300)]">
              บันทึกแล้ว
            </p>
          )}
        </div>
      )}
    </div>
  );
}

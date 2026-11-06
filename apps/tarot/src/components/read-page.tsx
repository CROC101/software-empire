import { Coins, RotateCcw, Shuffle } from "lucide-react";
import { useState } from "react";
import { recordReading } from "@/lib/api";
import { useTarotData } from "@/lib/data";
import {
  draw,
  interpret,
  SPREAD_IDS,
  SPREADS,
  TOPICS,
  yesNo,
  type Drawn,
  type SpreadId,
  type Topic,
} from "@/lib/reading";
import { signInUrl, useSession } from "@/lib/session";
import { CardMeaning, TarotCard } from "./tarot-card";

type Stage =
  | { name: "setup" }
  | { name: "pick"; pool: Drawn[]; picked: number[] }
  | { name: "saving"; cards: Drawn[] }
  | { name: "result"; cards: Drawn[]; shown: number };

const choice =
  "rounded-md border border-[color-mix(in_oklab,var(--em-ink-0)_18%,transparent)] aria-pressed:border-[var(--em-blue-300)] aria-pressed:bg-[color-mix(in_oklab,var(--em-blue-400)_22%,transparent)]";

/** Pick a spread and topic, ask, choose cards from a face-down fan, read them one by one. */
export function ReadPage() {
  const { user } = useSession();
  const { status, setStatus } = useTarotData();
  const [spread, setSpread] = useState<SpreadId>("three");
  const [pickedTopic, setTopic] = useState<Topic>("general");
  const [question, setQuestion] = useState("");
  const [stage, setStage] = useState<Stage>({ name: "setup" });
  const [error, setError] = useState("");

  const def = SPREADS[spread];
  const topic: Topic = "topic" in def ? def.topic : pickedTopic;
  const positions = def.positions;
  const short = def.cost > 0 && (status?.coins ?? 0) < def.cost;

  const shuffle = () => {
    setError("");
    setStage({ name: "pick", pool: draw(Math.max(12, positions.length + 6)), picked: [] });
  };

  // free spreads read straight away for guests; signed-in readers keep every reading, and the
  // database charges paid spreads before a single face is shown
  const finish = async (cards: Drawn[]) => {
    if (!user) {
      setStage({ name: "result", cards, shown: 0 });
      return;
    }
    setStage({ name: "saving", cards });
    try {
      const coins = await recordReading(
        spread,
        topic,
        question,
        cards.map((d) => ({ id: d.card.id, reversed: d.reversed })),
      );
      if (status) setStatus({ ...status, coins });
      setStage({ name: "result", cards, shown: 0 });
    } catch (err) {
      console.error(err);
      const msg = err instanceof Error ? err.message : "";
      setError(
        msg.includes("not enough coins")
          ? "เหรียญไม่พอสำหรับกระดานนี้"
          : "เปิดไพ่ไม่สำเร็จ ลองใหม่อีกครั้ง",
      );
      setStage({ name: "setup" });
    }
  };

  const pick = (i: number) => {
    if (stage.name !== "pick" || stage.picked.includes(i)) return;
    const picked = [...stage.picked, i];
    if (picked.length < positions.length) setStage({ ...stage, picked });
    else void finish(picked.flatMap((p) => stage.pool[p] ?? []));
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
            <legend className="mb-2 text-sm font-semibold">กระดานไพ่</legend>
            <div className="grid gap-2">
              {SPREAD_IDS.map((id) => {
                const s = SPREADS[id];
                return (
                  <button
                    key={id}
                    type="button"
                    aria-pressed={spread === id}
                    onClick={() => setSpread(id)}
                    className={`${choice} flex min-h-14 items-center justify-between gap-3 px-3 text-left`}
                  >
                    <span>
                      <span className="block font-semibold">{s.label}</span>
                      <span className="block text-xs text-[var(--em-ink-300)]">{s.blurb}</span>
                    </span>
                    <span className="flex shrink-0 items-center gap-1 text-sm font-bold text-[var(--em-gold-300)]">
                      {s.cost > 0 ? (
                        <>
                          <Coins className="size-4" aria-hidden /> {s.cost}
                        </>
                      ) : (
                        "ฟรี"
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          </fieldset>

          {!("topic" in def) && (
            <fieldset>
              <legend className="mb-2 text-sm font-semibold">เรื่องที่อยากรู้</legend>
              <div className="grid grid-cols-4 gap-2">
                {TOPICS.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    aria-pressed={pickedTopic === t.id}
                    onClick={() => setTopic(t.id)}
                    className={`${choice} min-h-11 text-sm`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </fieldset>
          )}

          <label className="block space-y-1.5">
            <span className="text-sm font-semibold">
              คำถาม{spread === "yesno" ? "" : " (ไม่บังคับ)"}
            </span>
            <input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              maxLength={120}
              placeholder={
                spread === "yesno" ? "เช่น ควรย้ายงานปีนี้ไหม" : "เช่น งานใหม่จะไปได้ดีไหม"
              }
              className="min-h-11 w-full rounded-md border border-[color-mix(in_oklab,var(--em-ink-0)_18%,transparent)] bg-[color-mix(in_oklab,var(--em-ink-975)_60%,transparent)] px-3"
            />
          </label>

          {def.cost > 0 && !user ? (
            <a
              href={signInUrl(window.location.href)}
              className="flex min-h-11 w-full items-center justify-center rounded-md bg-primary font-bold text-primary-foreground"
            >
              เข้าสู่ระบบเพื่อใช้เหรียญ
            </a>
          ) : (
            <button
              type="button"
              onClick={shuffle}
              disabled={short || (spread === "yesno" && !question.trim())}
              className="flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-primary font-bold text-primary-foreground disabled:opacity-50"
            >
              <Shuffle className="size-4" aria-hidden />
              {def.cost > 0 ? `ใช้ ${String(def.cost)} เหรียญ สับไพ่` : "สับไพ่"}
            </button>
          )}
          <p role="alert" className="min-h-5 text-center text-sm text-[var(--em-danger-dark)]">
            {short
              ? `ต้องใช้ ${String(def.cost)} เหรียญ คุณมี ${String(status?.coins ?? 0)} เช็กอินทุกวันเพื่อสะสม`
              : error}
          </p>
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

      {stage.name === "saving" && (
        <p role="status" className="text-center text-sm">
          นกฮูกกำลังวางไพ่…
        </p>
      )}

      {stage.name === "result" && (
        <Result
          cards={stage.cards}
          shown={stage.shown}
          spread={spread}
          topic={topic}
          question={question}
          onShow={(n) => setStage({ ...stage, shown: n })}
          onAgain={() => setStage({ name: "setup" })}
        />
      )}

      <p className="text-center text-xs text-[var(--em-ink-400)]">
        คำทำนายเพื่อความบันเทิงและการทบทวนตัวเอง ไม่ใช่คำแนะนำทางการแพทย์ การเงิน หรือกฎหมาย
      </p>
    </div>
  );
}

/** The laid-out spread: tap to turn each card in order, or turn them all at once. */
export function Result({
  cards,
  shown,
  spread,
  topic,
  question,
  onShow,
  onAgain,
}: {
  cards: Drawn[];
  shown: number;
  spread: SpreadId;
  topic: Topic;
  question: string;
  onShow: (n: number) => void;
  onAgain?: () => void;
}) {
  const positions = SPREADS[spread].positions;
  const many = cards.length > 3;
  const first = cards[0];
  return (
    <div className="space-y-6">
      {question.trim() && <p className="tt-panel p-3 text-center text-sm">“{question.trim()}”</p>}
      <div className={many ? "grid grid-cols-5 gap-2" : "flex justify-center gap-3"}>
        {cards.map((d, i) => (
          <TarotCard
            key={d.card.id}
            drawn={d}
            open={i < shown}
            onOpen={i === shown ? () => onShow(shown + 1) : undefined}
            label={`เปิดไพ่ ${positions[i] ?? ""}`}
            className={many ? "w-full" : cards.length > 1 ? "w-28" : "w-48"}
          />
        ))}
      </div>
      {shown < cards.length && (
        <div className="space-y-2 text-center">
          <p className="text-sm text-[var(--em-ink-200)]">
            แตะไพ่ใบที่ {shown + 1} ({positions[shown] ?? ""}) เพื่อเปิด
          </p>
          {many && (
            <button
              type="button"
              onClick={() => onShow(cards.length)}
              className="min-h-11 rounded-md px-4 text-sm text-[var(--em-blue-300)] underline"
            >
              เปิดทั้งหมด
            </button>
          )}
        </div>
      )}
      {spread === "yesno" && first && shown > 0 && (
        <div className="tt-panel p-4 text-center">
          <p className="text-3xl font-black text-[var(--em-gold-300)]">{yesNo(first).answer}</p>
          <p className="mt-1 text-sm text-[var(--em-ink-200)]">{yesNo(first).note}</p>
        </div>
      )}
      {cards.slice(0, shown).map((d, i) => (
        <CardMeaning
          key={d.card.id}
          drawn={d}
          position={cards.length > 1 ? positions[i] : undefined}
          text={interpret(d, topic)}
        />
      ))}
      {onAgain && shown === cards.length && (
        <button
          type="button"
          onClick={onAgain}
          className="flex min-h-11 w-full items-center justify-center gap-2 rounded-md border border-[color-mix(in_oklab,var(--em-ink-0)_25%,transparent)] font-bold"
        >
          <RotateCcw className="size-4" aria-hidden /> อ่านใหม่
        </button>
      )}
    </div>
  );
}

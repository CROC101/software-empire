import { MeshMascot, cn } from "@empire/ui";
import { ChevronDown, CircleHelp, MessageCircle, Plus, Send, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { CHAT_COST_AFTER, CHAT_FREE_PER_DAY, CHIPS, LENGTHS, type Mode } from "@/lib/ask";
import {
  AskError,
  DEFAULT_SETTINGS,
  getChats,
  getChatSettings,
  getMessages,
  sendAsk,
  type Chat,
  type ChatSettings,
  type Message,
} from "@/lib/ask-client";
import { useTarotData } from "@/lib/data";
import { cardAt, cardImage, DECK, elementOf, ELEMENT_TH } from "@/lib/deck";
import { signInUrl, useSession } from "@/lib/session";

const MODES = {
  reading: { label: "ดูดวง", icon: Sparkles },
  chat: { label: "คุยทั่วไป", icon: MessageCircle },
} as const;

const ERRORS: Record<string, string> = {
  coins: "เหรียญไม่พอสำหรับข้อความนี้ เช็กอินทุกวันที่หน้าแรกเพื่อสะสมเหรียญ",
  rooms: "มีห้องแชตครบ 3 ห้องแล้ว ลบห้องเก่าก่อนเริ่มห้องใหม่",
  ai_down: "นกฮูกตอบไม่ได้ชั่วคราว ลองใหม่อีกครั้ง ยังไม่หักเหรียญ",
  no_ai: "ระบบถามนกฮูกยังไม่เปิดใช้งาน",
  not_configured: "ระบบถามนกฮูกยังไม่เปิดใช้งาน",
  sign_in: "เข้าสู่ระบบก่อนนะ",
};

const findCard = (id: string) => DECK.find((c) => c.id === id) ?? cardAt(0);

/** A card from an answer, opened large: upright and reversed meanings side by side. */
function CardDetail({
  id,
  reversed,
  onClose,
}: {
  id: string;
  reversed: boolean;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [side, setSide] = useState(reversed);
  const card = findCard(id);
  useEffect(() => {
    ref.current?.showModal();
  }, []);
  return (
    <dialog
      ref={ref}
      onClose={onClose}
      aria-label={card.th}
      className="m-auto w-[min(24rem,calc(100%-2rem))] rounded-xl border border-[color-mix(in_oklab,var(--em-ink-0)_14%,transparent)] bg-[var(--em-ink-950)] p-5 text-center text-[var(--em-ink-50)] backdrop:bg-black/70"
    >
      <h2 className="text-xl font-black text-[var(--em-gold-300)]">{card.th}</h2>
      <img
        src={cardImage(card)}
        alt={card.th}
        width={420}
        height={731}
        className={cn("mx-auto my-3 w-40 rounded-md", reversed && "rotate-180")}
      />
      <p className="mb-2 flex justify-center gap-2 text-xs font-semibold">
        <span className="rounded-full bg-[color-mix(in_oklab,var(--em-coral-500)_25%,transparent)] px-3 py-1">
          {reversed ? "ได้ไพ่กลับหัว" : "ได้ไพ่ตั้งตรง"}
        </span>
        <span className="rounded-full bg-[color-mix(in_oklab,var(--em-success)_25%,transparent)] px-3 py-1">
          {ELEMENT_TH[elementOf(card)]}
        </span>
      </p>
      <p className="text-xs text-[var(--em-ink-400)]">
        {side ? "ความหมายไพ่กลับหัว" : "ความหมายไพ่ตั้งตรง"}
      </p>
      <p
        className={cn(
          "my-2 font-semibold",
          side ? "text-[var(--em-coral-400)]" : "text-[var(--em-success-dark)]",
        )}
      >
        {card.keywords.join(" · ")}
      </p>
      <p className="text-sm leading-relaxed">{side ? card.rev : card.up}</p>
      <div className="mt-4 grid grid-cols-2 gap-2 rounded-lg bg-[color-mix(in_oklab,var(--em-ink-0)_6%,transparent)] p-1">
        {[false, true].map((r) => (
          <button
            key={String(r)}
            type="button"
            aria-pressed={side === r}
            onClick={() => setSide(r)}
            className="min-h-10 rounded-md text-sm font-bold aria-pressed:bg-primary aria-pressed:text-primary-foreground"
          >
            {r ? "ไพ่กลับหัว" : "ไพ่ตรง"}
          </button>
        ))}
      </div>
      <form method="dialog" className="mt-3">
        <button className="min-h-11 w-full rounded-md border border-[color-mix(in_oklab,var(--em-ink-0)_25%,transparent)]">
          ปิด
        </button>
      </form>
    </dialog>
  );
}

/** Ask the owl: a chat reader that opens cards for a reading or just talks. */
export function AskPage() {
  const { user, ready } = useSession();
  const { status, setStatus } = useTarotData();
  const [chats, setChats] = useState<Chat[]>([]);
  const [chatId, setChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [settings, setSettings] = useState<ChatSettings>(DEFAULT_SETTINGS);
  const [mode, setMode] = useState<Mode>("reading");
  const [modeOpen, setModeOpen] = useState(false);
  const [help, setHelp] = useState(false);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [card, setCard] = useState<{ id: string; reversed: boolean } | null>(null);
  const end = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    void Promise.all([getChats(), getChatSettings()])
      .then(([list, s]) => {
        setChats(list);
        setSettings(s);
        if (list[0]) setChatId(list[0].id);
      })
      .catch((err: unknown) => {
        console.error(err);
      });
  }, [user]);

  useEffect(() => {
    if (!chatId) return;
    let active = true;
    getMessages(chatId)
      .then((m) => {
        if (active) setMessages(m);
      })
      .catch((err: unknown) => {
        console.error(err);
      });
    return () => {
      active = false;
    };
  }, [chatId]);

  useEffect(() => {
    end.current?.scrollIntoView({ block: "end" });
  }, [messages, busy]);

  if (!ready) return null;
  if (!user) {
    return (
      <div className="mx-auto flex w-full max-w-md flex-col items-center gap-4 px-4 pb-28 pt-10 text-center text-[var(--em-ink-50)]">
        <MeshMascot kind="owl" label="นกฮูกหมอดูของ crocwork" className="size-28" />
        <h1 className="text-2xl font-black text-[var(--em-ink-0)]">ถามนกฮูก</h1>
        <p className="text-sm text-[var(--em-ink-200)]">
          คุยกับนกฮูกหมอดู ถามเรื่องรัก งาน เรียน ได้ทุกวัน
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

  const price = mode === "reading" ? LENGTHS[settings.length].cost : 0;
  const current = chats.find((c) => c.id === chatId);

  const send = async (question: string) => {
    const q = question.trim();
    if (!q || busy) return;
    setBusy(true);
    setError("");
    // show the question straight away; the server copy replaces it after the answer
    const pending: Message = {
      id: -1, // a placeholder until the server copy arrives
      role: "user",
      mode,
      body: q,
      cards: null,
      cost: 0,
      created_at: "",
    };
    setMessages((m) => [...m, pending]);
    setText("");
    try {
      const a = await sendAsk(chatId, mode, q);
      if (status) setStatus({ ...status, coins: a.balance });
      if (a.chatId !== chatId) {
        setChatId(a.chatId);
        setChats(await getChats());
      } else setMessages(await getMessages(a.chatId));
    } catch (err) {
      console.error(err);
      setMessages((m) => m.filter((x) => x.id !== pending.id));
      setText(q);
      setError(ERRORS[err instanceof AskError ? err.code : ""] ?? "ส่งไม่สำเร็จ ลองใหม่อีกครั้ง");
    } finally {
      setBusy(false);
    }
  };

  const submit = (e: { preventDefault: () => void }) => {
    e.preventDefault();
    void send(text);
  };
  const ModeIcon = MODES[mode].icon;

  return (
    <div className="mx-auto flex min-h-[calc(100dvh-4rem)] w-full max-w-md flex-col px-4 pb-28 text-[var(--em-ink-50)]">
      <header className="flex items-center justify-between gap-3 py-2">
        <div className="min-w-0">
          <h1 className="truncate font-bold text-[var(--em-ink-0)]">
            {current?.title ?? "บทสนทนาใหม่"}
          </h1>
          <p className="flex items-center gap-1.5 text-xs text-[var(--em-success-dark)]">
            <span aria-hidden className="size-1.5 rounded-full bg-[var(--em-success-dark)]" />{" "}
            นกฮูกออนไลน์
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setChatId(null);
            setMessages([]);
            setError("");
          }}
          className="flex min-h-10 items-center gap-1.5 rounded-md border border-[color-mix(in_oklab,var(--em-ink-0)_20%,transparent)] px-3 text-sm"
        >
          <Plus className="size-4" aria-hidden /> แชตใหม่
        </button>
      </header>
      <p className="mb-3 text-center text-xs text-[var(--em-ink-400)]">
        ดูดวง {LENGTHS[settings.length].cost} เหรียญ/ข้อความ · คุยทั่วไปฟรีวันละ {CHAT_FREE_PER_DAY}{" "}
        ครั้ง แล้ว {CHAT_COST_AFTER} เหรียญ
      </p>

      <div className="flex-1 space-y-3" aria-live="polite">
        {messages.length === 0 && !busy && (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <MeshMascot kind="owl" className="size-24" />
            <p className="font-bold text-[var(--em-ink-0)]">อยากรู้เรื่องอะไร ถามนกฮูกได้เลย</p>
            <p className="text-sm text-[var(--em-ink-300)]">
              หนึ่งข้อความ ถามหนึ่งเรื่อง จะได้คำตอบที่ชัดที่สุด
            </p>
          </div>
        )}
        {messages.map((m) =>
          m.role === "user" ? (
            <div key={m.id} className="flex flex-col items-end gap-1">
              <span className="flex items-center gap-1 rounded-full border border-[color-mix(in_oklab,var(--em-blue-300)_40%,transparent)] px-2 py-0.5 text-[11px] text-[var(--em-blue-200)]">
                {m.mode === "reading" ? (
                  <Sparkles className="size-3" aria-hidden />
                ) : (
                  <MessageCircle className="size-3" aria-hidden />
                )}
                {MODES[m.mode].label}
              </span>
              <p className="max-w-[85%] whitespace-pre-line rounded-2xl rounded-br-sm bg-[var(--em-blue-600)] px-4 py-2.5 text-[var(--em-ink-0)]">
                {m.body}
              </p>
            </div>
          ) : (
            <div key={m.id} className="flex items-end gap-2">
              <MeshMascot kind="owl" className="size-8 shrink-0" />
              <div className="max-w-[85%] space-y-2">
                <p className="tt-panel whitespace-pre-line rounded-2xl rounded-bl-sm px-4 py-3 text-sm leading-relaxed">
                  {m.body}
                </p>
                {m.cards && m.cards.length > 0 && (
                  <div className="tt-panel inline-block p-2">
                    <p className="mb-1 text-xs text-[var(--em-ink-300)]">
                      ไพ่ที่นกฮูกเปิดได้ ({m.cards.length} ใบ)
                    </p>
                    <div className="flex gap-2">
                      {m.cards.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => setCard(c)}
                          aria-label={`${findCard(c.id).th}${c.reversed ? " กลับหัว" : ""} ดูความหมาย`}
                          className="text-center"
                        >
                          <img
                            src={cardImage(findCard(c.id))}
                            alt=""
                            width={42}
                            height={73}
                            loading="lazy"
                            className={cn("h-16 w-auto rounded-sm", c.reversed && "rotate-180")}
                          />
                          <span className="block text-[10px] text-[var(--em-ink-300)]">
                            {findCard(c.id).th}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ),
        )}
        {busy && (
          <div className="flex items-end gap-2" role="status">
            <MeshMascot kind="owl" className="size-8 shrink-0" />
            <p className="tt-panel rounded-2xl px-4 py-3 text-sm text-[var(--em-ink-300)]">
              {mode === "reading" ? "นกฮูกกำลังเปิดไพ่…" : "นกฮูกกำลังพิมพ์…"}
            </p>
          </div>
        )}
        <div ref={end} />
      </div>

      <div className="sticky bottom-16 mt-3 space-y-2 bg-gradient-to-t from-[var(--em-ink-975)] from-60% pt-3">
        {error && (
          <p
            role="alert"
            className="rounded-md bg-[color-mix(in_oklab,var(--em-danger)_18%,transparent)] p-2 text-center text-sm"
          >
            {error}{" "}
            {error === ERRORS.coins && (
              <Link to="/" className="underline">
                ไปเช็กอิน
              </Link>
            )}
          </p>
        )}
        <div className="tt-no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => setModeOpen((o) => !o)}
              aria-expanded={modeOpen}
              aria-label={`โหมด ${MODES[mode].label}`}
              className="flex min-h-9 items-center gap-1.5 rounded-full bg-primary px-3 text-sm font-bold text-primary-foreground"
            >
              <ModeIcon className="size-4" aria-hidden /> {MODES[mode].label}
              <ChevronDown className="size-4" aria-hidden />
            </button>
          </div>
          {CHIPS.map((c) => (
            <button
              key={c.label}
              type="button"
              onClick={() => (c.prompt ? void send(c.prompt) : setText(""))}
              disabled={busy}
              className="min-h-9 shrink-0 rounded-full border border-[color-mix(in_oklab,var(--em-ink-0)_20%,transparent)] px-3 text-sm disabled:opacity-50"
            >
              {c.label}
            </button>
          ))}
        </div>
        {modeOpen && (
          <div role="menu" className="tt-panel w-56 p-1">
            {(Object.keys(MODES) as Mode[]).map((id) => {
              const Icon = MODES[id].icon;
              return (
                <button
                  key={id}
                  type="button"
                  role="menuitemradio"
                  aria-checked={mode === id}
                  onClick={() => {
                    setMode(id);
                    setModeOpen(false);
                  }}
                  className="flex min-h-11 w-full items-center gap-2 rounded-md px-3 text-sm aria-checked:bg-[color-mix(in_oklab,var(--em-blue-400)_22%,transparent)]"
                >
                  <Icon className="size-4" aria-hidden /> {MODES[id].label}
                  <span className="ml-auto text-xs text-[var(--em-gold-300)]">
                    {id === "reading"
                      ? `${String(LENGTHS[settings.length].cost)} เหรียญ`
                      : `ฟรีวันละ ${String(CHAT_FREE_PER_DAY)}`}
                  </span>
                </button>
              );
            })}
          </div>
        )}
        {help && (
          <div className="tt-panel space-y-2 p-3 text-sm">
            <p className="font-bold text-[var(--em-ink-0)]">โหมดดูดวง</p>
            <p className="text-[var(--em-ink-200)]">
              นกฮูกเปิดไพ่ให้ทุกข้อความแล้วตีความตามคำถาม {price} เหรียญต่อข้อความ
            </p>
            <p className="font-bold text-[var(--em-ink-0)]">โหมดคุยทั่วไป</p>
            <p className="text-[var(--em-ink-200)]">
              คุย ปรึกษา ระบายได้ ไม่เปิดไพ่ ฟรีวันละ {CHAT_FREE_PER_DAY} ข้อความ หลังจากนั้น{" "}
              {CHAT_COST_AFTER} เหรียญ
            </p>
          </div>
        )}
        <form onSubmit={submit} className="tt-panel flex items-center gap-2 p-1.5 pl-3">
          <label htmlFor="ask-input" className="sr-only">
            พิมพ์คำถาม
          </label>
          <input
            id="ask-input"
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={500}
            placeholder="พิมพ์คำถามของคุณ…"
            className="min-h-10 min-w-0 flex-1 bg-transparent outline-none placeholder:text-[var(--em-ink-400)]"
          />
          <button
            type="button"
            onClick={() => setHelp((h) => !h)}
            aria-expanded={help}
            aria-label="อธิบายโหมด"
            className="grid size-10 place-items-center rounded-full hover:bg-[color-mix(in_oklab,var(--em-ink-0)_10%,transparent)]"
          >
            <CircleHelp className="size-5" aria-hidden />
          </button>
          <button
            type="submit"
            disabled={busy || !text.trim()}
            aria-label={mode === "reading" ? `ส่ง (${String(price)} เหรียญ)` : "ส่ง"}
            className="grid size-10 place-items-center rounded-full bg-primary text-primary-foreground disabled:opacity-40"
          >
            <Send className="size-4" aria-hidden />
          </button>
        </form>
      </div>
      {card && <CardDetail id={card.id} reversed={card.reversed} onClose={() => setCard(null)} />}
    </div>
  );
}

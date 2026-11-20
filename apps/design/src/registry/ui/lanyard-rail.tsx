"use client";

import { cn, useReducedMotionAfterMount } from "@empire/ui";
import { motion, useAnimate } from "motion/react";
import { useEffect, useRef, useState } from "react";

type Person = {
  name: string;
  initials: string;
  role: string;
  team: string;
  bio: string;
  tags: string[];
};

const people: Person[] = [
  {
    name: "ปาริชาต ทองดี",
    initials: "ปท",
    role: "นักออกแบบ",
    team: "Design",
    bio: "ดูแลระบบดีไซน์ สี ตัวอักษร และท่าทางของทุกหน้า",
    tags: ["Figma", "Motion"],
  },
  {
    name: "ธนากร ศรีสุข",
    initials: "ธศ",
    role: "วิศวกรหน้าบ้าน",
    team: "Web",
    bio: "ทำหน้าเว็บให้เร็วและกดได้ด้วยคีย์บอร์ดทุกปุ่ม",
    tags: ["React", "a11y"],
  },
  {
    name: "กมลวรรณ แสงทอง",
    initials: "กส",
    role: "วิศวกรหลังบ้าน",
    team: "Data",
    bio: "ดูแลฐานข้อมูล สิทธิ์การเข้าถึง และงานที่รันเบื้องหลัง",
    tags: ["Postgres", "RLS"],
  },
  {
    name: "ณัฐวุฒิ ใจงาม",
    initials: "ณจ",
    role: "ผู้จัดการโปรดักต์",
    team: "Product",
    bio: "ฟังผู้ใช้ จัดลำดับงาน และเขียนว่าเสร็จแล้วหน้าตาเป็นอย่างไร",
    tags: ["Roadmap", "Research"],
  },
];

/** Bar widths from the name, so each badge has its own barcode */
function bars(seed: string) {
  let h = 2166136261;
  let x = 0;
  return Array.from({ length: 28 }, (_, i) => {
    h = Math.imul(h ^ (seed.charCodeAt(i % seed.length) + i), 16777619);
    const w = 1 + ((h >>> 0) % 3);
    const at = x;
    x += w + 0.6;
    return { x: at, w };
  });
}

function Barcode({ seed }: { seed: string }) {
  return (
    <svg viewBox="0 0 100 16" aria-hidden className="h-4 w-full fill-(--em-ink-900)">
      {bars(seed).map(({ x, w }, i) =>
        i % 2 ? null : <rect key={i} x={x} y="0" width={w} height="16" />,
      )}
    </svg>
  );
}

function Badge({
  p,
  index,
  sway,
  flipped,
  active,
  onFlip,
  onActive,
  onKey,
}: {
  p: Person;
  index: number;
  sway: number;
  flipped: boolean;
  active: boolean;
  onFlip: () => void;
  onActive: () => void;
  onKey: (e: React.KeyboardEvent<HTMLButtonElement>) => void;
}) {
  const still = useReducedMotionAfterMount();
  const [scope, animate] = useAnimate<HTMLLIElement>();
  const swing = () => {
    if (!still) void animate(scope.current, { rotate: [0, 5, -3.5, 2, -1, 0] }, { duration: 1.6 });
  };
  // a breeze passes: the badge whose turn it is sways
  useEffect(() => {
    if (sway > 0 && !still)
      void animate(scope.current, { rotate: [0, 3, -2, 1, 0] }, { duration: 1.8 });
  }, [sway, still, animate, scope]);

  return (
    <li
      ref={scope}
      onPointerEnter={() => {
        onActive();
        swing();
      }}
      className={cn("relative shrink-0 snap-center origin-top", active ? "z-10" : "z-0")}
    >
      {/* strap down from the rail, the reel, the clip */}
      <span aria-hidden className="mx-auto block h-16 w-3 bg-(--em-blue-600)" />
      <span
        aria-hidden
        className="mx-auto -mt-1 block size-5 rounded-full border-2 border-(--em-ink-400) bg-(--em-ink-200)"
      />
      <span aria-hidden className="mx-auto block h-3 w-6 rounded-sm bg-(--em-ink-400)" />
      <motion.div
        animate={{ y: active ? -6 : 0, scale: active ? 1.04 : 1 }}
        transition={still ? { duration: 0 } : { type: "spring", stiffness: 300, damping: 22 }}
        className="[perspective:900px]"
      >
        <button
          type="button"
          data-badge={index}
          aria-pressed={flipped}
          aria-label={`${p.name} ${p.role} ทีม ${p.team} ${flipped ? "(ด้านหลัง)" : "(กดเพื่อพลิก)"}`}
          onClick={onFlip}
          onFocus={onActive}
          onKeyDown={onKey}
          className="block rounded-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-(--em-sky-400)"
        >
          <motion.span
            animate={{ rotateY: flipped ? 180 : 0 }}
            transition={still ? { duration: 0 } : { type: "spring", stiffness: 180, damping: 20 }}
            className="relative block h-64 w-44 [transform-style:preserve-3d]"
          >
            {/* front */}
            <span className="absolute inset-0 flex flex-col overflow-clip rounded-xl bg-(--em-ink-0) text-(--em-ink-950) shadow-lg [backface-visibility:hidden]">
              <span className="relative h-12 bg-(--em-blue-600)">
                <span className="absolute top-2 left-1/2 h-1.5 w-8 -translate-x-1/2 rounded-full bg-(--em-ink-975)/40" />
              </span>
              <span className="mx-auto -mt-7 grid size-16 place-items-center rounded-full border-4 border-(--em-ink-0) bg-(--em-ink-100) font-heading text-lg font-black text-(--em-blue-700)">
                {p.initials}
              </span>
              <span className="mt-2 px-3 text-center text-sm leading-snug font-bold">{p.name}</span>
              <span className="px-3 text-center text-xs text-(--em-ink-500)">{p.role}</span>
              <span className="mx-auto mt-2 rounded-full bg-(--em-blue-50) px-2 py-0.5 font-mono text-[0.625rem] tracking-[0.15em] text-(--em-blue-700) uppercase">
                {p.team}
              </span>
              <span className="mt-auto px-4 pb-3">
                <Barcode seed={p.name} />
              </span>
            </span>
            {/* back */}
            <span className="absolute inset-0 flex [transform:rotateY(180deg)] flex-col gap-2 overflow-clip rounded-xl bg-(--em-ink-900) p-4 text-start text-(--em-ink-50) shadow-lg [backface-visibility:hidden]">
              <span className="font-mono text-[0.625rem] tracking-[0.15em] text-(--em-sky-400) uppercase">
                {p.team}
              </span>
              <span className="text-sm font-bold">{p.name}</span>
              <span className="text-xs leading-relaxed text-(--em-ink-300)">{p.bio}</span>
              <span className="mt-auto flex flex-wrap gap-1">
                {p.tags.map((t) => (
                  <span
                    key={t}
                    className="rounded-full bg-(--em-ink-50)/10 px-2 py-0.5 text-[0.625rem] text-(--em-ink-200)"
                  >
                    {t}
                  </span>
                ))}
              </span>
            </span>
          </motion.span>
        </button>
      </motion.div>
    </li>
  );
}

/**
 * Lanyard rail: team badges hang from one rail on straps. Pointing at a badge sways it and lifts
 * it to the front; click or Enter flips it to a short bio. A breeze sways the next badge every
 * few seconds until someone points at the rail. Arrows, Home and End move along the rail, Escape
 * turns the badge back. On a narrow screen the rail scrolls sideways and snaps per badge.
 */
export default function LanyardRail({ seconds = 4 }: { seconds?: number }) {
  const still = useReducedMotionAfterMount();
  const [active, setActive] = useState(0);
  const [flipped, setFlipped] = useState<number | null>(null);
  const [breeze, setBreeze] = useState({ at: -1, n: 0 });
  const [busy, setBusy] = useState(false);
  const list = useRef<HTMLUListElement>(null);

  useEffect(() => {
    if (still || busy) return;
    const t = setInterval(() => {
      setBreeze((b) => ({ at: (b.at + 1) % people.length, n: b.n + 1 }));
    }, seconds * 1000);
    return () => {
      clearInterval(t);
    };
  }, [still, busy, seconds]);

  const focus = (k: number) => {
    list.current?.querySelector<HTMLButtonElement>(`[data-badge="${String(k)}"]`)?.focus();
  };
  const onKey = (k: number) => (e: React.KeyboardEvent<HTMLButtonElement>) => {
    const last = people.length - 1;
    const to =
      e.key === "ArrowRight"
        ? Math.min(last, k + 1)
        : e.key === "ArrowLeft"
          ? Math.max(0, k - 1)
          : e.key === "Home"
            ? 0
            : e.key === "End"
              ? last
              : null;
    if (to !== null) {
      e.preventDefault();
      focus(to);
    } else if (e.key === "Escape") setFlipped(null);
  };
  const who = people[active];

  return (
    <section
      aria-label="ทีมงาน"
      onPointerEnter={() => {
        setBusy(true);
      }}
      onPointerLeave={() => {
        setBusy(false);
      }}
      onFocus={() => {
        setBusy(true);
      }}
      onBlur={() => {
        setBusy(false);
      }}
      className="@container relative isolate flex size-full min-h-[36rem] flex-col justify-center overflow-clip bg-(--em-ink-975) py-10 text-(--em-ink-50)"
    >
      <p className="px-6 text-center font-mono text-xs tracking-[0.2em] text-(--em-sky-400) uppercase">
        Team
      </p>
      <h2 className="mt-3 px-6 text-center font-heading text-3xl font-black @2xl:text-4xl">
        คนที่ทำงานนี้
      </h2>

      <div className="relative mt-8">
        {/* the rail */}
        <span
          aria-hidden
          className="absolute inset-x-0 top-0 z-20 h-2 border-y border-(--em-ink-500) bg-(--em-ink-700)"
        />
        <ul
          ref={list}
          className="flex snap-x snap-mandatory gap-6 overflow-x-auto px-[calc(50%-5.5rem)] pb-6 [scrollbar-width:none] @3xl:justify-center @3xl:overflow-visible @3xl:px-6"
        >
          {people.map((p, k) => (
            <Badge
              key={p.name}
              p={p}
              index={k}
              sway={breeze.at === k ? breeze.n : 0}
              active={active === k}
              flipped={flipped === k}
              onActive={() => {
                setActive(k);
              }}
              onFlip={() => {
                setFlipped((f) => (f === k ? null : k));
              }}
              onKey={onKey(k)}
            />
          ))}
        </ul>
      </div>

      <p aria-live="polite" className="mt-2 px-6 text-center text-sm text-(--em-ink-300)">
        {who ? `${who.name} · ${who.role}` : ""}
      </p>
    </section>
  );
}

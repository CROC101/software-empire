"use client";

import { motion, useMotionValue, useSpring, useTransform } from "motion/react";

/** A profile card that leans toward the pointer, with a rim of light on the near edge and a contact bar at the foot. */
export default function MemberProfile({
  name = "ธนา ใจดี",
  role = "นักพัฒนาเว็บ",
}: {
  name?: string;
  role?: string;
}) {
  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);
  const spring = { stiffness: 260, damping: 26 };
  const rotateX = useSpring(useTransform(py, [0, 1], [8, -8]), spring);
  const rotateY = useSpring(useTransform(px, [0, 1], [-8, 8]), spring);
  const rimX = useSpring(useTransform(px, [0, 1], ["0%", "60%"]), spring);
  const initials = name.trim().slice(0, 1) || "?";
  return (
    <div
      className="grid size-full min-h-96 place-items-center bg-(--em-ink-975) p-6"
      style={{ perspective: 900 }}
    >
      <motion.article
        onPointerMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          px.set((e.clientX - r.left) / r.width);
          py.set((e.clientY - r.top) / r.height);
        }}
        onPointerLeave={() => {
          px.set(0.5);
          py.set(0.5);
        }}
        style={{ rotateX, rotateY }}
        className="relative flex h-80 w-60 flex-col overflow-hidden rounded-xl border border-(--em-ink-700) bg-(--em-ink-900)"
      >
        <motion.span
          aria-hidden
          style={{ x: rimX }}
          className="absolute inset-x-0 top-0 h-px w-2/5 bg-(--em-sky-400)"
        />
        <div className="grid flex-1 place-items-center">
          <span className="grid size-24 place-items-center rounded-full bg-(--em-blue-700) text-4xl font-black text-(--em-ink-0)">
            {initials}
          </span>
        </div>
        <div className="px-5 pb-3 text-center">
          <h3 className="text-xl font-black text-(--em-ink-0)">{name}</h3>
          <p className="text-sm text-(--em-ink-300)">{role}</p>
        </div>
        <div className="m-3 flex items-center justify-between rounded-lg bg-(--em-ink-850) p-2 pl-3">
          <span className="flex items-center gap-2 text-xs text-(--em-ink-300)">
            <span aria-hidden className="size-2 rounded-full bg-(--em-sky-400)" />
            รับงานอยู่
          </span>
          <button
            type="button"
            className="rounded-md bg-(--em-ink-0) px-3 py-1.5 text-xs font-semibold text-(--em-ink-900) focus-visible:outline-2 focus-visible:outline-(--em-sky-400)"
          >
            ติดต่อ
          </button>
        </div>
      </motion.article>
    </div>
  );
}

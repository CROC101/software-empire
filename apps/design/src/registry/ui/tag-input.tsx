"use client";

import { X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";

/** Type and press Enter (or comma) to add a chip; Backspace on an empty field removes the last one. */
export default function TagInput() {
  const [tags, setTags] = useState(["react", "tailwind"]);
  const [draft, setDraft] = useState("");
  const add = () => {
    const t = draft.trim().slice(0, 24);
    if (t && !tags.includes(t) && tags.length < 12) setTags([...tags, t]);
    setDraft("");
  };
  return (
    <div className="grid size-full min-h-56 place-items-center bg-(--em-ink-975) p-6">
      <div className="flex w-full max-w-sm flex-wrap items-center gap-2 rounded-lg border border-(--em-ink-700) bg-(--em-ink-900) p-2 focus-within:border-(--em-sky-400)">
        <AnimatePresence initial={false}>
          {tags.map((t) => (
            <motion.span
              key={t}
              layout
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.6, opacity: 0 }}
              className="flex items-center gap-1 rounded-full bg-(--em-blue-600)/25 py-1 pr-1 pl-3 text-sm text-(--em-sky-400)"
            >
              {t}
              <button
                type="button"
                aria-label={`ลบ ${t}`}
                onClick={() => {
                  setTags(tags.filter((x) => x !== t));
                }}
                className="grid size-5 place-items-center rounded-full hover:bg-(--em-blue-600)/40"
              >
                <X aria-hidden className="size-3" />
              </button>
            </motion.span>
          ))}
        </AnimatePresence>
        <input
          value={draft}
          aria-label="เพิ่มแท็ก"
          placeholder="เพิ่มแท็ก แล้วกด Enter"
          onChange={(e) => {
            setDraft(e.target.value.replace(",", ""));
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              add();
            }
            if (e.key === "Backspace" && !draft) setTags(tags.slice(0, -1));
          }}
          className="min-w-32 flex-1 bg-transparent px-1 py-1 text-sm text-(--em-ink-50) outline-none placeholder:text-(--em-ink-500)"
        />
      </div>
    </div>
  );
}

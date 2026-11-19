"use client";

import { FileText, UploadCloud } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useId, useState, type DragEvent } from "react";

type Picked = { name: string; size: number };

const size = (b: number) =>
  b < 1024 * 1024 ? `${(b / 1024).toFixed(1)} KB` : `${(b / 1024 / 1024).toFixed(1)} MB`;

/**
 * Drop files on the frame (or press it to browse). The frame breathes while something hovers over it.
 * shortcut: lists names only, nothing is read or uploaded; wire a real upload when a page needs one.
 */
export default function DropZone() {
  const [over, setOver] = useState(false);
  const [files, setFiles] = useState<Picked[]>([]);
  const id = useId();
  const take = (list: FileList | null) => {
    if (!list) return;
    setFiles((f) =>
      [...Array.from(list, (x) => ({ name: x.name, size: x.size })), ...f].slice(0, 5),
    );
  };
  const drop = (e: DragEvent) => {
    e.preventDefault();
    setOver(false);
    take(e.dataTransfer.files);
  };
  return (
    <div className="grid size-full min-h-80 place-items-center bg-(--em-ink-975) p-6">
      <div className="w-full max-w-sm">
        <motion.label
          htmlFor={id}
          onDragOver={(e) => {
            e.preventDefault();
            setOver(true);
          }}
          onDragLeave={() => {
            setOver(false);
          }}
          onDrop={drop}
          animate={{ scale: over ? 1.03 : 1 }}
          className={`flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors has-focus-visible:outline-2 has-focus-visible:outline-(--em-sky-400) ${over ? "border-(--em-sky-400) bg-(--em-blue-600)/15" : "border-(--em-ink-700) bg-(--em-ink-900)"}`}
        >
          <motion.span animate={{ y: over ? -6 : 0 }}>
            <UploadCloud aria-hidden className="size-10 text-(--em-sky-400)" />
          </motion.span>
          <span className="font-semibold text-(--em-ink-50)">ลากไฟล์มาวางที่นี่</span>
          <span className="text-xs text-(--em-ink-400)">หรือกดเพื่อเลือกไฟล์</span>
          <input
            id={id}
            type="file"
            multiple
            className="sr-only"
            onChange={(e) => {
              take(e.target.files);
            }}
          />
        </motion.label>
        <ul className="mt-3 space-y-2" aria-live="polite">
          <AnimatePresence initial={false}>
            {files.map((f, i) => (
              <motion.li
                key={`${f.name}-${String(i)}`}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3 rounded-lg bg-(--em-ink-900) px-3 py-2 text-sm"
              >
                <FileText aria-hidden className="size-4 shrink-0 text-(--em-ink-400)" />
                <span className="min-w-0 flex-1 truncate text-(--em-ink-100)">{f.name}</span>
                <span className="font-mono text-xs text-(--em-ink-400)">{size(f.size)}</span>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      </div>
    </div>
  );
}

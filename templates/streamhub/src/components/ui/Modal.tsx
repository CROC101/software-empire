"use client";

import { useEffect, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Plus, X } from "lucide-react";
import Link from "next/link";
import { useHub } from "@/context/MediaHubContext";

export function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  useEffect(() => {
    if (!open) return;
    const on = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", on);
    return () => window.removeEventListener("keydown", on);
  }, [open, onClose]);
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/75 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={{ scale: 0.94, y: 12 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.96, opacity: 0 }}
            transition={{ type: "spring", stiffness: 450, damping: 32 }}
            className="w-full max-w-[440px] rounded-[3px] border border-hairline bg-surface p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">{title}</h2>
              <button onClick={onClose} aria-label="Close" className="text-ink hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function AddToPlaylistModal({ videoId, onClose }: { videoId: string | null; onClose: () => void }) {
  const { allPlaylists, togglePlaylistVideo, createPlaylist, toast } = useHub();
  const [name, setName] = useState("");
  const lists = allPlaylists.filter((p) => p.id !== "history");
  return (
    <Modal open={!!videoId} onClose={onClose} title="Add to Playlist">
      {videoId && (
        <>
          <ul className="mb-4 max-h-[260px] space-y-1 overflow-y-auto">
            {lists.map((p) => {
              const inList = p.videoIds.includes(videoId);
              return (
                <li key={p.id} className="flex items-center gap-2">
                  <button
                    onClick={() => togglePlaylistVideo(p.id, videoId)}
                    className="flex flex-1 items-center gap-3 rounded-[3px] px-3 py-2 text-left text-base text-ink hover:bg-pill"
                  >
                    <span className={`flex h-5 w-5 items-center justify-center rounded-[2px] border ${inList ? "border-brand bg-brand text-black" : "border-[#555]"}`}>
                      {inList && <Check className="h-4 w-4" />}
                    </span>
                    {p.name}
                    <span className="ml-auto text-xs text-muted">{p.videoIds.length}</span>
                  </button>
                  <Link href={`/playlists/${p.id}`} onClick={onClose} className="text-xs text-brand-text hover:underline">
                    Open
                  </Link>
                </li>
              );
            })}
          </ul>
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (!name.trim()) return;
              const id = createPlaylist(name.trim(), videoId);
              toast(id ? `Created playlist "${name.trim()}"` : "Playlist limit reached (12)");
              setName("");
            }}
          >
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="New playlist name"
              aria-label="New playlist name"
              className="h-[38px] flex-1 rounded-[3px] bg-field px-3 text-md text-white outline-none focus:ring-1 focus:ring-brand"
            />
            <button className="flex h-[38px] items-center gap-1 rounded-[3px] bg-brand px-3 text-md font-bold text-black hover:bg-brand-hover">
              <Plus className="h-4 w-4" /> Create
            </button>
          </form>
        </>
      )}
    </Modal>
  );
}

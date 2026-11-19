"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { HubBrandLogo } from "@/components/brand/HubBrandLogo";
import { useHub } from "@/context/MediaHubContext";
import { MAIN_NAV, FOOTER_COLUMNS } from "./nav";
import { SPRING } from "./TopHeader";

export function MobileDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { allPlaylists } = useHub();
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-[60] bg-black/70"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            className="fixed bottom-0 left-0 top-0 z-[61] w-[280px] max-w-[85vw] overflow-y-auto border-r border-hairline bg-surface"
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            transition={SPRING}
            aria-label="Menu"
          >
            <div className="flex h-[61px] items-center justify-between px-4">
              <HubBrandLogo size={24} />
              <button onClick={onClose} aria-label="Close menu" className="text-ink hover:text-white">
                <X className="h-6 w-6" />
              </button>
            </div>
            <Section title="Browse">
              {MAIN_NAV.map((l) => (
                <Item key={l.href} href={l.href} label={l.label} onClose={onClose} />
              ))}
              <Item href="/upload" label="Upload Video" onClose={onClose} />
              <Item href="/search?q=4K" label="Search" onClose={onClose} />
            </Section>
            <Section title="Library">
              {allPlaylists.map((p) => (
                <Item key={p.id} href={`/playlists/${p.id}`} label={`${p.name} (${p.videoIds.length})`} onClose={onClose} />
              ))}
              <Item href="/favorites" label="Favorites page" onClose={onClose} />
            </Section>
            <Section title="Help">
              {FOOTER_COLUMNS[2].links.map((l) => (
                <Item key={l.label} href={l.href} label={l.label} onClose={onClose} />
              ))}
            </Section>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-hairline py-2">
      <p className="px-4 py-2 text-2xs font-bold uppercase text-muted">{title}</p>
      {children}
    </div>
  );
}

function Item({ href, label, onClose }: { href: string; label: string; onClose: () => void }) {
  return (
    <Link href={href} onClick={onClose} className="block px-4 py-2 text-base text-ink hover:bg-pill-hover hover:text-brand">
      {label}
    </Link>
  );
}

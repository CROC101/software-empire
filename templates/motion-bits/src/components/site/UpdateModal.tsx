"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";

const KEY = "motion-bits:update-dismissed";

/** Release-notes popup shown once over docs-style pages, until dismissed. */
export default function UpdateModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(KEY) !== "1") setOpen(true);
  }, []);

  const change = (o: boolean) => {
    setOpen(o);
    if (!o) localStorage.setItem(KEY, "1");
  };

  return (
    <Dialog open={open} onOpenChange={change}>
      <DialogContent className="max-w-[440px] gap-0 overflow-hidden rounded-[18px] border border-violet/20 bg-[#0f0c13] p-2 sm:max-w-[440px]">
        <div
          className="flex h-[238px] items-center justify-center rounded-xl max-sm:h-[180px]"
          style={{ background: "radial-gradient(55% 60% at 50% 50%, #1d4ed8, #3b82f6 45%, #bfdbfe 80%, #e0f2fe)" }}
        >
          <p className="font-serif text-[36px] tracking-[-0.03em] text-white drop-shadow">Fresh arrivals.</p>
        </div>
        <div className="px-4 pt-6 pb-3">
          <DialogTitle className="text-[24px] font-medium tracking-[-0.02em] text-white">Motion Bits Pro November Update</DialogTitle>
          <p className="mt-4 text-[14px] leading-[1.5] text-white/60">
            <b className="text-white">25 new components</b>, <b className="text-white">100 new marketing blocks</b>, <b className="text-white">15 new agent items</b> and{" "}
            <b className="text-white">3 new templates</b>.
          </p>
          <DialogDescription className="mt-3 max-w-[300px] text-[13.5px] leading-[1.55] text-white/55">
            Product mockups, data displays, tactile pieces and new backgrounds, plus heroes and stores that stack into full pages.
          </DialogDescription>
          <Link
            href="/pro/"
            onClick={() => change(false)}
            className="btn-light mt-6 flex h-[43px] w-full items-center justify-center gap-2 text-[13.5px] font-medium"
          >
            Explore Motion Bits Pro <ArrowRight className="size-4" />
          </Link>
          <Link href="/about/" onClick={() => change(false)} className="mt-3 block py-1 text-center text-[13px] font-medium text-white/60 hover:text-white">
            View changelog
          </Link>
        </div>
      </DialogContent>
    </Dialog>
  );
}

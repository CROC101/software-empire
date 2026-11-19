"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Cookie, X } from "lucide-react";

const KEY = "streamhub-cookies-ok";

/** Cookie consent pop-up; shown until accepted (stored in localStorage). */
export function CookieBanner() {
  const [show, setShow] = useState(false);
  useEffect(() => setShow(localStorage.getItem(KEY) !== "1"), []);
  if (!show) return null;
  const accept = () => {
    localStorage.setItem(KEY, "1");
    setShow(false);
  };
  return (
    <div
      role="region"
      aria-label="Cookie consent"
      className="fixed bottom-[20px] left-1/2 z-[95] w-[calc(100%-20px)] max-w-[500px] -translate-x-1/2 rounded-[4px] bg-[#1b1b1b] p-[20px] text-[12px] leading-[18px] text-white shadow-[0_0_20px_rgba(0,0,0,0.6)]"
    >
      <button onClick={() => setShow(false)} aria-label="Close" className="absolute right-[14px] top-[14px] text-white hover:text-brand">
        <X className="h-[18px] w-[18px]" />
      </button>
      <div className="flex gap-[14px] pr-[24px]">
        <Cookie className="h-[30px] w-[30px] shrink-0 text-muted" aria-hidden />
        <p>
          This site uses cookies and local storage to remember your settings. Learn how we use them in our{" "}
          <Link href="/information/cookie-notice" className="text-brand-text">Cookie Notice</Link>.
        </p>
      </div>
      <div className="mt-[14px] flex gap-[8px] sm:pl-[44px]">
        <Link href="/information/cookie-notice" className="flex h-[42px] flex-1 items-center justify-center rounded-[2px] border border-white text-[14px] font-bold hover:bg-white/10 sm:w-[194px] sm:flex-none">
          Customize Cookies
        </Link>
        <button onClick={accept} className="h-[42px] flex-1 rounded-[2px] border border-white text-[14px] font-bold hover:bg-white/10 sm:w-[194px] sm:flex-none">
          Ok
        </button>
      </div>
    </div>
  );
}

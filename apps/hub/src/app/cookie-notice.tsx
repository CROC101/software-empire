"use client";

import { useEffect, useState } from "react";

const CONSENT = "em-consent";
const YEAR_S = 60 * 60 * 24 * 365;
// what this site really stores: nothing else is set, no ads, no trackers
const COOKIES = [
  ["em-theme", "ธีมสว่างหรือมืดที่เลือก", "1 ปี"],
  ["em-ambience", "บรรยากาศหรือฤดูกาลที่เลือก", "1 ปี"],
  ["sb-…", "การล็อกอิน (เมื่อล็อกอินเท่านั้น)", "ตามรอบล็อกอิน"],
  [CONSENT, "จำว่าอ่านข้อความนี้แล้ว", "1 ปี"],
] as const;

const accepted = () => new RegExp(`(?:^|;\\s*)${CONSENT}=`).test(document.cookie);

/**
 * The cookie notice, in the water style of the menu: a glass card with water lapping along its
 * foot. The site only keeps necessary cookies, so it informs rather than asks; "เข้าใจแล้ว" fills
 * the card with water and remembers it (shared domain, so the other apps do not ask again).
 * Waits for the first-visit intro to finish.
 */
export function CookieNotice({ cookieDomain }: { cookieDomain?: string }) {
  const [state, setState] = useState<"hidden" | "shown" | "leaving">("hidden");

  useEffect(() => {
    if (accepted()) return;
    const html = document.documentElement;
    let timer = 0;
    const show = () => {
      if (html.classList.contains("em-intro")) return;
      watch.disconnect();
      timer = window.setTimeout(() => {
        setState("shown");
      }, 1200);
    };
    const watch = new MutationObserver(show);
    watch.observe(html, { attributes: true, attributeFilter: ["class"] });
    show();
    return () => {
      watch.disconnect();
      window.clearTimeout(timer);
    };
  }, []);

  if (state === "hidden") return null;

  const accept = () => {
    const domain = cookieDomain ? `; Domain=${cookieDomain}` : "";
    document.cookie = `${CONSENT}=1; Path=/; Max-Age=${String(YEAR_S)}; SameSite=Lax${domain}`;
    setState("leaving");
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.setTimeout(
      () => {
        setState("hidden");
      },
      still ? 0 : 900,
    );
  };

  return (
    <aside
      aria-label="การใช้คุกกี้"
      className="cw-cookie cw-glass"
      data-leaving={state === "leaving" || undefined}
    >
      <span className="cw-water" aria-hidden>
        <span />
        <span />
      </span>
      <p className="relative font-mono text-xs uppercase tracking-[0.2em] cw-blue">cookies</p>
      <p className="relative mt-2 font-black leading-snug">ใช้คุกกี้เท่าที่จำเป็น</p>
      <p className="relative mt-1.5 text-sm text-muted-foreground">
        จำธีม บรรยากาศ และการล็อกอินของคุณเท่านั้น ไม่มีโฆษณา ไม่มีตัวติดตาม ไม่ส่งข้อมูลให้ใคร
      </p>
      <details className="relative mt-3 text-sm">
        <summary className="cursor-pointer select-none font-bold">ดูว่าเก็บอะไรบ้าง</summary>
        <ul className="mt-2 grid gap-1.5">
          {COOKIES.map(([name, what, keep]) => (
            <li key={name} className="flex items-baseline justify-between gap-3">
              <span>
                <code className="font-mono text-xs">{name}</code>{" "}
                <span className="text-muted-foreground">{what}</span>
              </span>
              <span className="shrink-0 font-mono text-xs text-muted-foreground">{keep}</span>
            </li>
          ))}
        </ul>
      </details>
      <button
        type="button"
        onClick={accept}
        className="cw-btn-blue relative mt-4 w-full px-4 py-2.5 text-sm font-bold"
      >
        เข้าใจแล้ว
      </button>
    </aside>
  );
}

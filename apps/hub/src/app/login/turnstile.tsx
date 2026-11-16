"use client";

import { useEffect, useRef } from "react";

// literal read so Next inlines it; unset (local dev) = no widget, and Supabase CAPTCHA stays off
const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
const SCRIPT = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

type TurnstileApi = {
  render: (el: HTMLElement, options: Record<string, unknown>) => string;
  remove: (id: string) => void;
};

let loading: Promise<TurnstileApi> | undefined;
function loadTurnstile() {
  loading ??= new Promise<TurnstileApi>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SCRIPT;
    script.async = true;
    script.onload = () => {
      const api = (window as { turnstile?: TurnstileApi }).turnstile;
      if (api) resolve(api);
      else reject(new Error("turnstile missing"));
    };
    script.onerror = () => {
      loading = undefined; // let the next mount try again
      reject(new Error("turnstile blocked"));
    };
    document.head.append(script);
  });
  return loading;
}

/**
 * Cloudflare Turnstile inside an auth form: it writes a one-use token into the hidden input
 * `cf-turnstile-response`, and the server action hands it to Supabase Auth as `captchaToken`.
 * A token works once, so pass the action state as `reset`: every answer draws a fresh widget.
 */
export function Turnstile({ reset, className }: { reset?: unknown; className?: string }) {
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!SITE_KEY) return;
    let id: string | undefined;
    let live = true;
    loadTurnstile()
      .then((api) => {
        if (!live || !box.current) return;
        id = api.render(box.current, {
          sitekey: SITE_KEY,
          size: "flexible",
          theme: document.documentElement.classList.contains("dark") ? "dark" : "light",
        });
      })
      // blocked script: Supabase refuses the login and the form says to reload
      .catch(() => undefined);
    return () => {
      live = false;
      if (id) (window as { turnstile?: TurnstileApi }).turnstile?.remove(id);
    };
  }, [reset]);

  if (!SITE_KEY) return null;
  return <div ref={box} className={`min-h-[65px] ${className ?? ""}`} />;
}

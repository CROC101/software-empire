"use client";

import Link from "next/link";
import { HubBrandLogo } from "@/components/brand/HubBrandLogo";
import { LanguageMenu } from "./LanguageMenu";

export const GATE_KEY = "streamhub-gate-ok";

/** First-visit welcome screen. Hidden by a pre-paint class once accepted (see layout). */
export function WelcomeGate() {
  const enter = () => {
    localStorage.setItem(GATE_KEY, "1");
    document.documentElement.classList.add("gate-ok");
  };
  return (
    <div className="welcome-gate fixed inset-0 z-[90] overflow-y-auto bg-obsidian" role="dialog" aria-modal="true" aria-labelledby="gate-title">
      <div className="relative mx-auto mb-10 mt-[100px] w-full border border-[#2a2a2a] bg-obsidian px-[30px] pb-[30px] pt-[65px] shadow-[0_0_40px_5px_rgba(255,255,255,0.15)] md:w-[814px] md:px-[32px]">
        <div className="absolute left-[5px] top-[5px]">
          <LanguageMenu />
        </div>
        <div className="flex h-[43px] items-center justify-center">
          <HubBrandLogo size={36} href={null} />
        </div>
        <div className="mx-auto max-w-gate text-center">
          <h3 id="gate-title" className="mt-[23px] text-hero font-bold leading-[45px] text-white">
            Welcome to StreamHub
          </h3>
          <Link
            href="/information/terms"
            className="mx-auto mt-[20px] flex h-[38px] w-[182px] items-center justify-center rounded-pill border border-[#5a5a5a] text-md font-bold text-ink hover:border-brand"
          >
            Notice to Users
          </Link>
          <p className="mt-[20px] text-2xl leading-[28px] text-ink-soft">
            StreamHub is a showcase video platform. Everything here is safe-for-work: open movies, 3D animation, game
            dev, tech reviews and creative tutorials. By entering, you agree that your playlists and settings are saved
            in this browser and you accept our community guidelines.
          </p>
          <p className="text-2xl leading-[28px]">
            <Link href="/information/cookie-notice" className="font-bold text-brand-text hover:underline">
              Read our Cookie Notice
            </Link>
          </p>
          <div className="mt-[40px] flex flex-col items-center gap-[10px]">
            <button
              onClick={enter}
              className="h-[50px] w-[296px] max-w-full rounded-btn border border-[#5a5a5a] text-md font-bold text-ink hover:border-brand hover:text-white"
            >
              Enter StreamHub
            </button>
            <button
              onClick={() => history.back()}
              className="h-[50px] w-[296px] max-w-full rounded-btn border border-[#5a5a5a] text-md font-bold text-ink hover:border-brand hover:text-white"
            >
              Not now - Exit
            </button>
          </div>
          <div className="mt-[40px] text-2xl leading-[28px] text-ink-soft">
            <p className="font-bold">Viewer Controls</p>
            <p>
              <Link href="/playlists/history" className="text-brand-text hover:underline">Manage Watch History</Link>,{" "}
              <Link href="/playlists/watch-later" className="text-brand-text hover:underline">Review your Watch Later queue</Link>, and
              pick your preferred quality in the player.
            </p>
            <p>
              <Link href="/content-removal" className="text-brand-text hover:underline">Visit our Content Removal page</Link> for
              step-by-step guidance on reporting a video.
            </p>
            <p>
              <Link href="/information/terms" className="font-bold text-brand-text hover:underline">Terms of Service</Link>
            </p>
            <p>
              Visit our <Link href="/upload" className="text-brand-text hover:underline">Creator Studio</Link> for tools and
              resources to publish your own videos.
            </p>
            <p>
              <Link href="/content-removal" className="font-bold text-brand-text hover:underline">Content Removal</Link>
            </p>
          </div>
          <div className="mt-[28px] flex justify-center">
            <span className="flex h-[31px] w-[88px] items-center justify-center rounded-[2px] border-2 border-white text-xs font-bold tracking-wider text-white">
              SFW · ALL
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

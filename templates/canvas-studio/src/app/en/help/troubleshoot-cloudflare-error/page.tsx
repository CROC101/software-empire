import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = { title: 'Connection check · CanvaCraft Help' };

/** Original hand-drawn style backdrop: soft clouds, rolling hills, a striped road barrier. */
function Landscape() {
  return (
    <svg className="pointer-events-none absolute inset-x-0 bottom-0 h-[400px] w-full sm:h-[74%]" viewBox="0 0 1440 670" preserveAspectRatio="xMidYMax slice" aria-hidden>
      <defs>
        <linearGradient id="hl-cloud" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#F0FAFB" />
          <stop offset="1" stopColor="#D3F1F4" />
        </linearGradient>
        <linearGradient id="hl-hill1" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2EAA4F" />
          <stop offset="1" stopColor="#167A38" />
        </linearGradient>
        <linearGradient id="hl-hill2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#17703C" />
          <stop offset="1" stopColor="#08261A" />
        </linearGradient>
        <linearGradient id="hl-post" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#9FD3FF" />
          <stop offset="1" stopColor="#E3F2FF" />
        </linearGradient>
        <radialGradient id="hl-lamp" cx="0.45" cy="0.4" r="0.6">
          <stop offset="0" stopColor="#FF7A9A" />
          <stop offset="1" stopColor="#F0405F" />
        </radialGradient>
        <pattern id="hl-stripe" width="84" height="52" patternUnits="userSpaceOnUse" patternTransform="skewX(-38)">
          <rect width="84" height="52" fill="#4A2BB8" />
          <rect width="34" height="52" fill="#FFC21A" />
        </pattern>
      </defs>
      {/* clouds */}
      <path fill="url(#hl-cloud)" d="M0 10c70-10 150 30 170 110 40-30 110-20 140 30 60-40 150-10 160 70 30 70-10 140-80 170H0z" />
      <path fill="#D6F2F5" d="M0 330c60-50 160-60 230-20 50-40 130-30 170 30 60 0 100 50 90 110H0z" />
      <path fill="url(#hl-cloud)" d="M1440 150c-60-20-140 10-170 90-50-30-130-10-150 60-70-10-130 50-120 130 10 60 60 90 120 100h320z" />
      <path fill="#D6F2F5" d="M1440 380c-50-40-140-40-190 10-60-20-140 20-150 90 0 40 30 70 70 80h270z" />
      {/* hills */}
      <path fill="url(#hl-hill1)" d="M0 520c160-70 330-50 480-10 120 30 230 40 330 10 150-50 300-110 450-60 70 20 130 50 180 90v120H0z" />
      <path fill="url(#hl-hill2)" d="M0 580c180-40 360-30 540 10 160 30 300 40 460 0 160-40 300-40 440 0v80H0z" />
      <path fill="none" stroke="#0B4D2C" strokeOpacity=".35" strokeWidth="2" d="M60 610c120-20 260-20 380 10M900 600c140-30 290-30 430 0M300 640c160-10 320-10 480 10" />
      {/* barrier */}
      <g transform="translate(616 380)">
        <rect x="32" y="90" width="22" height="134" rx="8" fill="url(#hl-post)" />
        <rect x="152" y="90" width="22" height="134" rx="8" fill="url(#hl-post)" />
        <circle cx="43" cy="22" r="22" fill="#FFC21A" />
        <circle cx="43" cy="22" r="13" fill="url(#hl-lamp)" />
        <circle cx="163" cy="22" r="22" fill="#FFC21A" />
        <circle cx="163" cy="22" r="13" fill="url(#hl-lamp)" />
        <path d="M28 40h30l6 12H22zM148 40h30l6 12h-42z" fill="#F5A300" />
        <rect x="0" y="50" width="208" height="52" rx="6" fill="url(#hl-stripe)" />
        <rect x="0" y="116" width="208" height="52" rx="6" fill="url(#hl-stripe)" />
        <rect x="0" y="50" width="208" height="10" rx="5" fill="#fff" fillOpacity=".25" />
        <rect x="0" y="116" width="208" height="10" rx="5" fill="#fff" fillOpacity=".25" />
      </g>
    </svg>
  );
}

export default function TroubleshootPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-white font-help text-help-ink">
      <Landscape />
      <div className="relative mx-auto flex max-w-help flex-col items-center px-[40px] pt-[105px] text-center">
        <svg role="img" aria-label="CanvaCraft" width="154" height="40" viewBox="0 0 200 52">
          <defs>
            <linearGradient id="hl-logo" x1="0" x2="1">
              <stop offset="0" stopColor="#00C4CC" />
              <stop offset=".55" stopColor="#5E35B1" />
              <stop offset="1" stopColor="#7D2AE8" />
            </linearGradient>
          </defs>
          <text x="100" y="38" textAnchor="middle" fontSize="36" fill="url(#hl-logo)" style={{ fontFamily: 'var(--font-pacifico), cursive' }}>
            CanvaCraft
          </text>
        </svg>
        <h1 className="mt-help-xl text-[28px] font-normal leading-[1.3] tracking-[-0.01em]">We’ll have you designing again soon</h1>
        <div role="main" className="mt-help-lg pb-[6px] pt-[20px]">
          <div className="flex h-[65px] w-[300px] items-center justify-between rounded-[3px] border border-[#e0e0e0] bg-[#fafafa] px-4 text-left">
          <span className="flex items-center gap-2 text-[14px]">
            <span className="h-[26px] w-[26px] animate-spin rounded-full border-[3px] border-dotted border-[#1e9e57]" aria-hidden />
            Verifying…
          </span>
        </div>
        </div>
        <p className="mt-help-lg text-[14px] leading-[1.6] text-help-sub">
          If you can’t get past this page,{' '}
          <Link href="/settings/" className="text-help-link underline">
            visit the Help Centre
          </Link>{' '}
          to see why this is happening.
        </p>
        <p className="mt-help-md text-[14px] text-help-ray">RayID: a5bce05adf796522</p>
      </div>
    </div>
  );
}

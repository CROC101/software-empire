import Link from "next/link";
import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className={cn("size-5", className)} aria-hidden>
      <rect x="5" y="5" width="14" height="14" rx="4" transform="rotate(45 12 12)" />
      <rect x="7.5" y="7.5" width="9" height="9" rx="2.5" />
      <circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none" />
    </svg>
  );
}

export default function Logo({ className, size = "sm" }: { className?: string; size?: "sm" | "lg" }) {
  return (
    <Link href="/" className={cn("inline-flex items-center gap-2 text-white", className)} aria-label="Motion Bits home">
      <LogoMark className={size === "lg" ? "size-9" : "size-5"} />
      <span className={size === "lg" ? "text-[26px] font-medium tracking-[-0.02em]" : "text-[15px] font-medium"}>Motion Bits</span>
    </Link>
  );
}

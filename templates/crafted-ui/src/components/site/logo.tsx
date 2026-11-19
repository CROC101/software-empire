import Link from "next/link";
import { cn } from "@/lib/utils";

export const BRAND = "Craft";

/** Block mark: neutral stand-in for the original's logo. */
export function Mark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 18 18" className={cn("size-[18px]", className)} aria-hidden fill="currentColor">
      <path d="M0 6h6V0h12v6h-6v6H6v6H0z" />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" className={cn("flex items-center gap-1.5 text-[17px] font-bold tracking-[-0.03em] text-ink", className)} aria-label={`${BRAND} home`}>
      <Mark />
      {BRAND.toUpperCase()}
    </Link>
  );
}

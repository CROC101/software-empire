import type { ComponentProps } from "react";
import { cn } from "../lib/cn";

/** The Empire "E" on an aurora disc — one mark for every app's header. Decorative: label the link. */
export function BrandMark({ className, ...props }: ComponentProps<"span">) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-grid size-9 shrink-0 place-items-center rounded-full bg-aurora font-bold text-white shadow-glow",
        className,
      )}
      {...props}
    >
      E
    </span>
  );
}

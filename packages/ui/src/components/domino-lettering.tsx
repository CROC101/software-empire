import type { CSSProperties } from "react";
import { cn } from "../lib/cn";
import { graphemes } from "../lib/graphemes";

/**
 * Letters stand like dominoes, topple one after another to the right, rest leaning, then stand
 * back up in a wave, and again. Pure CSS (transform only), so it renders on the server and costs
 * nothing per frame on the main thread. Screen readers get the plain text.
 * `offset` continues the chain from an earlier line; `lite={false}` keeps it moving in LITE mode.
 */
export function DominoLettering({
  text,
  offset = 0,
  step = 0.07,
  lite = true,
  className,
}: {
  text: string;
  /** letters already toppled before this line, so a two-line title is one chain */
  offset?: number;
  /** seconds between neighbouring letters */
  step?: number;
  lite?: boolean;
  className?: string;
}) {
  let index = offset;
  const words = text.split(" ");
  return (
    <span className={cn("em-domino", !lite && "em-keep-motion", className)}>
      <span className="sr-only">{text}</span>
      {words.map((word, w) => (
        <span key={w} aria-hidden className="whitespace-nowrap">
          {graphemes(word).map((letter, l) => (
            <span
              key={l}
              className="em-domino__tile"
              style={{ "--domino-delay": `${(index++ * step).toFixed(2)}s` } as CSSProperties}
            >
              {letter}
            </span>
          ))}
          {w < words.length - 1 && " "}
        </span>
      ))}
    </span>
  );
}

/** How many tiles a line uses, to pass as the next line's `offset`. */
export const dominoCount = (text: string) =>
  text.split(" ").reduce((n, word) => n + graphemes(word).length, 0);

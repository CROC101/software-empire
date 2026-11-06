import { cn } from "@empire/ui";
import { cardImage } from "@/lib/deck";
import { CardBack } from "./card-back";
import { CardTools } from "./card-tools";
import type { Drawn } from "@/lib/reading";

/**
 * One card, back up until `open`. The face is the 1909 Rider–Waite–Smith scan; a reversed card is
 * shown upside down, the way it lies on the table.
 */
export function TarotCard({
  drawn,
  open,
  onOpen,
  className,
  label,
}: {
  drawn: Drawn | null;
  open: boolean;
  onOpen?: () => void;
  className?: string;
  /** accessible name while the card is still face down */
  label?: string;
}) {
  const name = drawn
    ? `${drawn.card.th} (${drawn.card.en})${drawn.reversed ? " กลับหัว" : ""}`
    : "ไพ่";
  const face = (
    <span className="tt-card-inner block">
      <span aria-hidden className="tt-face tt-back-face block">
        <CardBack />
      </span>
      <span className="tt-face tt-front block">
        {drawn && open && (
          <img
            src={cardImage(drawn.card)}
            alt={name}
            width={420}
            height={731}
            decoding="async"
            className={cn("size-full object-cover", drawn.reversed && "rotate-180")}
          />
        )}
      </span>
    </span>
  );
  const cls = cn("tt-card block aspect-[420/731]", className);
  return onOpen && !open ? (
    <button
      type="button"
      data-open={open}
      onClick={onOpen}
      aria-label={label ?? "แตะเพื่อเปิดไพ่"}
      className={cn(
        cls,
        "cursor-pointer rounded-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--em-blue-300)]",
      )}
    >
      {face}
    </button>
  ) : (
    <span data-open={open} className={cls}>
      {face}
    </span>
  );
}

/** Name, orientation, keywords and the reading text under a revealed card. */
export function CardMeaning({
  drawn,
  text,
  position,
}: {
  drawn: Drawn;
  text: string;
  position?: string;
}) {
  const { card, reversed } = drawn;
  return (
    <div className="tt-panel space-y-3 p-4">
      {position && (
        <p className="font-heading text-xs font-semibold uppercase tracking-[0.2em] text-[var(--em-blue-300)]">
          {position}
        </p>
      )}
      <div>
        <h3 className="text-xl font-black">
          {card.th}
          {reversed && (
            <span className="ml-2 text-sm font-semibold text-[var(--em-gold-300)]">กลับหัว</span>
          )}
        </h3>
        <p className="font-heading text-sm text-[var(--em-ink-300)]">{card.en}</p>
      </div>
      <ul className="flex flex-wrap gap-1.5" aria-label="คำสำคัญ">
        {card.keywords.map((k) => (
          <li
            key={k}
            className="rounded-full bg-[color-mix(in_oklab,var(--em-blue-400)_22%,transparent)] px-2.5 py-0.5 text-xs"
          >
            {k}
          </li>
        ))}
      </ul>
      <p className="leading-relaxed">{text}</p>
      <p className="border-t border-[color-mix(in_oklab,var(--em-ink-0)_12%,transparent)] pt-3 text-sm text-[var(--em-ink-200)]">
        <span className="font-semibold text-[var(--em-gold-300)]">คำแนะนำ · </span>
        {card.advice}
      </p>
      <CardTools drawn={drawn} />
    </div>
  );
}

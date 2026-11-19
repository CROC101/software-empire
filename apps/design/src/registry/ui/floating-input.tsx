import { useId } from "react";

/** The label sits inside the field and floats up when you focus or type; the border lights from the centre. */
export default function FloatingInput({ label = "อีเมล" }: { label?: string }) {
  const id = useId();
  return (
    <div className="grid size-full min-h-56 place-items-center bg-(--em-ink-975) p-6">
      <div className="group relative w-full max-w-xs">
        <input
          id={id}
          type="text"
          placeholder=" "
          autoComplete="off"
          className="peer w-full rounded-lg border border-(--em-ink-700) bg-(--em-ink-900) px-4 pt-6 pb-2 text-(--em-ink-50) outline-none"
        />
        <label
          htmlFor={id}
          className="pointer-events-none absolute top-4 left-4 origin-left text-(--em-ink-400) transition-transform duration-200 peer-focus:-translate-y-2.5 peer-focus:scale-75 peer-focus:text-(--em-sky-400) peer-[:not(:placeholder-shown)]:-translate-y-2.5 peer-[:not(:placeholder-shown)]:scale-75 motion-reduce:transition-none"
        >
          {label}
        </label>
        <span
          aria-hidden
          className="absolute inset-x-2 bottom-0 h-0.5 scale-x-0 rounded-full bg-(--em-sky-400) transition-transform duration-300 peer-focus:scale-x-100 motion-reduce:transition-none"
        />
      </div>
    </div>
  );
}

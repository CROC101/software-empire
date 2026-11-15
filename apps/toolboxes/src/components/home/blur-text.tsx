import { motion, useReducedMotion } from "motion/react";

/**
 * Letters come out of a blur one by one (after React Bits BlurText), on the first view and
 * again each time the line scrolls back into view. Reduced motion: plain text.
 */
export function BlurText({ parts }: { parts: { text: string; className?: string }[] }) {
  const still = useReducedMotion();
  let i = 0;
  return (
    <motion.span
      aria-label={parts.map((p) => p.text).join("")}
      initial="hidden"
      whileInView="shown"
      viewport={{ amount: 0.5 }}
      className="inline-block"
    >
      {parts.map((p) => (
        <span key={p.text} aria-hidden className={p.className}>
          {[...p.text].map((ch) => {
            const n = i++;
            return still ? (
              ch
            ) : (
              <motion.span
                key={n}
                className="inline-block will-change-[filter,transform]"
                variants={{
                  hidden: { opacity: 0, filter: "blur(14px)", y: -24 },
                  shown: {
                    opacity: [0, 0.6, 1],
                    filter: ["blur(14px)", "blur(5px)", "blur(0px)"],
                    y: [-24, 4, 0],
                    transition: { duration: 0.7, delay: n * 0.08, ease: "easeOut" },
                  },
                }}
              >
                {ch}
              </motion.span>
            );
          })}
        </span>
      ))}
    </motion.span>
  );
}

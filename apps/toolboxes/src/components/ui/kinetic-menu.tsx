import { Plus } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion, type Transition } from "motion/react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router";

export type MenuLink = { to: string; label: string; hint: string };

// "main" curve of the Sterling Gate menu this is rebuilt from
const EASE = [0.65, 0.01, 0.05, 0.99] as const;

// every hover scene grows its parts in one after another, from their own centre
const part = {
  variants: {
    hidden: { scale: 0.5, opacity: 0, rotate: -10 },
    shown: { scale: 1, opacity: 1, rotate: 0 },
  },
  transition: { type: "spring", stiffness: 260, damping: 16 },
  style: { transformBox: "fill-box", transformOrigin: "center" },
} as const;

/** One quiet scene per row behind the links: circles, waves, dots, blobs, rays. */
function Scene({ index }: { index: number }) {
  const scenes = [
    <>
      <motion.circle {...part} cx="80" cy="120" r="40" className="fill-primary/15" />
      <motion.circle {...part} cx="300" cy="80" r="60" className="fill-primary/10" />
      <motion.circle {...part} cx="200" cy="300" r="80" className="fill-foreground/5" />
      <motion.circle {...part} cx="350" cy="280" r="30" className="fill-primary/15" />
    </>,
    <>
      <motion.path
        {...part}
        d="M0 200 Q100 100 200 200 T400 200"
        strokeWidth="60"
        className="fill-none stroke-primary/15"
      />
      <motion.path
        {...part}
        d="M0 280 Q100 180 200 280 T400 280"
        strokeWidth="40"
        className="fill-none stroke-primary/10"
      />
    </>,
    <>
      {[50, 150, 250, 350].flatMap((y, row) =>
        (row % 2 ? [100, 200, 300] : [50, 150, 250, 350]).map((x) => (
          <motion.circle
            {...part}
            key={`${String(x)}-${String(y)}`}
            cx={x}
            cy={y}
            r={12 - row * 1.5}
            className="fill-primary/25"
          />
        )),
      )}
    </>,
    <>
      <motion.path
        {...part}
        d="M100 100 Q150 50 200 100 Q250 150 200 200 Q150 250 100 200 Q50 150 100 100"
        className="fill-primary/10"
      />
      <motion.path
        {...part}
        d="M250 200 Q300 150 350 200 Q400 250 350 300 Q300 350 250 300 Q200 250 250 200"
        className="fill-foreground/5"
      />
    </>,
    <>
      <motion.line
        {...part}
        x1="0"
        y1="100"
        x2="300"
        y2="400"
        strokeWidth="30"
        className="stroke-primary/15"
      />
      <motion.line
        {...part}
        x1="100"
        y1="0"
        x2="400"
        y2="300"
        strokeWidth="25"
        className="stroke-primary/10"
      />
      <motion.line
        {...part}
        x1="200"
        y1="0"
        x2="400"
        y2="200"
        strokeWidth="20"
        className="stroke-foreground/5"
      />
    </>,
  ];
  return (
    <motion.svg
      aria-hidden
      viewBox="0 0 400 400"
      initial="hidden"
      animate="shown"
      exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.3 } }}
      transition={{ staggerChildren: 0.08 }}
      className="absolute inset-0 m-auto size-full max-h-[min(100%,40rem)]"
    >
      {scenes[index % scenes.length]}
    </motion.svg>
  );
}

/**
 * Full-screen kinetic menu (after "Sterling Gate" on 21st.dev, rebuilt on motion/react, a native
 * <dialog> and our tokens): three sheets sweep in from the right, the links rise and tilt
 * upright, and hovering a link grows a scene behind it. Escape, the shade and every link close it.
 */
export function KineticMenu({ links, footer }: { links: MenuLink[]; footer?: ReactNode }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const [scene, setScene] = useState<number | null>(null);
  const still = useReducedMotion() ?? false;
  const t = (x: Transition = {}): Transition =>
    still ? { duration: 0 } : { ease: EASE, duration: 0.7, ...x };

  useEffect(() => {
    if (!open) return;
    dialog.current?.showModal();
    // the page under a modal still scrolls on wheel and touch: hold it while the menu is up
    const root = document.documentElement;
    root.style.overflow = "hidden";
    return () => {
      root.style.overflow = "";
    };
  }, [open]);

  const close = () => {
    setOpen(false);
    setScene(null);
  };

  return (
    <>
      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => {
          setOpen(true);
        }}
        className="inline-flex h-10 items-center gap-1.5 rounded-md px-2.5 text-sm font-semibold hover:bg-muted"
      >
        เมนู
        <Plus aria-hidden className="size-4" />
      </button>

      <dialog
        ref={dialog}
        aria-label="เมนูทั้งหมด"
        onCancel={(e) => {
          e.preventDefault();
          close();
        }}
        className="m-0 h-dvh max-h-none w-full max-w-none overflow-hidden bg-transparent p-0 text-foreground backdrop:bg-transparent"
      >
        <AnimatePresence onExitComplete={() => dialog.current?.close()}>
          {open && (
            <motion.div key="menu" className="relative h-full">
              <motion.div
                aria-hidden
                onClick={close}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={t()}
                className="absolute inset-0 bg-foreground/40"
              />
              <motion.div
                initial={{ x: 0 }}
                exit={{ x: "120%" }}
                transition={t()}
                className="absolute inset-y-0 right-0 flex w-full flex-col sm:w-[min(40rem,100%)]"
              >
                {["bg-primary", "bg-muted", "bg-background"].map((bg, i) => (
                  <motion.div
                    key={bg}
                    aria-hidden
                    initial={{ x: "101%" }}
                    animate={{ x: 0 }}
                    transition={t({ duration: 0.575, delay: i * 0.12 })}
                    className={`absolute inset-0 rounded-l-xl ${bg}`}
                  />
                ))}
                <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
                  <AnimatePresence>
                    {scene !== null && <Scene key={scene} index={scene} />}
                  </AnimatePresence>
                </div>

                <button
                  type="button"
                  onClick={close}
                  className="relative mt-2 mr-2 inline-flex h-10 items-center gap-1.5 self-end rounded-md px-2.5 text-sm font-semibold hover:bg-muted"
                >
                  {/* "เมนู" slides up and "ปิด" takes its place, the plus turns into a cross */}
                  {/* 24px lines: Thai marks above and below spill out of a 20px one */}
                  <span className="inline-flex h-6 overflow-hidden leading-6">
                    <motion.span
                      initial={{ y: 0 }}
                      animate={{ y: "-50%" }}
                      transition={t()}
                      className="flex h-12 flex-col"
                    >
                      <span aria-hidden>เมนู</span>
                      <span>ปิด</span>
                    </motion.span>
                  </span>
                  <motion.span initial={{ rotate: 0 }} animate={{ rotate: 315 }} transition={t()}>
                    <Plus aria-hidden className="size-4" />
                  </motion.span>
                </button>

                <nav aria-label="ทุกหน้า" className="relative flex flex-1 flex-col justify-center">
                  <ul>
                    {links.map((link, i) => (
                      <li key={link.to} className="overflow-hidden">
                        <motion.div
                          initial={{ y: "140%", rotate: 10 }}
                          animate={{ y: 0, rotate: 0 }}
                          transition={t({ delay: 0.35 + i * 0.05 })}
                          style={{ transformOrigin: "left bottom" }}
                        >
                          <Link
                            to={link.to}
                            onClick={close}
                            onPointerEnter={() => {
                              setScene(i);
                            }}
                            onFocus={() => {
                              setScene(i);
                            }}
                            onPointerLeave={() => {
                              setScene(null);
                            }}
                            className="group relative flex items-baseline justify-between gap-4 px-6 py-2 outline-none sm:px-10"
                          >
                            <span
                              aria-hidden
                              className="absolute inset-0 origin-bottom scale-y-0 bg-primary/10 transition-transform duration-500 group-hover:scale-y-100 group-focus-visible:scale-y-100"
                            />
                            <span className="relative text-4xl font-black sm:text-6xl">
                              {link.label}
                            </span>
                            <span className="relative font-mono text-xs text-muted-foreground">
                              {link.hint}
                            </span>
                          </Link>
                        </motion.div>
                      </li>
                    ))}
                  </ul>
                </nav>

                {footer && (
                  <motion.div
                    initial={{ opacity: 0, y: "50%" }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={t({ delay: 0.55 + links.length * 0.05 })}
                    className="relative px-6 pb-8 text-sm text-muted-foreground sm:px-10"
                  >
                    {footer}
                  </motion.div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </dialog>
    </>
  );
}

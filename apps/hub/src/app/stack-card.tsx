"use client";

import { Button, Card, CardContent } from "@empire/ui";
import { Database, ShieldCheck } from "lucide-react";
import { motion } from "motion/react";
import Image from "next/image";
import { useId, type ComponentType, type ReactNode } from "react";

/**
 * "Everything plugs into one hub": the crocwork logo in the middle, the stack around it,
 * with light pulses running along the wires. Geometry is in a 564×410 viewBox; icons are
 * placed in % of it so the drawing scales with the card.
 */

type Logo = ComponentType<{ className?: string }>;

const ReactLogo: Logo = ({ className }) => (
  <svg viewBox="0 0 28 28" fill="none" className={className}>
    <ellipse cx="14" cy="14" rx="11" ry="4.2" stroke="currentColor" strokeWidth="1.4" />
    <ellipse
      cx="14"
      cy="14"
      rx="11"
      ry="4.2"
      stroke="currentColor"
      strokeWidth="1.4"
      transform="rotate(60 14 14)"
    />
    <ellipse
      cx="14"
      cy="14"
      rx="11"
      ry="4.2"
      stroke="currentColor"
      strokeWidth="1.4"
      transform="rotate(120 14 14)"
    />
    <circle cx="14" cy="14" r="2.1" fill="currentColor" />
  </svg>
);

const TailwindLogo: Logo = ({ className }) => (
  <svg viewBox="0 0 28 28" fill="none" className={className}>
    <path
      d="M7 11.19C7.93 7.45 10.27 5.58 14 5.58c5.6 0 6.3 4.21 9.1 4.91 1.87.47 3.5-.23 4.9-2.1-.93 3.74-3.27 5.61-7 5.61-5.6 0-6.3-4.21-9.1-4.91-1.87-.47-3.5.23-4.9 2.1ZM0 19.61C.93 15.87 3.27 14 7 14c5.6 0 6.3 4.21 9.1 4.91 1.87.47 3.5-.23 4.9-2.1-.93 3.74-3.27 5.61-7 5.61-5.6 0-6.3-4.21-9.1-4.91-1.87-.47-3.5.23-4.9 2.1Z"
      fill="currentColor"
    />
  </svg>
);

const MotionLogo: Logo = ({ className }) => (
  <svg viewBox="0 0 28 28" fill="none" className={className}>
    <path
      d="M10.58 8.75 5.05 19.25H0l4.32-8.2c.67-1.27 2.35-2.3 3.74-2.3h2.52Zm12.38 2.62c0-1.45 1.13-2.62 2.52-2.62S28 9.92 28 11.37 26.87 14 25.48 14s-2.52-1.17-2.52-2.63ZM11.53 8.75h5.04l-5.54 10.5H5.99l5.54-10.5Zm5.96 0h5.04l-4.32 8.2c-.67 1.27-2.34 2.3-3.74 2.3h-2.52l5.54-10.5Z"
      fill="currentColor"
    />
  </svg>
);

const DbLogo: Logo = ({ className }) => <Database className={className} />;
const RlsLogo: Logo = ({ className }) => <ShieldCheck className={className} />;

const ClaudeLogo: Logo = ({ className }) => (
  // AI engineering role: an asterisk-style spark, not a vendor trademark
  <svg viewBox="0 0 28 28" fill="none" className={className}>
    {[0, 30, 60, 90, 120, 150].map((deg) => (
      <rect
        key={deg}
        x="12.8"
        y="2"
        width="2.4"
        height="24"
        rx="1.2"
        fill="currentColor"
        transform={`rotate(${String(deg)} 14 14)`}
      />
    ))}
  </svg>
);

const NODES: {
  id: string;
  label: string;
  icon: Logo;
  x: number;
  y: number;
  path: string;
  delay: number;
}[] = [
  {
    id: "postgres",
    label: "Postgres",
    icon: DbLogo,
    x: 110,
    y: 90,
    path: "M 270 205 V 105 Q 270 90 255 90 H 110",
    delay: 0.1,
  },
  {
    id: "ai",
    label: "AI",
    icon: ClaudeLogo,
    x: 360,
    y: 70,
    path: "M 294 205 V 85 Q 294 70 309 70 H 360",
    delay: 0.2,
  },
  {
    id: "rls",
    label: "Row Level Security",
    icon: RlsLogo,
    x: 160,
    y: 205,
    path: "M 250 205 H 160",
    delay: 0.3,
  },
  {
    id: "react",
    label: "React",
    icon: ReactLogo,
    x: 480,
    y: 205,
    path: "M 314 205 H 480",
    delay: 0.4,
  },
  {
    id: "motion",
    label: "Motion",
    icon: MotionLogo,
    x: 282,
    y: 360,
    path: "M 282 205 V 360",
    delay: 0.6,
  },
  {
    id: "tailwind",
    label: "Tailwind CSS",
    icon: TailwindLogo,
    x: 460,
    y: 340,
    path: "M 314 215 V 325 Q 314 340 329 340 H 460",
    delay: 0.7,
  },
];

function Wire({ d, id, delay }: { d: string; id: string; delay: number }) {
  return (
    <>
      <path d={d} stroke="var(--border)" strokeWidth="1" />
      <motion.path
        d={d}
        stroke={`url(#${id})`}
        strokeWidth="2"
        strokeDasharray="40 160"
        initial={{ strokeDashoffset: 200 }}
        animate={{ strokeDashoffset: -200 }}
        // fixed per-wire delay (not Math.random) so server and client render alike
        transition={{ duration: 4, repeat: Infinity, ease: "linear", delay: delay * 3 }}
      />
      <defs>
        <linearGradient id={id} gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="transparent" />
          <stop offset="50%" stopColor="var(--em-blue-500)" stopOpacity="0.8" />
          <stop offset="100%" stopColor="transparent" />
        </linearGradient>
      </defs>
    </>
  );
}

function StackDiagram() {
  const uid = useId().replace(/:/g, "");
  return (
    <div
      className="relative size-full"
      role="img"
      aria-label={`ทุกระบบต่อเข้า hub เดียว: ${NODES.map((n) => n.label).join(", ")}`}
    >
      <svg
        aria-hidden
        className="pointer-events-none absolute inset-0 size-full"
        viewBox="0 0 564 410"
        fill="none"
      >
        {NODES.map((n) => (
          <Wire key={n.id} d={n.path} id={`${uid}-${n.id}`} delay={n.delay} />
        ))}
      </svg>

      <div className="absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2 rounded-2xl border bg-background p-2 shadow-xl">
        <div className="rounded-xl border p-2">
          <Image
            src="/crocwork-logo.webp"
            alt=""
            width={31}
            height={36}
            className="h-6 w-auto sm:h-9"
          />
        </div>
        <motion.div
          aria-hidden
          className="absolute inset-0 rounded-2xl border-2 border-[var(--em-blue-500)]"
          animate={{ scale: [1, 1.18, 1], opacity: [0.4, 0, 0.4] }}
          transition={{ duration: 3, repeat: Infinity }}
        />
      </div>

      {NODES.map((n) => {
        const Icon = n.icon;
        return (
          <motion.div
            key={n.id}
            aria-hidden
            title={n.label}
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: n.delay }}
            style={{ left: `${String((n.x / 564) * 100)}%`, top: `${String((n.y / 410) * 100)}%` }}
            className="absolute z-10 flex size-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-lg border bg-background text-foreground shadow-sm sm:size-12 sm:rounded-xl"
          >
            <Icon className="size-4 sm:size-6" />
          </motion.div>
        );
      })}
    </div>
  );
}

function Visual({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex aspect-[564/460] w-full items-center justify-center overflow-hidden bg-muted p-8 sm:aspect-[564/410]">
      <div
        aria-hidden
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: "radial-gradient(circle, var(--foreground) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-background/60 via-transparent to-background/60"
      />
      <div className="relative z-10 size-full">{children}</div>
    </div>
  );
}

export function StackCard({ href }: { href: string }) {
  return (
    <Card className="mx-auto flex w-full max-w-xl flex-col gap-0 overflow-hidden rounded-2xl p-0">
      <Visual>
        <StackDiagram />
      </Visual>
      <CardContent className="flex flex-col gap-6 p-6 sm:p-8">
        <div className="flex flex-col gap-2">
          <h3 className="text-xl font-black tracking-tight sm:text-2xl">
            ทำไมทุกระบบต้องผ่านที่เดียว
          </h3>
          <p className="leading-relaxed text-muted-foreground">
            เพราะผมขี้เกียจล็อกอินเจ็ดรอบ เลยทำให้ล็อกอินทีเดียวใช้ได้ทุกระบบ ฐานข้อมูลก้อนเดียว
            กฎสิทธิ์ชุดเดียว แก้ที่เดียวทุกระบบได้ตาม
          </p>
        </div>
        <Button
          asChild
          className="h-10 w-fit rounded-full bg-[var(--em-blue-600)] px-5 text-[var(--em-ink-0)] hover:bg-[var(--em-blue-700)]"
        >
          <a href={href}>ไปดูทีละระบบ →</a>
        </Button>
      </CardContent>
    </Card>
  );
}

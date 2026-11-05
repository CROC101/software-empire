import type { NimbusFx } from "@empire/ui";
import { Briefcase, Home, LayoutGrid, UserRound } from "lucide-react";

// the four pages (a plain module: the server reads it too, a "use client" export would not be an array there)
// one link per page; each plays its own little scene when tapped
export const PAGES: { href: string; label: string; icon: React.ReactNode; fx: NimbusFx }[] = [
  { href: "/", label: "หน้าแรก", icon: <Home aria-hidden />, fx: "drop" },
  { href: "/work", label: "ผลงาน", icon: <LayoutGrid aria-hidden />, fx: "spin" },
  { href: "/services", label: "รับทำอะไร", icon: <Briefcase aria-hidden />, fx: "pop" },
  { href: "/about", label: "เกี่ยวกับ", icon: <UserRound aria-hidden />, fx: "wave" },
];

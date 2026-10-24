import { BrandMark, Button, GlassClock } from "@empire/ui";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getClaims } from "@/lib/supabase/server";
import { SubsystemGrid } from "../subsystem-grid";
import { signOut } from "./actions";

export const metadata: Metadata = { title: "แดชบอร์ด" };

export default async function DashboardPage() {
  // proxy.ts gates this route too; checking here keeps the page safe if the matcher changes
  const claims = await getClaims();
  if (!claims) redirect("/login?next=/dashboard");

  return (
    <div className="hub-aurora-backdrop min-h-dvh">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5 font-heading font-bold tracking-tight">
          <BrandMark />
          <span>Software Empire</span>
        </Link>
        <form action={signOut}>
          <Button type="submit" variant="outline" size="sm">
            ออกจากระบบ
          </Button>
        </form>
      </header>
      <main className="mx-auto flex max-w-6xl flex-col gap-8 px-4 pb-20 pt-6 sm:px-6">
        <div className="grid items-center gap-8 lg:grid-cols-[1fr_15rem]">
          <section className="relative overflow-hidden rounded-3xl bg-rail p-8 text-white shadow-glow sm:p-10">
            <div
              aria-hidden
              className="absolute -right-20 -top-28 size-80 rounded-full bg-aurora opacity-50 blur-3xl"
            />
            <p className="relative text-sm text-white/70">ยินดีต้อนรับกลับมา</p>
            <h1 className="relative mt-1 font-heading text-3xl font-extrabold tracking-tight">
              แดชบอร์ด
            </h1>
            <p className="relative mt-2 text-white/80">
              เข้าสู่ระบบเป็น <span className="font-medium text-white">{claims.email}</span>
            </p>
          </section>
          <GlassClock brand="crocwork" place="Bangkok" className="mx-auto w-56 lg:w-full" />
        </div>
        <SubsystemGrid />
      </main>
    </div>
  );
}

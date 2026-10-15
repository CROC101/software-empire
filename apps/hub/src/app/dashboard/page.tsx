import { Button } from "@empire/ui";
import type { Metadata } from "next";
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
    <main className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-12 sm:px-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">แดชบอร์ด</h1>
          <p className="text-muted-foreground">
            เข้าสู่ระบบเป็น <span className="font-medium text-foreground">{claims.email}</span>
          </p>
        </div>
        <form action={signOut}>
          <Button type="submit" variant="outline">
            ออกจากระบบ
          </Button>
        </form>
      </header>
      <SubsystemGrid />
    </main>
  );
}

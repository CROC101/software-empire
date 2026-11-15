import { BrandMark } from "@empire/ui";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AccountMenu } from "../account-menu";
import { ProfileForm } from "./profile-form";

export const metadata: Metadata = {
  title: "โปรไฟล์ของฉัน",
  robots: { index: false, follow: false },
};

const when = new Intl.DateTimeFormat("th-TH", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Bangkok",
});

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data) redirect("/login?next=/profile");
  const meta = data.claims.user_metadata as { name?: unknown } | undefined;
  const [{ data: profile }, { data: visits }] = await Promise.all([
    supabase.schema("hub").from("profiles").select("display_name, bio").maybeSingle(),
    supabase
      .schema("hub")
      .from("visits")
      .select("id, app, path, at")
      .order("at", { ascending: false })
      .limit(10),
  ]);

  return (
    <div className="hub-aurora-backdrop min-h-dvh">
      <header className="mx-auto flex max-w-3xl items-center justify-between px-4 py-5 sm:px-6">
        <Link
          href="/dashboard"
          className="flex items-center gap-2.5 font-heading font-bold tracking-tight"
        >
          <BrandMark />
          <span>Software Empire</span>
        </Link>
        <AccountMenu />
      </header>
      <main className="mx-auto grid max-w-3xl gap-6 px-4 pb-20 pt-6 sm:px-6">
        <div>
          <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground">
            ← แดชบอร์ด
          </Link>
          <h1 className="mt-2 font-heading text-3xl font-black">โปรไฟล์ของฉัน</h1>
          <p className="mt-1 text-muted-foreground">
            ชื่อนี้ขึ้นในทุกแอปของ crocwork · บัญชี{" "}
            <span className="font-medium text-foreground">{data.claims.email}</span>
          </p>
        </div>
        <section className="cw-glass rounded-2xl p-5 sm:p-6">
          <ProfileForm
            name={profile?.display_name ?? (typeof meta?.name === "string" ? meta.name : "")}
            bio={profile?.bio ?? ""}
          />
        </section>
        <section className="cw-glass rounded-2xl p-5 sm:p-6">
          <h2 className="font-heading text-lg font-bold">หน้าที่เปิดล่าสุด</h2>
          {visits && visits.length > 0 ? (
            <ul className="mt-3 divide-y text-sm">
              {visits.map((v) => (
                <li key={v.id} className="flex flex-wrap justify-between gap-x-4 gap-y-1 py-2">
                  <span className="min-w-0 truncate">
                    <span className="font-semibold">{v.app}</span> {v.path}
                  </span>
                  <time dateTime={v.at} className="text-muted-foreground">
                    {when.format(new Date(v.at))}
                  </time>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">ยังไม่มี</p>
          )}
        </section>
      </main>
    </div>
  );
}

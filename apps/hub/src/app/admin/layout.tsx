import { Button } from "@empire/ui";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { signOut } from "../dashboard/actions";
import { AdminTabs } from "./admin-tabs";
import { requireAdmin } from "./guard";

export const metadata: Metadata = {
  title: "หลังบ้าน",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: ReactNode }) {
  await requireAdmin("/admin");
  return (
    <div className="min-h-dvh bg-background">
      <header className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-5 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5 font-heading font-bold">
          <Image src="/crocwork-logo.webp" alt="" width={28} height={32} className="h-8 w-auto" />
          <span>crocwork</span>
        </Link>
        <div className="order-3 w-full sm:order-none sm:w-auto">
          <AdminTabs />
        </div>
        <form action={signOut}>
          <Button type="submit" variant="outline" size="sm">
            ออกจากระบบ
          </Button>
        </form>
      </header>
      {children}
    </div>
  );
}

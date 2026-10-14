import { Button } from "@empire/ui";
import Link from "next/link";
import { getClaims } from "@/lib/supabase/server";
import { SubsystemGrid } from "./subsystem-grid";

export default async function HomePage() {
  const claims = await getClaims();

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-12 px-4 py-16 sm:px-6">
      <section className="flex flex-col items-start gap-4">
        <p className="text-sm font-medium text-primary">Core Hub</p>
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Software Empire</h1>
        <p className="max-w-2xl text-lg text-muted-foreground">
          ระบบย่อย 7 ตัวที่ล็อกอินครั้งเดียวใช้ได้ทุกที่ ทำงานฝั่งเบราว์เซอร์เป็นหลัก
          และไม่มีค่าเซิร์ฟเวอร์
        </p>
        <Button asChild size="lg">
          <Link href={claims ? "/dashboard" : "/login"}>
            {claims ? "ไปที่แดชบอร์ด" : "เข้าสู่ระบบ"}
          </Link>
        </Button>
      </section>

      <section aria-labelledby="subsystems" className="flex flex-col gap-4">
        <h2 id="subsystems" className="text-xl font-semibold">
          ระบบย่อย
        </h2>
        <SubsystemGrid />
      </section>
    </main>
  );
}

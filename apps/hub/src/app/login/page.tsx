import { safeNext } from "@/lib/apps";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@empire/ui";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getClaims } from "@/lib/supabase/server";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "เข้าสู่ระบบ" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const params = await searchParams;
  const next = safeNext(params.next);
  if (await getClaims()) redirect(next);

  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-12">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>เข้าสู่ระบบ Software Empire</CardTitle>
          <CardDescription>บัญชีเดียวใช้ได้กับทุกระบบย่อย</CardDescription>
        </CardHeader>
        <CardContent>
          {params.error === "callback" && (
            <p role="alert" className="mb-4 text-sm text-destructive">
              ลิงก์ยืนยันใช้ไม่ได้หรือหมดอายุ ลองเข้าสู่ระบบอีกครั้ง
            </p>
          )}
          <LoginForm next={next} />
        </CardContent>
      </Card>
    </main>
  );
}

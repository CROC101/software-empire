import type { Metadata } from "next";
import { z } from "zod";
import { requireAdmin } from "../guard";
import { UsersTable } from "./users-table";

export const metadata: Metadata = { title: "ผู้ใช้ · หลังบ้าน" };

const rows = z.array(
  z.object({
    id: z.string(),
    email: z.string().nullable(),
    name: z.string().nullable(),
    created_at: z.string(),
    last_sign_in_at: z.string().nullable(),
    last_seen: z.string().nullable(),
    visits_30d: z.number(),
    banned: z.boolean(),
    admin: z.boolean(),
  }),
);

export default async function AdminUsersPage() {
  const supabase = await requireAdmin("/admin/users");
  const [{ data }, { data: claims }] = await Promise.all([
    supabase.schema("hub").rpc("admin_users"),
    supabase.auth.getClaims(),
  ]);
  const parsed = rows.safeParse(data);

  return (
    <main className="mx-auto grid max-w-6xl gap-6 px-4 pb-20 pt-4 sm:px-6">
      <div>
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">Users</p>
        <h1 className="mt-1 font-heading text-3xl font-black">ผู้ใช้ทั้งหมด</h1>
        <p className="mt-1 text-muted-foreground">
          ระงับแล้วเจ้าของบัญชีต่อเซสชันไม่ได้ ล็อกอินใหม่ไม่ได้จนกว่าจะปลด
        </p>
      </div>
      {parsed.success ? (
        <UsersTable rows={parsed.data} me={claims?.claims.sub ?? ""} />
      ) : (
        <p className="text-destructive">โหลดรายชื่อไม่สำเร็จ</p>
      )}
    </main>
  );
}

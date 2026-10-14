import { useEffect } from "react";
import { loadSupabase, useSession } from "../session";
import { readFavorites, replaceFavorites, setFavoritesRemote } from "./prefs";

/// ซิงก์รายการโปรดของผู้ใช้ที่ล็อกอินกับตาราง toolboxes.favorites (RLS: เห็นและแก้ได้เฉพาะของตัวเอง)
/// localStorage ยังเป็นสำเนาในเครื่องที่ตอบสนองทันที · ฐานข้อมูลคือความจริงเมื่อล็อกอิน
// shortcut: best-effort write-through without retry/offline queue; add one if sync errors show up in practice

const favorites = async () => (await loadSupabase()).schema("toolboxes").from("favorites");

/** Push favorites made while signed out, then adopt the server list (newest first). */
async function pull(local: string[]): Promise<string[]> {
  if (local.length > 0) {
    const { error } = await (
      await favorites()
    ).upsert(
      local.map((slug) => ({ slug })),
      { onConflict: "user_id,slug", ignoreDuplicates: true },
    );
    if (error) throw error;
  }
  const { data, error } = await (
    await favorites()
  )
    .select("slug")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data.map((row) => row.slug);
}

async function push(slug: string, on: boolean) {
  const table = await favorites();
  const { error } = on ? await table.insert({ slug }) : await table.delete().eq("slug", slug);
  if (error) throw error;
}

export function FavoritesSync() {
  const { user } = useSession();
  const userId = user?.id;

  useEffect(() => {
    if (!userId) return;
    let active = true;

    pull(readFavorites())
      .then((slugs) => {
        if (active) replaceFavorites(slugs);
      })
      .catch((error: unknown) => {
        console.error("โหลดรายการโปรดจากบัญชีไม่สำเร็จ", error);
      });
    setFavoritesRemote((slug, on) => {
      push(slug, on).catch((error: unknown) => {
        console.error("บันทึกรายการโปรดไม่สำเร็จ", error);
      });
    });

    return () => {
      active = false;
      setFavoritesRemote(null);
    };
  }, [userId]);

  return null;
}

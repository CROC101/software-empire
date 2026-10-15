/// ไบต์ของไฟล์อยู่ใน Supabase Storage (bucket ส่วนตัว `community-<bucket>`) — อ่านได้ผ่าน signed URL เท่านั้น
/// สิทธิ์อ่าน/เขียน/ลบตัดสินโดย policy ของ storage.objects ที่เรียกฟังก์ชัน SQL ของ community
import { supabase } from "@/lib/supabase";
import { ApiError } from "./api-core";

export type AssetBucket = "attachments" | "reels";

export const bucketOf = (name: string) => supabase.storage.from(`community-${name}`);

export const storageFailed = () =>
  new ApiError(502, "STORAGE_ERROR", "ที่เก็บไฟล์ไม่ตอบสนอง กรุณาลองใหม่อีกครั้ง");

/** Signed read URLs for many paths of one bucket in one request; paths you may not read are left out. */
export async function signedUrls(
  bucket: AssetBucket,
  paths: string[],
  ttlSeconds: number,
): Promise<Map<string, string>> {
  if (paths.length === 0) return new Map();
  const { data: rows, error } = await bucketOf(bucket).createSignedUrls(paths, ttlSeconds);
  if (error) throw storageFailed();
  return new Map(
    rows.flatMap((row) => (row.path && row.signedUrl ? [[row.path, row.signedUrl]] : [])),
  );
}

/**
 * Removes bytes whose rows the SQL already deleted (both buckets: removing a missing path is a no-op).
 * shortcut: best effort — a failed request leaves bytes no row points at; sweep them with a
 * service-role job if storage use ever creeps up.
 */
export async function purge(paths: (string | null | undefined)[]): Promise<void> {
  const live = paths.filter((path): path is string => Boolean(path));
  if (live.length === 0) return;
  await Promise.allSettled([bucketOf("attachments").remove(live), bucketOf("reels").remove(live)]);
}

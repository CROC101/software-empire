import { useProfile } from "@/components/base/user-name";
import { describeAction } from "@/lib/backend/notifications";
import type { Notification } from "@/lib/backend/types";

/// "<ชื่อคนทำ> <ทำอะไร>" — ชื่อมาจากโปรไฟล์ (ไม่ใช่ UUID) · ไม่มีคนทำ = แจ้งเตือนจากระบบ
export function NotificationText({ item }: { item: Notification }) {
  const actor = item.actorCoreUserId;
  const profile = useProfile(actor ?? "");
  return (
    <>
      {actor ? <span className="font-semibold">{profile.displayName}</span> : "มีคน"}{" "}
      {describeAction(item)}
    </>
  );
}

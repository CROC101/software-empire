/// ใครออนไลน์อยู่ — เติมโดย socket.ts จาก Supabase Realtime Presence (หัวข้อ "online")
/// คนที่ปิด "แสดงสถานะกิจกรรม" ไม่ประกาศตัวเอง จึงไม่อยู่ในชุดนี้

const online = new Set<string>();

export function setOnline(userIds: Iterable<string>) {
  online.clear();
  for (const id of userIds) online.add(id);
}

export function isOnline(userId: string): boolean {
  return online.has(userId);
}

export function onlineUserIds(): string[] {
  return [...online];
}

/// ทางเชื่อมจากชั้น REST (chat-api) ไปยัง socket โดยไม่ import กันเป็นวง
/// socket.ts ลงทะเบียนตัวส่งตอนเชื่อมต่อ — ยังไม่เชื่อมก็แค่ไม่มีใครได้ยิน (ข้อมูลในฐานถูกต้องอยู่แล้ว)

type ReactionAnnouncer = (channelId: string, targetId: string) => void;

let announceReaction: ReactionAnnouncer | null = null;

export function onReactionAnnounce(fn: ReactionAnnouncer | null) {
  announceReaction = fn;
}

export function reactionChanged(channelId: string, targetId: string) {
  announceReaction?.(channelId, targetId);
}

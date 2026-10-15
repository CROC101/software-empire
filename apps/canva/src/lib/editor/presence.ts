import { create } from "zustand";

/// ผู้ร่วมงานแบบสด (เคอร์เซอร์พร้อมชื่อ) — csmju-canvas ใช้ socket.io ของหลังบ้าน NestJS ซึ่ง Empire ไม่มี
/// เก็บ store และชนิดข้อมูลเดิมไว้ให้ UI ทำงานต่อได้ แต่ไม่เชื่อมต่อจริง (status คงเป็น 'off')
// shortcut: presence is disabled; rebuild on Supabase Realtime Presence channels per design when sharing ships

export interface Peer {
  peerId: string;
  label: string;
  nickname: string | null;
  color: string;
  canEdit: boolean;
}

export interface PeerCursor {
  x: number;
  y: number;
  pageIndex: number;
  at: number;
}

export type PresenceStatus = "off" | "connecting" | "live" | "error";

interface PresenceState {
  status: PresenceStatus;
  error: string | null;
  websocket: boolean;
  self: Peer | null;
  peers: Record<string, Peer>;
  cursors: Record<string, PeerCursor>;
  selections: Record<string, string[]>;
  savedBy: Peer | null;
  enabled: boolean;
  nickname: string;
  setEnabled(enabled: boolean): void;
  setNickname(nickname: string): void;
  dismissSaved(): void;
}

export const CURSOR_IDLE_MS = 20_000;

export const usePresence = create<PresenceState>((set) => ({
  status: "off",
  error: null,
  websocket: false,
  self: null,
  peers: {},
  cursors: {},
  selections: {},
  savedBy: null,
  enabled: false,
  nickname: "",
  setEnabled: () => {
    // nothing to connect to yet
  },
  setNickname: (nickname) => {
    set({ nickname });
  },
  dismissSaved: () => {
    set({ savedBy: null });
  },
}));

export function peerName(p: Peer | null | undefined): string {
  if (!p) return "";

  return p.nickname ? `${p.nickname} (${p.label})` : p.label;
}

export function connectPresence(_designId: string): () => void {
  return () => undefined;
}

export function disconnectPresence() {
  // not connected
}

export function sendCursor(_point: { x: number; y: number } | null, _pageIndex: number) {
  // not connected
}

export function sendSelection(_ids: string[]) {
  // not connected
}

export function announceSaved() {
  // no peers to tell
}

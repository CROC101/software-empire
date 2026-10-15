/// ช่องสื่อสารสด — csmju-nexus ใช้ socket.io ของหลังบ้าน NestJS ซึ่ง Empire ไม่มี
///
/// เก็บ API เดิมทุกตัว (connectSocket · bindSocket · emitWithAck · rooms) ให้หน้าจอเดิมไม่ต้องแก้
/// `Socket` ตรงนี้เป็นตัวกระจาย event ในเบราว์เซอร์ที่หน้าตาเหมือน socket.io (on · off · emit)
// shortcut: round 1 stub — every emit acks "not available" and no server events arrive.
// Round 2 feeds events from Supabase Realtime (postgres_changes + broadcast) into this emitter.

type Listener = (...args: unknown[]) => void;

export class Socket {
  private listeners = new Map<string, Set<Listener>>();
  readonly connected = true;

  on(event: string, listener: Listener): this {
    let set = this.listeners.get(event);
    if (!set) {
      set = new Set();
      this.listeners.set(event, set);
    }
    set.add(listener);
    return this;
  }

  off(event: string, listener?: Listener): this {
    if (listener) this.listeners.get(event)?.delete(listener);
    else this.listeners.delete(event);
    return this;
  }

  /** Server → client: deliver an event to every listener. */
  dispatch(event: string, payload: unknown) {
    for (const listener of this.listeners.get(event) ?? []) listener(payload);
  }

  /** Client → server. The last argument may be an ack callback, like socket.io. */
  emit(event: string, ...args: unknown[]): this {
    const ack = args.at(-1);
    if (typeof ack === "function") {
      queueMicrotask(() => {
        (ack as (result: unknown) => void)({ ok: false, error: `ยังไม่เปิดใช้ (${event})` });
      });
    }
    return this;
  }
}

export type SocketStatus = "connecting" | "connected" | "reconnecting" | "offline";

let socket: Socket | null = null;
let status: SocketStatus = "offline";
const statusHandlers = new Set<(status: SocketStatus) => void>();
const reconnectHandlers = new Set<() => void>();
const rooms = new Set<string>();

function setStatus(next: SocketStatus) {
  status = next;
  for (const handler of statusHandlers) handler(next);
}

export function getSocketStatus(): SocketStatus {
  return status;
}

export function onSocketStatus(handler: (status: SocketStatus) => void) {
  statusHandlers.add(handler);
  return () => {
    statusHandlers.delete(handler);
  };
}

export function onSocketReconnect(handler: () => void) {
  reconnectHandlers.add(handler);
  return () => {
    reconnectHandlers.delete(handler);
  };
}

export function rememberRoom(channelId: string) {
  rooms.add(channelId);
}

export function forgetRoom(channelId: string) {
  rooms.delete(channelId);
}

export function connectSocket(): Promise<Socket> {
  if (!socket) {
    socket = new Socket();
    setStatus("connected");
  }
  return Promise.resolve(socket);
}

export function currentSocket(): Socket | null {
  return socket;
}

export function disconnectSocket(): void {
  socket = null;
  rooms.clear();
  setStatus("offline");
}

export function bindSocket<T = unknown>(
  target: Socket,
  event: string,
  handler: (payload: T) => void | Promise<void>,
): () => void {
  const listener = (payload: unknown) => {
    Promise.resolve(handler(payload as T)).catch((error: unknown) => {
      console.error(`ทำงานกับ event ${event} ไม่สำเร็จ`, error);
    });
  };
  target.on(event, listener);
  return () => {
    target.off(event, listener);
  };
}

export function emitWithAck<T>(
  target: Socket,
  event: string,
  payload: unknown,
  timeoutMs = 8000,
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`ไม่ได้รับการตอบกลับจาก ${event}`));
    }, timeoutMs);

    target.emit(event, payload, (result: T) => {
      clearTimeout(timer);
      resolve(result);
    });
  });
}

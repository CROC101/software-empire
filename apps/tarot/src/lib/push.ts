import { z } from "zod";
import { loadSupabase } from "./session";
import { VAPID_PUBLIC_KEY } from "./vapid-public";
import { b64url } from "./vapid";

export type PushState = "unsupported" | "denied" | "off" | "on";

export const pushSupported = () =>
  "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;

async function registration() {
  return navigator.serviceWorker.register("/sw.js");
}

export async function pushState(): Promise<PushState> {
  if (!pushSupported()) return "unsupported";
  if (Notification.permission === "denied") return "denied";
  const sub = await (await registration()).pushManager.getSubscription();
  return sub ? "on" : "off";
}

const keys = z.object({
  endpoint: z.url(),
  keys: z.object({ p256dh: z.string(), auth: z.string() }),
});

/** Ask permission, subscribe this browser, and keep it in tarot.push_subscriptions. */
export async function enablePush(): Promise<PushState> {
  if ((await Notification.requestPermission()) !== "granted") return "denied";
  const reg = await registration();
  const sub = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: b64url.decode(VAPID_PUBLIC_KEY),
  });
  const { endpoint, keys: k } = keys.parse(sub.toJSON());
  const { error } = await (
    await loadSupabase()
  )
    .schema("tarot")
    .rpc("save_push", { push_endpoint: endpoint, push_p256dh: k.p256dh, push_auth: k.auth });
  if (error) {
    await sub.unsubscribe();
    throw error;
  }
  return "on";
}

export async function disablePush(): Promise<PushState> {
  const sub = await (await registration()).pushManager.getSubscription();
  if (sub) {
    await (await loadSupabase()).schema("tarot").rpc("drop_push", { push_endpoint: sub.endpoint });
    await sub.unsubscribe();
  }
  return "off";
}

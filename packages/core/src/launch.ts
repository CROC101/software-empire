import { z } from "zod";

/**
 * The launch time and every app's switch live in the database (hub.settings, hub.apps), set by
 * admins at hub /admin/system. This constant is only the fallback while the database cannot be
 * reached. 1 มกราคม 2570, midnight Thai time.
 */
export const LAUNCH_AT = Date.parse("2027-01-01T00:00:00+07:00");

export const launched = (now = Date.now()) => now >= LAUNCH_AT;

/** The hub answers this for any app: 204 = let them in, 403 = { location } to send them to. */
export const GATE_PATH = "/api/gate";

/** What hub.gate(app) returns; parsed because it crosses the network. */
export const gateAnswer = z.object({
  verdict: z.enum(["open", "soon", "closed", "login", "mfa"]),
  message: z.string(),
  status: z.enum(["open", "maintenance", "off"]),
  launch_at: z.string(),
});
export type GateAnswer = z.infer<typeof gateAnswer>;

/** Database down: the old fixed date decides, and nobody is asked to sign in. */
export const fallbackAnswer = (now = Date.now()): GateAnswer => ({
  verdict: launched(now) ? "open" : "soon",
  message: "",
  status: "open",
  launch_at: new Date(LAUNCH_AT).toISOString(),
});

/**
 * Where the hub sends someone the gate stopped; null = let them in. `next` is the address they
 * asked for, so signing in brings them back to it.
 */
export function gateTarget(
  verdict: GateAnswer["verdict"],
  hub: string,
  app: string,
  next: string,
): string | null {
  const base = hub.replace(/\/$/, "");
  switch (verdict) {
    case "open":
      return null;
    case "soon":
      return `${base}/`;
    case "closed":
      return `${base}/closed?app=${encodeURIComponent(app)}`;
    case "login":
      return `${base}/login?next=${encodeURIComponent(next)}`;
    case "mfa":
      return `${base}/mfa?next=${encodeURIComponent(next)}`;
  }
}

type GateClient = {
  schema: (name: "hub") => {
    rpc: (fn: "gate", args: { app: string }) => PromiseLike<{ data: unknown; error: unknown }>;
  };
};

/** One call per page: hub.gate(app) for the current session, or the fallback if it fails. */
export async function readGate(supabase: GateClient, app: string): Promise<GateAnswer> {
  const { data, error } = await supabase.schema("hub").rpc("gate", { app });
  const parsed = gateAnswer.safeParse(data);
  return !error && parsed.success ? parsed.data : fallbackAnswer();
}

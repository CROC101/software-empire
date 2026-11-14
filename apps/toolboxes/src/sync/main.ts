/**
 * Cloud save for every app in toolboxes (/craft/*, /apps/*). Signed in at the hub, what the apps keep
 * in this browser goes to the account (bucket toolboxes-sync + table toolboxes.sync_items, owner only),
 * and opens on any other device. Signed out, this does nothing and nothing leaves the browser.
 *
 * App pages only upload. Downloads are written on toolboxes' own pages, and only while no app page is
 * open (each app page holds a shared Web Lock), because an app cannot see its database replaced under it.
 */
import { sha256 } from "./codec";
import { plan } from "./plan";
import { readAll, validPath, write } from "./store";

const BUCKET = "toolboxes-sync";
const APP_LOCK = "crocwork-app-open";
const isApp = /^\/(craft|apps)\//.test(location.pathname);

const signedIn = () => /(?:^|;\s*)sb-[^=]*-auth-token(?:\.0)?=/.test(document.cookie);

const markerKey = (uid: string) => `crocwork-sync:v1:${uid}`;
function readMarker(uid: string): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(markerKey(uid)) ?? "{}") as Record<string, string>;
  } catch {
    return {};
  }
}

let busy = false;

async function sync(pull: boolean) {
  if (busy || !signedIn()) return;
  busy = true;
  try {
    // the client alone: this file also runs inside app pages, which have no React
    const { supabase } = await import("@/lib/supabase");
    // getClaims checks the JWT signature; the user id names the folder RLS lets us into
    const { data } = await supabase.auth.getClaims();
    const uid = data?.claims.sub;
    if (!uid) return;
    const items = supabase.schema("toolboxes").from("sync_items");
    const bucket = supabase.storage.from(BUCKET);

    const { data: rows, error } = await items.select("path, sha256");
    if (error) throw error;
    const remote = new Map(rows.map((r) => [r.path, r.sha256]));
    const bytes = await readAll();
    const local = new Map<string, string>();
    for (const [p, b] of bytes) local.set(p, await sha256(b));

    const marker = readMarker(uid);
    const save = () => {
      localStorage.setItem(markerKey(uid), JSON.stringify(marker));
    };
    let pulled = 0;
    for (const a of plan(local, remote, marker)) {
      if (a.kind === "mark") marker[a.path] = a.sha;
      else if (a.kind === "push") {
        const body = bytes.get(a.path);
        if (!body) continue;
        // content-addressed: the same bytes are stored once, and storage names cannot hold "%"
        const up = await bucket.upload(`${uid}/${a.sha}`, new Blob([body as BlobPart]), {
          contentType: "application/octet-stream",
          upsert: true,
        });
        if (up.error) throw up.error;
        const row = await items.upsert({
          path: a.path,
          sha256: a.sha,
          size_bytes: body.length,
          updated_at: new Date().toISOString(),
        });
        if (row.error) throw row.error;
        marker[a.path] = a.sha;
        const shared = [...remote].some(([p, s]) => p !== a.path && s === a.replaces);
        if (a.replaces && !a.keepOld && !shared) await bucket.remove([`${uid}/${a.replaces}`]);
      } else if (pull && validPath(a.path)) {
        const down = await bucket.download(`${uid}/${a.sha}`);
        if (down.error) throw down.error;
        const got = new Uint8Array(await down.data.arrayBuffer());
        if ((await sha256(got)) !== a.sha) throw new Error(`sync: ${a.path} arrived damaged`);
        await write(a.path, got);
        marker[a.path] = a.sha;
        pulled++;
      }
      save();
    }
    save();
    if (pulled) console.info(`sync: brought ${String(pulled)} saved item(s) from your account`);
  } catch (error) {
    console.warn("sync: will try again later", error);
  } finally {
    busy = false;
  }
}

function start() {
  if (!signedIn()) return;
  if (isApp) {
    // hold the lock for the page's whole life: toolboxes will not replace data under an open app
    void navigator.locks?.request(APP_LOCK, { mode: "shared" }, () => new Promise<never>(() => {}));
    void sync(false);
  } else if (navigator.locks)
    void navigator.locks.request(APP_LOCK, { mode: "exclusive", ifAvailable: true }, (lock) =>
      lock ? sync(true) : sync(false),
    );
  else void sync(false);

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") void sync(false);
  });
  setInterval(() => void sync(false), 5 * 60_000);
}

start();

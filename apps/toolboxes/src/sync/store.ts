/**
 * Reads and writes what the apps keep in this origin's browser storage: every IndexedDB database
 * (as one snapshot file each) and every OPFS file. Paths: idb/<db>, opfs/<dir>/<file>.
 */
import { decode, encode } from "./codec";

export const MAX_BYTES = 50 * 1024 * 1024; // the bucket's limit per object
const SKIP_DB = /^crocwork-sync/;

/** URI-encodes one path part the way the sync_items.path check allows (no bare "." or ".."). */
export const part = (s: string) =>
  encodeURIComponent(s).replace(/^\.+$/, (d) => "%2E".repeat(d.length));
const unpart = decodeURIComponent;
export const validPath = (p: string) => {
  const parts = p.split("/");
  return (
    p.length <= 1024 &&
    parts.length <= 17 &&
    (parts[0] === "idb" || parts[0] === "opfs") &&
    parts
      .slice(1)
      .every(
        (s) =>
          s.length >= 1 &&
          s.length <= 255 &&
          /^[A-Za-z0-9%._~!*'()-]+$/.test(s) &&
          !/^\.+$/.test(s),
      )
  );
};

const req = <T>(r: IDBRequest<T>) =>
  new Promise<T>((ok, fail) => {
    r.onsuccess = () => ok(r.result);
    r.onerror = () => fail(r.error ?? new Error("IndexedDB request failed"));
  });

type Snapshot = {
  v: 1;
  version: number;
  stores: {
    name: string;
    keyPath: string | string[] | null;
    autoIncrement: boolean;
    indexes: { name: string; keyPath: string | string[]; unique: boolean; multiEntry: boolean }[];
    keys: IDBValidKey[];
    values: unknown[];
  }[];
};

async function readDb(name: string): Promise<Uint8Array | undefined> {
  const db = await req(indexedDB.open(name));
  try {
    const names = [...db.objectStoreNames];
    const snap: Snapshot = { v: 1, version: db.version, stores: [] };
    if (names.length) {
      const tx = db.transaction(names, "readonly");
      for (const n of names) {
        const s = tx.objectStore(n);
        // getAll and getAllKeys in one transaction come back in the same key order
        const [keys, values] = await Promise.all([req(s.getAllKeys()), req(s.getAll())]);
        snap.stores.push({
          name: n,
          keyPath: s.keyPath,
          autoIncrement: s.autoIncrement,
          indexes: [...s.indexNames].map((i) => {
            const x = s.index(i);
            return { name: i, keyPath: x.keyPath, unique: x.unique, multiEntry: x.multiEntry };
          }),
          keys,
          values,
        });
      }
    }
    const bytes = await encode(snap);
    // shortcut: the whole database is encoded before its size is known; stream it if apps grow past ~50 MB
    return bytes.length <= MAX_BYTES ? bytes : undefined;
  } catch (error) {
    // values that cannot leave the browser (file handles…) keep that database local only
    console.warn(`sync: ${name} stays on this device`, error);
    return undefined;
  } finally {
    db.close();
  }
}

/** Replaces a database with a snapshot. Gives up (and leaves it as it is) if a page has it open. */
async function writeDb(name: string, bytes: Uint8Array) {
  const snap = decode(bytes) as Snapshot;
  const existing = (await indexedDB.databases()).find((d) => d.name === name);
  // an app opens its database at its own version: the copy must come back at exactly that version
  if (existing?.version !== undefined && existing.version >= snap.version) {
    const del = indexedDB.deleteDatabase(name);
    let blocked = false;
    del.onblocked = () => {
      blocked = true;
    };
    await req(del);
    if (blocked) console.warn(`sync: ${name} was open in another tab while it was replaced`);
  }
  const open = indexedDB.open(name, snap.version);
  let blocked = false;
  open.onblocked = () => {
    blocked = true;
  };
  open.onupgradeneeded = () => {
    const tx = open.transaction;
    if (!tx) return;
    // another page still has the old version open: leave everything as it is
    if (blocked) {
      tx.abort();
      return;
    }
    const db = open.result;
    for (const n of [...db.objectStoreNames]) db.deleteObjectStore(n);
    for (const s of snap.stores) {
      const store = db.createObjectStore(s.name, {
        keyPath: s.keyPath ?? undefined,
        autoIncrement: s.autoIncrement,
      });
      for (const i of s.indexes)
        store.createIndex(i.name, i.keyPath, { unique: i.unique, multiEntry: i.multiEntry });
      s.values.forEach((v, k) => (s.keyPath === null ? store.put(v, s.keys[k]) : store.put(v)));
    }
  };
  (await req(open)).close();
}

async function* walk(
  dir: FileSystemDirectoryHandle,
  at: string[],
): AsyncGenerator<[string[], FileSystemFileHandle]> {
  for await (const [name, h] of dir.entries() as AsyncIterable<[string, FileSystemHandle]>) {
    if (h.kind === "file") yield [[...at, name], h as FileSystemFileHandle];
    else yield* walk(h as FileSystemDirectoryHandle, [...at, name]);
  }
}

async function opfsRoot() {
  try {
    return await navigator.storage.getDirectory();
  } catch {
    return undefined; // no OPFS (older Safari, private windows)
  }
}

/** Everything saved in this origin, as path → bytes. */
export async function readAll(): Promise<Map<string, Uint8Array>> {
  const out = new Map<string, Uint8Array>();
  for (const { name } of await indexedDB.databases()) {
    if (!name || SKIP_DB.test(name)) continue;
    const path = `idb/${part(name)}`;
    if (!validPath(path)) continue;
    const bytes = await readDb(name);
    if (bytes) out.set(path, bytes);
  }
  const root = await opfsRoot();
  if (root)
    for await (const [parts, h] of walk(root, [])) {
      const path = `opfs/${parts.map(part).join("/")}`;
      if (!validPath(path)) continue;
      try {
        const file = await h.getFile();
        if (file.size <= MAX_BYTES) out.set(path, new Uint8Array(await file.arrayBuffer()));
      } catch {
        // a worker holds the file open for writing: next time
      }
    }
  return out;
}

export async function write(path: string, bytes: Uint8Array) {
  const [kind, ...parts] = path.split("/").map((s, i) => (i ? unpart(s) : s));
  if (kind === "idb" && parts[0]) return writeDb(parts[0], bytes);
  const root = await opfsRoot();
  const file = parts.pop();
  if (kind !== "opfs" || !root || !file) return;
  let dir = root;
  for (const p of parts) dir = await dir.getDirectoryHandle(p, { create: true });
  const w = await (await dir.getFileHandle(file, { create: true })).createWritable();
  await w.write(bytes as BufferSource);
  await w.close();
}

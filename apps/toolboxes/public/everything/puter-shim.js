/* global window, document, location, indexedDB, Blob, File, URL, console */
// crocwork: stands in for https://js.puter.com/v2/ so the Everything apps run without a Puter
// account and keep their data in this browser (IndexedDB, one database per app).
// shortcut: cloud-only parts (ai, email, workers, peer, hosting) reject; wire them to our Workers
// when an app needs them.
(() => {
  const app = location.pathname.split("/")[2] || "app"; // /everything/<app>/...
  // shared crocwork theme cookie wins over the app's own saved theme
  const theme = /(?:^|; )em-theme=(light|dark)/.exec(document.cookie)?.[1];
  if (theme) document.documentElement.dataset.theme = theme;
  const db = new Promise((ok, fail) => {
    const req = indexedDB.open(`everything-${app}`, 1);
    req.onupgradeneeded = () => {
      req.result.createObjectStore("kv");
      req.result.createObjectStore("fs");
    };
    req.onsuccess = () => ok(req.result);
    req.onerror = () => fail(req.error);
  });
  const run = async (store, mode, fn) => {
    const t = (await db).transaction(store, mode);
    const req = fn(t.objectStore(store));
    return new Promise((ok, fail) => {
      t.oncomplete = () => ok(req?.result);
      t.onerror = () => fail(t.error);
      t.onabort = () => fail(t.error);
    });
  };
  const all = async (store) => {
    const [keys, values] = await Promise.all([
      run(store, "readonly", (s) => s.getAllKeys()),
      run(store, "readonly", (s) => s.getAll()),
    ]);
    return keys.map((key, i) => [key, values[i]]);
  };
  const missing = (path) =>
    Object.assign(new Error(`${path} does not exist`), { code: "subject_does_not_exist" });
  const unsupported = (what) => () =>
    Promise.reject(
      Object.assign(new Error(`${what} is not available here`), { code: "unsupported" }),
    );

  // paths: "~/a//b/" and "a/b" are the same file
  const norm = (p) =>
    String(p?.path ?? p)
      .replace(/^~\/?/, "")
      .replace(/\/+/g, "/")
      .replace(/^\/|\/$/g, "");
  const name = (p) => p.split("/").pop();
  const meta = (path, file) => ({
    id: path,
    uid: path,
    name: name(path),
    path: `/${path}`,
    is_dir: !file,
    size: file?.blob.size ?? 0,
    type: file?.blob.type ?? null,
    modified: file?.modified ?? 0,
    created: file?.modified ?? 0,
  });
  const toBlob = (data) =>
    data instanceof Blob
      ? data
      : new Blob([data ?? ""], { type: typeof data === "string" ? "text/plain" : "" });
  const children = async (dir) => {
    const prefix = dir ? `${dir}/` : "";
    const seen = new Map();
    for (const [path, file] of await all("fs")) {
      if (!path.startsWith(prefix)) continue;
      const [head, ...rest] = path.slice(prefix.length).split("/");
      seen.set(head, rest.length ? meta(prefix + head) : meta(path, file));
    }
    return [...seen.values()];
  };

  const fs = {
    async write(path, data) {
      if (path instanceof File && data === undefined) [path, data] = [path.name, path];
      const key = norm(path);
      const file = { blob: toBlob(data), modified: Date.now() };
      await run("fs", "readwrite", (s) => s.put(file, key));
      return meta(key, file);
    },
    async read(path) {
      const file = await run("fs", "readonly", (s) => s.get(norm(path)));
      if (!file) throw missing(path);
      return file.blob;
    },
    async delete(paths) {
      for (const p of [paths].flat()) {
        const key = norm(p);
        const inside = (await all("fs")).filter(([k]) => k.startsWith(`${key}/`)).map(([k]) => k);
        await run("fs", "readwrite", (s) => [key, ...inside].forEach((k) => s.delete(k)));
      }
      return true;
    },
    async stat(path) {
      const key = norm(path);
      const file = await run("fs", "readonly", (s) => s.get(key));
      if (file) return meta(key, file);
      if ((await children(key)).length) return meta(key);
      throw missing(path);
    },
    readdir: async (path) => children(norm(path)),
    mkdir: async (path) => meta(norm(path)),
    async getReadURL(path) {
      return URL.createObjectURL(await fs.read(path));
    },
    space: async () => ({ capacity: 1024 ** 3, used: 0 }),
  };

  const glob = (pattern) =>
    new RegExp(
      `^${String(pattern)
        .replace(/[.+?^${}()|[\]\\]/g, "\\$&")
        .replace(/\*/g, ".*")}$`,
    );
  const kv = {
    MAX_KEY_SIZE: 1024,
    MAX_VALUE_SIZE: 400 * 1024,
    async set(key, value) {
      await run("kv", "readwrite", (s) => s.put(value, String(key)));
      return true;
    },
    get: async (key) => (await run("kv", "readonly", (s) => s.get(String(key)))) ?? null,
    async del(key) {
      await run("kv", "readwrite", (s) => s.delete(String(key)));
      return true;
    },
    async list(pattern, returnValues) {
      if (typeof pattern === "boolean") [pattern, returnValues] = ["*", pattern];
      const match = glob(pattern ?? "*");
      const rows = (await all("kv")).filter(([k]) => match.test(k));
      return returnValues ? rows.map(([key, value]) => ({ key, value })) : rows.map(([k]) => k);
    },
    // append to the list at key, return the whole list: one transaction, so concurrent adds
    // keep their order and cap-table's compare-and-set sees a single winner
    async add(key, items) {
      let list;
      await run("kv", "readwrite", (s) => {
        const req = s.get(String(key));
        req.onsuccess = () => {
          list = [...(Array.isArray(req.result) ? req.result : []), ...[items].flat()];
          s.put(list, String(key));
        };
      });
      return list;
    },
    async incr(key, amount = 1) {
      const next = Number((await kv.get(key)) ?? 0) + amount;
      await kv.set(key, next);
      return next;
    },
    decr: (key, amount = 1) => kv.incr(key, -amount),
    async flush() {
      await run("kv", "readwrite", (s) => s.clear());
      return true;
    },
  };
  kv.MAX = kv.MAX_VALUE_SIZE;

  const user = {
    username: "me",
    uuid: "local",
    email: null,
    email_confirmed: false,
    is_temp: false,
  };
  window.puter = {
    env: "web",
    appID: app,
    authToken: null,
    isSignedIn: () => true,
    auth: {
      isSignedIn: () => true,
      signIn: async () => user,
      signOut: async () => {},
      getUser: async () => user,
      getProfilePicture: async () => null,
    },
    fs,
    kv,
    ai: { chat: unsupported("AI") },
    email: { send: unsupported("Email") },
    workers: {
      exec: unsupported("Workers"),
      create: unsupported("Workers"),
      delete: unsupported("Workers"),
    },
    hosting: { create: unsupported("Hosting") },
    peer: {
      serve: unsupported("Peer"),
      connect: unsupported("Peer"),
      ensureTurnRelays: unsupported("Peer"),
    },
    perms: { request: async () => false },
    ui: {},
    print: (...a) => console.log(...a),
    randName: () => Math.random().toString(36).slice(2, 10),
  };
})();

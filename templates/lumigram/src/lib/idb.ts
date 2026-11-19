// Uploaded photos/videos live in IndexedDB (localStorage is too small for them).
import { useEffect, useState } from 'react';

const DB = 'lumigram-media';
const STORE = 'files';

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function putFile(blob: Blob): Promise<string> {
  const key = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
  const db = await open();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(blob, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  urlCache.set(`idb:${key}`, URL.createObjectURL(blob));
  return `idb:${key}`;
}

const urlCache = new Map<string, string>();

async function getUrl(src: string): Promise<string | undefined> {
  const hit = urlCache.get(src);
  if (hit) return hit;
  const db = await open();
  const blob = await new Promise<Blob | undefined>((resolve, reject) => {
    const req = db.transaction(STORE).objectStore(STORE).get(src.slice(4));
    req.onsuccess = () => resolve(req.result as Blob | undefined);
    req.onerror = () => reject(req.error);
  });
  if (!blob) return undefined;
  const url = URL.createObjectURL(blob);
  urlCache.set(src, url);
  return url;
}

/** Resolves `idb:` sources to object URLs; other sources pass through. */
export function useMediaUrl(src: string): string | undefined {
  const [url, setUrl] = useState(() => (src.startsWith('idb:') ? urlCache.get(src) : src));
  useEffect(() => {
    if (!src.startsWith('idb:')) return setUrl(src);
    let live = true;
    getUrl(src).then((u) => live && setUrl(u)).catch(() => live && setUrl(undefined));
    return () => {
      live = false;
    };
  }, [src]);
  return url;
}

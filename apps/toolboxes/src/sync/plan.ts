/**
 * What to do with each saved item, given this device's copy, the account's copy and what the two
 * were the last time this device synced (`marker`). Items are IndexedDB databases or OPFS files,
 * named by `path` (idb/<db>, opfs/<dir>/<file>) and compared by the SHA-256 of their bytes.
 *
 * - only this device changed it            → push
 * - only the account changed it            → pull
 * - this device never synced it, account has it → pull: an app opened on a new device makes an
 *   empty database first, and pushing that would wipe the work saved from the other device
 * - both changed since the last sync       → push (this device wins) and keep the account's old
 *   bytes in the bucket, so the overwritten work can still be recovered
 *   shortcut: no merge and no "which copy?" prompt; add one if people lose work this way
 */
export type Action =
  | { kind: "push"; path: string; sha: string; replaces?: string; keepOld: boolean }
  | { kind: "pull"; path: string; sha: string }
  | { kind: "mark"; path: string; sha: string };

export function plan(
  local: ReadonlyMap<string, string>,
  remote: ReadonlyMap<string, string>,
  marker: Readonly<Record<string, string>>,
): Action[] {
  const actions: Action[] = [];
  for (const path of new Set([...local.keys(), ...remote.keys()])) {
    const mine = local.get(path);
    const theirs = remote.get(path);
    const last = marker[path];
    if (mine === theirs) {
      if (mine && last !== mine) actions.push({ kind: "mark", path, sha: mine });
      continue;
    }
    if (!theirs) {
      if (mine && last !== mine) actions.push({ kind: "push", path, sha: mine, keepOld: false });
      continue;
    }
    const iChanged = mine !== undefined && last !== undefined && mine !== last;
    const theyChanged = last !== theirs;
    if (iChanged && mine)
      actions.push({ kind: "push", path, sha: mine, replaces: theirs, keepOld: theyChanged });
    else if (theyChanged) actions.push({ kind: "pull", path, sha: theirs });
  }
  return actions;
}

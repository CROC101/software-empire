// @vitest-environment node
import { describe, expect, it } from "vitest";
import { plan } from "./plan";

const m = (o: Record<string, string>) => new Map(Object.entries(o));

describe("sync plan", () => {
  it("pushes new and changed local work", () => {
    expect(plan(m({ "idb/a": "1" }), m({}), {})).toEqual([
      { kind: "push", path: "idb/a", sha: "1", keepOld: false },
    ]);
    expect(plan(m({ "idb/a": "2" }), m({ "idb/a": "1" }), { "idb/a": "1" })).toEqual([
      { kind: "push", path: "idb/a", sha: "2", replaces: "1", keepOld: false },
    ]);
  });

  it("pulls what another device saved", () => {
    expect(plan(m({ "idb/a": "1" }), m({ "idb/a": "2" }), { "idb/a": "1" })).toEqual([
      { kind: "pull", path: "idb/a", sha: "2" },
    ]);
    expect(plan(m({}), m({ "opfs/x": "9" }), {})).toEqual([
      { kind: "pull", path: "opfs/x", sha: "9" },
    ]);
  });

  it("never lets a fresh device's empty database overwrite the account", () => {
    expect(plan(m({ "idb/a": "empty" }), m({ "idb/a": "work" }), {})).toEqual([
      { kind: "pull", path: "idb/a", sha: "work" },
    ]);
  });

  it("on a conflict this device wins and the account's copy is kept", () => {
    expect(plan(m({ "idb/a": "mine" }), m({ "idb/a": "theirs" }), { "idb/a": "base" })).toEqual([
      { kind: "push", path: "idb/a", sha: "mine", replaces: "theirs", keepOld: true },
    ]);
  });

  it("does nothing when both sides already match", () => {
    expect(plan(m({ "idb/a": "1" }), m({ "idb/a": "1" }), { "idb/a": "1" })).toEqual([]);
    expect(plan(m({ "idb/a": "1" }), m({ "idb/a": "1" }), {})).toEqual([
      { kind: "mark", path: "idb/a", sha: "1" },
    ]);
    // deleted on this device: the account keeps it, nothing comes back on its own
    expect(plan(m({}), m({ "idb/a": "1" }), { "idb/a": "1" })).toEqual([]);
  });
});

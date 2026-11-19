import { fxRamp, fxRgb, fxStats } from "@empire/ui";
import { describe, expect, it } from "vitest";
import data from "@/lib/react-bits.json";
import { registry } from "@/registry/meta";

describe("fx engine helpers", () => {
  it("reads token hex into rgb", () => {
    expect(fxRgb("#0a84ff")).toEqual([10, 132, 255]);
    expect(fxRgb("nope")).toEqual([0, 0, 0]);
  });

  it("builds a 256-step ramp that starts and ends on its stops", () => {
    const ramp = fxRamp(["#000000", "#ff8000", "#ffffff"]);
    expect(ramp).toHaveLength(768);
    expect([...ramp.slice(0, 3)]).toEqual([0, 0, 0]);
    expect([...ramp.slice(765)]).toEqual([255, 255, 255]);
    // the middle stop sits half way along
    expect(ramp[127 * 3]).toBeGreaterThan(250);
  });

  it("reports an idle clock before anything mounts", () => {
    expect(fxStats()).toMatchObject({ live: 0, total: 0, quality: 1 });
  });
});

describe("React Bits rebuilds", () => {
  it("credit a real React Bits title and use our own slug and name", () => {
    const titles = new Set(data.categories.flatMap((c) => c.items.map((i) => i.title)));
    const ours = registry.filter((e) => e.inspiredBy);
    expect(ours.length).toBeGreaterThanOrEqual(15);
    for (const e of ours) {
      expect(titles).toContain(e.inspiredBy);
      expect(e.name).not.toBe(e.inspiredBy);
    }
  });
});

import { describe, expect, it } from "vitest";
import { initial } from "./tube";

describe("initial", () => {
  it("keeps a Thai letter with its marks and capitalises Latin", () => {
    expect(initial("  ที่นี่ช่อง")).toBe("ที่");
    expect(initial("crocwork")).toBe("C");
    expect(initial("   ")).toBe("?");
  });
});

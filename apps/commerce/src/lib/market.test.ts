import { describe, expect, it } from "vitest";
import { availableActions, bahtInput, formatBaht, sideOf } from "./market";

describe("money", () => {
  it("parses baht into integer satang without float drift", () => {
    expect(bahtInput.parse("1,250.50")).toBe(125050);
    expect(bahtInput.parse("0.1")).toBe(10);
    expect(bahtInput.parse("19.99")).toBe(1999);
    expect(bahtInput.parse(" 300 ")).toBe(30000);
  });

  it("refuses ambiguous amounts instead of rounding them", () => {
    expect(bahtInput.safeParse("1.005").success).toBe(false);
    expect(bahtInput.safeParse("-5").success).toBe(false);
    expect(bahtInput.safeParse("abc").success).toBe(false);
  });

  it("formats satang as Thai baht", () => {
    expect(formatBaht(200000)).toContain("2,000");
  });
});

describe("order actions mirror the escrow state machine", () => {
  it("lets only the buyer pay, and either side walk away before payment", () => {
    expect(availableActions("CREATED", "buyer")).toEqual(["report", "cancel"]);
    expect(availableActions("CREATED", "seller")).toEqual(["confirm", "cancel"]);
  });

  it("after payment only the seller delivers or cancels; both may dispute", () => {
    expect(availableActions("FUNDED", "seller")).toEqual(["deliver", "cancel", "dispute"]);
    expect(availableActions("FUNDED", "buyer")).toEqual(["dispute"]);
  });

  it("only the buyer releases; only staff resolve; one review", () => {
    expect(availableActions("DELIVERED", "buyer")).toEqual(["release", "dispute"]);
    expect(availableActions("DISPUTED", "buyer")).toEqual([]);
    expect(availableActions("DISPUTED", "staff")).toEqual(["resolve"]);
    expect(availableActions("RELEASED", "buyer")).toEqual(["review"]);
    expect(availableActions("RELEASED", "buyer", { reviewed: true })).toEqual([]);
  });

  it("works out which side the viewer is on", () => {
    const order = { buyer_id: "b", seller_id: "s" };
    expect(sideOf(order, "b", false)).toBe("buyer");
    expect(sideOf(order, "s", true)).toBe("seller");
    expect(sideOf(order, "x", true)).toBe("staff");
    expect(sideOf(order, null, false)).toBe("none");
  });
});

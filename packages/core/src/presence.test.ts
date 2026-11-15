import { describe, expect, it } from "vitest";
import { visitPath } from "./presence";

describe("visitPath", () => {
  it("drops the query and hash (they may carry tokens)", () => {
    expect(visitPath("/login?next=/x&code=secret")).toBe("/login");
    expect(visitPath("/auth/callback#access_token=abc")).toBe("/auth/callback");
  });

  it("keeps a plain path and falls back to /", () => {
    expect(visitPath("/admin/users")).toBe("/admin/users");
    expect(visitPath("")).toBe("/");
    expect(visitPath("?only=query")).toBe("/");
  });

  it("caps the length at the table's 200 characters", () => {
    expect(visitPath(`/${"a".repeat(300)}`)).toHaveLength(200);
  });
});

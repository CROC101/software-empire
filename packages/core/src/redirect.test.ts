import { describe, expect, it } from "vitest";
import { safeRedirectPath } from "./redirect";

describe("safeRedirectPath", () => {
  it.each(["/dashboard", "/a/b?x=1#y", "/"])("keeps same-origin path %s", (path) => {
    expect(safeRedirectPath(path)).toBe(path);
  });

  it.each([
    "https://evil.com",
    "//evil.com",
    "/\\evil.com",
    "javascript:alert(1)",
    "dashboard",
    "/\tevil",
    "",
    null,
    undefined,
    42,
  ])("falls back for %j", (value) => {
    expect(safeRedirectPath(value, "/home")).toBe("/home");
  });
});

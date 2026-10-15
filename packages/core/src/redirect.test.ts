import { describe, expect, it } from "vitest";
import { safeRedirectPath, safeRedirectTarget } from "./redirect";

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

describe("safeRedirectTarget", () => {
  const apps = ["http://localhost:3003", "https://tools.example.com/"];

  it.each([
    ["/dashboard", "/dashboard"],
    ["http://localhost:3003/tools/json?q=1", "http://localhost:3003/tools/json?q=1"],
    ["https://tools.example.com", "https://tools.example.com/"],
  ])("allows %s", (value, expected) => {
    expect(safeRedirectTarget(value, apps)).toBe(expected);
  });

  it.each([
    "https://evil.com/",
    "http://localhost:3003@evil.com/",
    "http://tools.example.com/", // http is not the allowed https origin
    "http://localhost:3004/",
    "javascript:alert(1)",
    "//localhost:3003/",
    "not a url",
    null,
  ])("rejects %j", (value) => {
    expect(safeRedirectTarget(value, apps, "/home")).toBe("/home");
  });

  it("rejects everything absolute when no apps are configured", () => {
    expect(safeRedirectTarget("http://localhost:3003/", [], "/home")).toBe("/home");
  });
});

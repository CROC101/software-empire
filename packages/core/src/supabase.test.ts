import { describe, expect, it } from "vitest";
import { authCookieOptions, expireHostOnlyAuthCookies, parseSupabaseEnv } from "./supabase";

const local = {
  url: "http://localhost:54321",
  publishableKey: "sb_publishable_test",
  siteUrl: "http://localhost:3000",
  cookieDomain: "",
};

describe("parseSupabaseEnv", () => {
  it("treats an empty cookie domain as unset", () => {
    expect(parseSupabaseEnv(local).cookieDomain).toBeUndefined();
  });

  it("rejects a missing key and a malformed URL", () => {
    expect(() => parseSupabaseEnv({ ...local, publishableKey: undefined })).toThrow();
    expect(() => parseSupabaseEnv({ ...local, url: "localhost:54321" })).toThrow();
  });
});

describe("authCookieOptions", () => {
  it("is not Secure on http localhost", () => {
    expect(authCookieOptions(parseSupabaseEnv(local))).toMatchObject({
      domain: undefined,
      secure: false,
    });
  });

  it("shares the session across subdomains in production", () => {
    const prod = parseSupabaseEnv({
      ...local,
      siteUrl: "https://hub.example.com",
      cookieDomain: ".example.com",
    });
    expect(authCookieOptions(prod)).toMatchObject({
      domain: ".example.com",
      secure: true,
      sameSite: "lax",
    });
  });
});

describe("expireHostOnlyAuthCookies", () => {
  const prod = parseSupabaseEnv({
    ...local,
    siteUrl: "https://hub.example.com",
    cookieDomain: ".example.com",
  });

  it("expires host-only copies of the auth cookies only", () => {
    const lines = expireHostOnlyAuthCookies(
      ["sb-x-auth-token", "sb-x-auth-token.0", "em-theme"],
      prod,
    );
    expect(lines).toEqual([
      "sb-x-auth-token=; Path=/; Max-Age=0; SameSite=Lax; Secure",
      "sb-x-auth-token.0=; Path=/; Max-Age=0; SameSite=Lax; Secure",
    ]);
    expect(lines.join()).not.toContain("Domain=");
  });

  it("does nothing on localhost, where the session is host-only on purpose", () => {
    expect(expireHostOnlyAuthCookies(["sb-x-auth-token"], parseSupabaseEnv(local))).toEqual([]);
  });
});

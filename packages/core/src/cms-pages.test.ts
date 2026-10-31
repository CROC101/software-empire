import { describe, expect, it } from "vitest";
import { cmsValue } from "./cms";
import { SUBSYSTEM_PAGES } from "./cms-pages";

const id = /^[a-z0-9-]{1,64}$/;

describe("SUBSYSTEM_PAGES", () => {
  it("has unique app/page pairs", () => {
    const keys = SUBSYSTEM_PAGES.map((p) => `${p.app}/${p.page}`);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it.each(SUBSYSTEM_PAGES.map((p) => [`${p.app}/${p.page}`, p] as const))(
    "%s is well formed",
    (_, page) => {
      expect(page.app).toMatch(/^[a-z0-9-]{1,32}$/);
      expect(page.page).toMatch(id);
      for (const s of page.sections) {
        expect(s.key).toMatch(id);
        for (const [name, f] of Object.entries(s.fields ?? {})) {
          expect(name).toMatch(/^[a-z0-9_-]+$/);
          const value =
            f.kind === "text"
              ? { text: f.default }
              : f.kind === "number"
                ? { n: f.default }
                : f.default;
          expect(cmsValue[f.kind].safeParse(value).success).toBe(true);
        }
      }
    },
  );
});

import { createElement, type ComponentType } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { defaults, registry } from "./meta";
import type { Values } from "./types";

// The static export prerenders /p/<slug> with the part's default values; a part that throws there breaks the build.
const files = import.meta.glob<{ default: ComponentType<Values> }>("./ui/*.tsx");

describe("prerender", () => {
  it.each(registry.map((e) => [e.slug, e] as const))(
    "%s renders on the server with its defaults",
    async (slug, e) => {
      const load = files[`./ui/${slug}.tsx`];
      if (!load) throw new Error(`no file for ${slug}`);
      const { default: C } = await load();
      expect(() => renderToString(createElement(C, defaults(e)))).not.toThrow();
    },
    30_000,
  );
});

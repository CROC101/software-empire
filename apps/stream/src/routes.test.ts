import { describe, expect, it } from "vitest";
import { TOOLS } from "@/components/shell";
import { router } from "./routes";

type Route = { path?: string; children?: Route[] };
const paths = (routes: Route[]): (string | undefined)[] =>
  routes.flatMap((r) => [r.path, ...paths(r.children ?? [])]);

describe("routes", () => {
  it("opens the launcher at / and gives every launcher tile a page", () => {
    const all = paths(router.routes);
    expect(all).toContain("/");
    for (const t of TOOLS) expect(all).toContain(t.to);
  });
});

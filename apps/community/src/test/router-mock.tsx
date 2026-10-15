import type { AnchorHTMLAttributes, Ref } from "react";
import { vi } from "vitest";

/// Stand-in for `@/lib/router` in unit tests: components render without a <Router>, the way
/// the csmju-nexus tests rendered them with next/navigation mocked. Tests override pieces with
/// `vi.mock("@/lib/router", async () => ({ ...(await import("@/test/router-mock")).testRouter, … }))`.

type LinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
  ref?: Ref<HTMLAnchorElement>;
  replace?: boolean;
  state?: unknown;
};

const router = { push: vi.fn(), replace: vi.fn(), back: vi.fn() };

export const testRouter = {
  Link: ({ href, ref, replace: _replace, state: _state, ...props }: LinkProps) => (
    <a href={href} ref={ref} {...props} />
  ),
  useRouter: () => router,
  usePathname: () => window.location.pathname,
  useSearchParams: () => new URLSearchParams(window.location.search),
  useParams: () => ({}),
};

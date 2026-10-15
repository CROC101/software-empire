import { useMemo } from "react";
import {
  Link as RouterLink,
  useLocation,
  useNavigate,
  useParams as useRouterParams,
  useSearchParams as useRouterSearchParams,
  type LinkProps,
} from "react-router";

/// Next.js-shaped router helpers over React Router — the screens ported from csmju-canvas
/// keep their `next/link` / `next/navigation` call sites unchanged and import from here instead.

export function Link({ href, ...props }: Omit<LinkProps, "to"> & { href: string }) {
  return <RouterLink to={href} {...props} />;
}

export function useRouter() {
  const navigate = useNavigate();
  return useMemo(
    () => ({
      push: (href: string) => void navigate(href),
      replace: (href: string) => void navigate(href, { replace: true }),
      back: () => void navigate(-1),
    }),
    [navigate],
  );
}

export const usePathname = () => useLocation().pathname;

/** Read-only, like Next's — writers use useRouter().replace(). */
export const useSearchParams = (): URLSearchParams => useRouterSearchParams()[0];

export const useParams = useRouterParams;

import { NextResponse, type NextRequest } from "next/server";
import { appUrl } from "@/lib/apps";
import { subsystems } from "@/lib/subsystems";

/**
 * /go/<slug>: the hub switcher in every app links here, so apps never need each other's URLs.
 * Only known slugs with an APP_URL_<SLUG> redirect out; anything else lands on the app grid.
 */
// always per request (it reads APP_URL_* and only redirects): this also keeps dev from spawning
// the static-paths worker for this dynamic route — a worker that, once it crashes, takes the
// route down with "Jest worker encountered 2 child process exceptions" until a restart
export const dynamic = "force-dynamic";

export function GET(request: NextRequest, { params }: RouteContext<"/go/[slug]">) {
  return params.then(({ slug }) => {
    const known = subsystems.some((app) => app.slug === slug);
    const target = known ? appUrl(slug) : undefined;
    return NextResponse.redirect(target ?? new URL("/#subsystems", request.url));
  });
}

import { NextResponse, type NextRequest } from "next/server";
import { appUrl } from "@/lib/apps";
import { subsystems } from "@/lib/subsystems";

/**
 * /go/<slug>: the hub switcher in every app links here, so apps never need each other's URLs.
 * Only known slugs with an APP_URL_<SLUG> redirect out; anything else lands on the app grid.
 */
export function GET(request: NextRequest, { params }: RouteContext<"/go/[slug]">) {
  return params.then(({ slug }) => {
    const known = subsystems.some((app) => app.slug === slug);
    const target = known ? appUrl(slug) : undefined;
    return NextResponse.redirect(target ?? new URL("/#subsystems", request.url));
  });
}

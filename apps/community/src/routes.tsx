import { lazy, Suspense, type ComponentType } from "react";
import { createBrowserRouter, Navigate, Outlet, useRouteError } from "react-router";
import AppError from "@/app/error";
import NotFound from "@/app/not-found";
import AppLayout from "@/app/(app)/layout";
import Loading from "@/app/(app)/loading";
import ActivityLayout from "@/app/(app)/activity/layout";
import SettingsLayout from "@/app/(app)/settings/layout";

/// เส้นทางเดียวกับ app router ของ csmju-nexus — แต่ละหน้าโหลดแยกก้อน (route-level code splitting)

// the Vite glob keeps every page lazy without listing 33 imports by hand ·
// the pattern avoids "(app)": parentheses are glob syntax and would match nothing
const pages = import.meta.glob<{ default: ComponentType }>("./app/**/page.tsx");

function page(route: string) {
  const load = pages[`./app/(app)/${route}/page.tsx`];
  if (!load) throw new Error(`missing page module: ${route}`);
  const Page = lazy(load);
  return (
    <Suspense fallback={<Loading />}>
      <Page />
    </Suspense>
  );
}

function RouteError() {
  const error = useRouteError();
  return (
    <AppError
      error={error instanceof Error ? error : new Error(String(error))}
      retry={() => {
        window.location.reload();
      }}
    />
  );
}

const leaf = (path: string, route = path) => ({ path, element: page(route) });

export const router = createBrowserRouter([
  {
    errorElement: <RouteError />,
    element: (
      <AppLayout>
        <Outlet />
      </AppLayout>
    ),
    children: [
      { index: true, element: <Navigate to="/feed" replace /> },
      leaf("feed"),
      leaf("reels"),
      leaf("chat"),
      leaf("messages"),
      leaf("voice"),
      leaf("meetings"),
      leaf("notifications"),
      leaf("search"),
      leaf("explore/people"),
      leaf("p/:id", "p/[id]"),
      leaf("profile/:coreUserId", "profile/[coreUserId]"),
      leaf("saved"),
      leaf("saved/all"),
      leaf("saved/:collectionId", "saved/[collectionId]"),
      leaf("archive"),
      leaf("admin"),
      {
        path: "activity",
        element: (
          <ActivityLayout>
            <Outlet />
          </ActivityLayout>
        ),
        children: [
          { index: true, element: page("activity") },
          ...[
            "account-history",
            "interactions",
            "interactions/comments",
            "interactions/reposts",
            "interactions/story-replies",
            "media",
            "media/highlights",
            "media/reels",
          ].map((sub) => leaf(sub, `activity/${sub}`)),
        ],
      },
      {
        path: "settings",
        element: (
          <SettingsLayout>
            <Outlet />
          </SettingsLayout>
        ),
        children: [
          { index: true, element: page("settings") },
          ...[
            "activity-status",
            "blocked",
            "close-friends",
            "comments",
            "edit",
            "notifications",
            "theme",
          ].map((sub) => leaf(sub, `settings/${sub}`)),
        ],
      },
      { path: "*", element: <NotFound /> },
    ],
  },
]);

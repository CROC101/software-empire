import { lazy, Suspense, type ReactNode } from "react";
import { createBrowserRouter, Outlet, useParams } from "react-router";
import { Spinner } from "@/components/base/primitives";
import { Providers } from "@/components/base/providers";
import { AppShell } from "@/components/shell/app-shell";
import { CreateDesignProvider } from "@/components/shell/create-dialog";
import { Link } from "@/lib/router";

// the editor is most of the app's code — the home screen doesn't wait for it
const EditorScreen = lazy(() =>
  import("@/components/editor/editor-screen").then((m) => ({ default: m.EditorScreen })),
);
const Home = lazy(() => import("@/pages/home"));
const Projects = lazy(() => import("@/pages/projects"));
const Templates = lazy(() => import("@/pages/templates"));
const Trash = lazy(() => import("@/pages/trash"));

const page = (title: string, node: ReactNode) => (
  <>
    <title>{`${title} · Empire Canvas`}</title>
    <Suspense fallback={<Spinner />}>{node}</Suspense>
  </>
);

function Shell() {
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}

function DesignRoute() {
  const { id = "" } = useParams();
  return (
    <CreateDesignProvider>
      <title>Empire Canvas</title>
      <Suspense fallback={<Spinner label="กำลังเปิดเครื่องมือแก้ไข…" />}>
        <EditorScreen key={id} id={id} />
      </Suspense>
    </CreateDesignProvider>
  );
}

/** Screens of csmju-canvas that are not ported yet (assistant, help, account, admin…). */
function NotAvailable() {
  return (
    <main className="flex min-h-[60dvh] flex-col items-center justify-center gap-3 px-6 text-center">
      <title>ยังไม่เปิดใช้ · Empire Canvas</title>
      <h1 className="text-cv-h2 font-bold">ส่วนนี้ยังไม่เปิดใน Empire Canvas</h1>
      <p className="text-muted">
        กำลังย้ายมาจากระบบเดิม — ระหว่างนี้สร้างและแก้งานออกแบบได้ตามปกติ
      </p>
      <Link href="/" className="font-semibold text-primary underline">
        กลับหน้าแรก
      </Link>
    </main>
  );
}

export const router = createBrowserRouter([
  {
    element: (
      <Providers>
        <Outlet />
      </Providers>
    ),
    children: [
      { path: "design/:id", element: <DesignRoute /> },
      {
        element: <Shell />,
        children: [
          { index: true, element: page("หน้าแรก", <Home />) },
          { path: "projects", element: page("โปรเจกต์", <Projects />) },
          { path: "templates", element: page("เทมเพลต", <Templates />) },
          { path: "trash", element: page("ถังขยะ", <Trash />) },
          { path: "*", element: <NotAvailable /> },
        ],
      },
    ],
  },
]);

import { buttonVariants } from "@empire/ui";
import { lazy, Suspense, type ComponentType } from "react";
import { createBrowserRouter, Link, useParams } from "react-router";
import { DirectoryView } from "@/components/pages/directory-view";
import { FavoritesView } from "@/components/pages/favorites-view";
import { HomeView } from "@/components/pages/home-view";
import { ToolView } from "@/components/pages/tool-view";
import { AppShell } from "@/components/shell/app-shell";
import { RememberRecent } from "@/components/tools/remember-recent";
import { CATEGORIES } from "@/lib/tools/categories";
import { findTool, IMAGE_TOOL_SLUGS } from "@/lib/tools/registry";

// tools with their own page are split out — the home page doesn't download a PDF parser
const ImageTool = lazy(() => import("@/pages/image-tool"));
const PAGE_TOOLS: Record<string, ComponentType> = {
  "image-compressor": lazy(() => import("@/pages/image-compressor")),
  "file-comparison": lazy(() => import("@/pages/file-comparison")),
  "pdf-to-word": lazy(() => import("@/pages/pdf-to-word")),
  "number-base-converter": lazy(() => import("@/pages/number-base-converter")),
  "hash-crypto-toolbox": lazy(() => import("@/pages/hash-crypto-toolbox")),
};

const title = (name: string) => <title>{`${name} · Toolboxes`}</title>;

function Loading() {
  return (
    <div role="status" className="mx-auto max-w-7xl px-4 py-10 sm:px-8">
      <div className="skeleton h-10 w-64" />
      <div className="skeleton mt-6 h-64" />
      <span className="sr-only">กำลังโหลดเครื่องมือ…</span>
    </div>
  );
}

function NotFound() {
  return (
    <main className="mx-auto flex max-w-xl flex-col items-start gap-4 px-4 py-16">
      {title("ไม่พบหน้า")}
      <h1 className="text-2xl font-bold">ไม่พบหน้านี้</h1>
      <p className="text-muted-foreground">ลิงก์อาจผิด หรือเครื่องมือถูกย้ายไปแล้ว</p>
      <Link to="/tools" className={buttonVariants()}>
        ดูเครื่องมือทั้งหมด
      </Link>
    </main>
  );
}

function ToolRoute() {
  const { toolId = "" } = useParams();
  const tool = findTool(toolId);
  const Page = PAGE_TOOLS[toolId];

  if (!tool) return <NotFound />;
  if (tool.kind === "spec") {
    return (
      <>
        {title(tool.name)}
        <ToolView slug={tool.slug} />
      </>
    );
  }
  if (!Page && !IMAGE_TOOL_SLUGS.has(toolId)) return <NotFound />;

  return (
    <>
      {title(tool.name)}
      <RememberRecent slug={tool.slug} />
      <Suspense fallback={<Loading />}>{Page ? <Page /> : <ImageTool toolId={toolId} />}</Suspense>
    </>
  );
}

function CategoryRoute() {
  const { slug } = useParams();
  const category = CATEGORIES.find((c) => c.key === slug);
  if (!category) return <NotFound />;
  return (
    <>
      {title(`เครื่องมือ${category.label}`)}
      <DirectoryView key={category.key} category={category.key} />
    </>
  );
}

export const router = createBrowserRouter([
  {
    element: <AppShell />,
    children: [
      {
        index: true,
        element: (
          <>
            <title>Toolboxes · เครื่องมือออนไลน์ฟรีที่ทำงานในเบราว์เซอร์</title>
            <HomeView />
          </>
        ),
      },
      {
        path: "tools",
        element: (
          <>
            {title("เครื่องมือทั้งหมด")}
            <DirectoryView />
          </>
        ),
      },
      { path: "tools/:toolId", element: <ToolRoute /> },
      { path: "category/:slug", element: <CategoryRoute /> },
      {
        path: "favorites",
        element: (
          <>
            {title("รายการโปรด")}
            <FavoritesView />
          </>
        ),
      },
      { path: "*", element: <NotFound /> },
    ],
  },
]);

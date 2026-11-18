import type { ReactNode } from "react";
import { createBrowserRouter, Link, Navigate } from "react-router";
import { ShortsPage } from "@/components/modes";
import { VideosPage } from "@/components/videos";
import { MusicPage } from "@/components/music";
import { MoviesPage } from "@/components/movies";
import { TubePage } from "@/components/tube";
import { RoomPage } from "@/components/room-page";
import { Shell } from "@/components/shell";

const page = (name: string, body: ReactNode) => (
  <>
    <title>{`${name} · crocwork stream`}</title>
    {body}
  </>
);

export const router = createBrowserRouter([
  {
    element: <Shell />,
    children: [
      { path: "/", element: <Navigate to="/videos" replace /> },
      { path: "/videos", element: page("วิดีโอ", <VideosPage />) },
      { path: "/movies", element: page("หนัง", <MoviesPage />) },
      { path: "/music", element: page("เพลง", <MusicPage />) },
      { path: "/shorts", element: page("Shorts", <ShortsPage />) },
      { path: "/tube", element: page("Tube", <TubePage />) },
      { path: "/room/:id", element: page("ดูพร้อมเพื่อน", <RoomPage />) },
      {
        path: "*",
        element: page(
          "ไม่พบหน้า",
          <div className="mx-auto max-w-md px-4 py-16 text-center">
            <p className="mb-4 text-[var(--muted-foreground)]">ไม่พบหน้านี้</p>
            <Link to="/videos" className="text-[var(--primary)] underline">
              กลับหน้าวิดีโอ
            </Link>
          </div>,
        ),
      },
    ],
  },
]);

import { Suspense } from "react";
import { VideosExplorer } from "./VideosExplorer";

export const metadata = { title: "Videos - StreamHub" };

export default function VideosPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-site p-6 text-ink">Loading videos…</div>}>
      <VideosExplorer />
    </Suspense>
  );
}

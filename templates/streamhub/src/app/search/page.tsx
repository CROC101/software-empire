import { Suspense } from "react";
import { SearchView } from "./SearchView";

export const metadata = { title: "Search - StreamHub" };

export default function SearchPage() {
  return (
    <Suspense fallback={<p className="p-10 text-center text-ink">Searching…</p>}>
      <SearchView />
    </Suspense>
  );
}

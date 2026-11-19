import type { Metadata } from "next";
import Footer from "@/components/layout/Footer";
import DocsShell from "@/components/site/DocsShell";
import FavoritesView from "@/components/site/FavoritesView";

export const metadata: Metadata = { title: "Favorites" };

export default function FavoritesPage() {
  return (
    <>
      <DocsShell rail={false} wide>
        <FavoritesView />
      </DocsShell>
      <Footer />
    </>
  );
}

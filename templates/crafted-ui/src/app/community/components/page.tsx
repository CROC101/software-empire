import type { Metadata } from "next";
import { Library } from "@/components/library/library";
import { Footer } from "@/components/site/footer";
import { BRAND } from "@/components/site/logo";

export const metadata: Metadata = { title: `The library | ${BRAND}` };

export default function LibraryPage() {
  return (
    <>
      <main className="mx-auto max-w-6xl">
        <Library />
      </main>
      <Footer />
    </>
  );
}

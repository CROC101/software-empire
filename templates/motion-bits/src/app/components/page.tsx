import type { Metadata } from "next";
import { Suspense } from "react";
import Footer from "@/components/layout/Footer";
import ComponentGrid from "@/components/site/ComponentGrid";
import DocsShell from "@/components/site/DocsShell";

export const metadata: Metadata = { title: "Components" };

export default function ComponentsPage() {
  return (
    <>
      <DocsShell rail={false} wide>
        <Suspense fallback={<div className="h-[600px]" />}>
          <ComponentGrid />
        </Suspense>
      </DocsShell>
      <Footer />
    </>
  );
}

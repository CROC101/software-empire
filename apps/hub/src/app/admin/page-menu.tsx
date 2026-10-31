"use client";

import { BranchedMenu, type BranchedMenuItem } from "@empire/ui";
import { FileText } from "lucide-react";
import { useRouter } from "next/navigation";

/** The admin's list of editable pages, grouped by app, as a branching tree. */
export function PageMenu({
  apps,
  current,
}: {
  apps: { app: string; pages: { id: string; label: string }[] }[];
  current: string;
}) {
  const router = useRouter();
  const items: BranchedMenuItem[] = apps.map(({ app, pages }) => ({
    label: app,
    children: pages.map((p) => ({ value: p.id, label: p.label, icon: <FileText aria-hidden /> })),
  }));
  const open = apps.findIndex((a) => a.pages.some((p) => p.id === current));
  return (
    <BranchedMenu
      items={items}
      defaultOpen={open}
      defaultActive={current}
      onSelect={(value) => router.push(`/admin/content?p=${value}`)}
    />
  );
}

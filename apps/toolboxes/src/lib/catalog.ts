import {
  AppWindow,
  BookOpen,
  Clock,
  Home,
  LayoutGrid,
  Scale,
  Shapes,
  Star,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import type { Lang } from "@empire/core/lang";
import apps from "@/lib/apps.json";
import { CRAFT_APPS } from "@/lib/craft-apps";
import { categoryOf } from "@/lib/tools/categories";
import { toolHref, TOOLS } from "@/lib/tools/registry";

/** Everything Toolboxes can open, in one list: the search palette, favorites and history read it. */
export type Entry = {
  /** tool slug, app-<slug>, craft-<slug> or page-<name>; kebab-case so toolboxes.favorites accepts it */
  id: string;
  kind: "tool" | "app" | "craft" | "page";
  name: string;
  /** the group shown next to the name (tool category, app category, …) */
  group: string;
  href: string;
  icon: LucideIcon;
  /** a separate build (/apps/*, /craft/*): open with a full page load, not the router */
  full: boolean;
  /** lower-case words the search matches against */
  terms: string;
};

const APP_GROUP: Record<string, Record<Lang, string>> = {
  media: { th: "สื่อ", en: "Media" },
  business: { th: "ธุรกิจ", en: "Business" },
  engineering: { th: "วิศวกรรม", en: "Engineering" },
  games: { th: "เกม", en: "Games" },
  team: { th: "ทีม", en: "Team" },
  operations: { th: "ปฏิบัติการ", en: "Operations" },
  documents: { th: "เอกสาร", en: "Documents" },
};

export const KIND_LABEL: Record<Entry["kind"], Record<Lang, string>> = {
  tool: { th: "เครื่องมือ", en: "Tools" },
  app: { th: "แอป", en: "Apps" },
  craft: { th: "Craft", en: "Craft" },
  page: { th: "หน้า", en: "Pages" },
};

const PAGES: [string, string, Record<Lang, string>, LucideIcon, string][] = [
  ["home", "/", { th: "หน้าแรก", en: "Home" }, Home, "home หน้าแรก"],
  ["tools", "/tools", { th: "เครื่องมือทั้งหมด", en: "All tools" }, Wrench, "tools"],
  ["apps", "/apps", { th: "แอปทั้งหมด", en: "All apps" }, LayoutGrid, "apps"],
  ["icons", "/icons", { th: "คลังไอคอน", en: "Icon library" }, Shapes, "icons svg"],
  ["favorites", "/favorites", { th: "รายการโปรด", en: "Favorites" }, Star, "favorites โปรด"],
  ["history", "/history", { th: "ประวัติการใช้งาน", en: "History" }, Clock, "history ประวัติ"],
  ["guide", "/craft/guide/", { th: "คู่มือ Craft", en: "Craft guide" }, BookOpen, "guide คู่มือ"],
  ["licenses", "/licenses", { th: "สัญญาอนุญาต", en: "Licenses" }, Scale, "licenses"],
];

const lower = (...parts: (string | undefined)[]) =>
  parts.filter(Boolean).join(" ").toLocaleLowerCase("th");

export function catalog(lang: Lang): Entry[] {
  return [
    ...TOOLS.map((t): Entry => ({
      id: t.slug,
      kind: "tool",
      name: t.name,
      group: categoryOf(t.category).label,
      href: toolHref(t),
      icon: t.icon,
      full: false,
      terms: lower(t.name, t.slug, t.description, ...(t.keywords ?? [])),
    })),
    ...CRAFT_APPS.map((a): Entry => ({
      id: `craft-${a.slug}`,
      kind: "craft",
      name: `crocwork ${a.word}`,
      group: a.kind[lang],
      href: a.web ?? `/#app-${a.slug}`,
      icon: a.icon,
      full: true,
      terms: lower("crocwork craft", a.word, a.slug, a.kind.th, a.kind.en, a.description[lang]),
    })),
    ...apps.map((a): Entry => ({
      id: `app-${a.slug}`,
      kind: "app",
      name: a.name[lang],
      group: APP_GROUP[a.category]?.[lang] ?? a.category,
      href: `/apps/${a.slug}/`,
      icon: AppWindow,
      full: true,
      terms: lower(a.slug, a.name.th, a.name.en, a.description.th, a.description.en, a.category),
    })),
    ...PAGES.map(([id, href, name, icon, words]): Entry => ({
      id: `page-${id}`,
      kind: "page",
      name: name[lang],
      group: KIND_LABEL.page[lang],
      href,
      icon,
      full: href.startsWith("/craft/"),
      terms: lower(name.th, name.en, words),
    })),
  ];
}

export const findEntry = (entries: readonly Entry[], id: string) =>
  entries.find((e) => e.id === id);

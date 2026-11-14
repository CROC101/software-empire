import {
  DraftingCompass,
  FileText,
  Film,
  Frame,
  Image,
  LayoutTemplate,
  Paintbrush,
  PenTool,
  Presentation,
  Shapes,
  Type,
  WandSparkles,
  Workflow,
  type LucideIcon,
} from "lucide-react";
import type { Lang } from "@empire/core/lang";

type Text = Record<Lang, string>;

/**
 * crocwork's own apps with a desktop build. The Pro apps are our forks (MIT OR Apache-2.0, notices
 * kept in each build and on /licenses) made by tools/craft/rebrand.mjs; their web build sits in
 * public/craft/<slug>/ (tools/craft/web.mjs) and the Windows installer is a release of the fork.
 */
export type CraftApp = {
  slug: string;
  icon: LucideIcon;
  /** the word after "crocwork", shown in blue */
  word: string;
  kind: Text;
  description: Text;
  /** the web build; none when upstream ships only desktop builds */
  web?: string;
  /** slug of the quick, lighter everything app for the same job (/apps/<slug>/), shown on this card */
  light?: string;
  /** GitHub repo and release tag holding the unsigned Windows installer */
  repo?: string;
  tag?: string;
  /** file name stem of the release assets: <asset>-<version>-windows-x64.msi */
  asset?: string;
};

export const CRAFT_APPS: CraftApp[] = [
  {
    slug: "photo-editor",
    icon: Image,
    word: "Photo",
    kind: { th: "แต่งภาพ", en: "Image editor" },
    description: {
      th: "แต่งภาพแบบเลเยอร์ ปรับสี ตัด ไล่สี ครบในเบราว์เซอร์หรือบนเครื่อง",
      en: "Layered image editing, colour, crop and gradients, in the browser or on your PC.",
    },
    web: "/craft/photo-editor/",
    light: "photo-studio",
    repo: "CROC101/crocwork-photo",
    asset: "photocraft",
    tag: "v0.23.1-crocwork.3",
  },
  {
    slug: "pdf-editor",
    icon: FileText,
    word: "PDF",
    kind: { th: "งาน PDF", en: "PDF workbench" },
    description: {
      th: "เปิด แก้ รวม แยกหน้า และเซ็น PDF ได้โดยไฟล์ไม่ออกจากเครื่อง",
      en: "Open, edit, merge, split and sign PDFs without the file leaving your device.",
    },
    web: "/craft/pdf-editor/",
    light: "pdf",
    repo: "CROC101/crocwork-pdf",
    asset: "pdfcraft",
    tag: "v0.21.1-crocwork.3",
  },
  {
    slug: "word-editor",
    icon: Type,
    word: "Word",
    kind: { th: "เอกสาร", en: "Word processor" },
    description: {
      th: "พิมพ์เอกสาร จัดหน้า หัวข้อ ตาราง แล้วส่งออกเป็นไฟล์ที่คนอื่นเปิดได้",
      en: "Write documents with headings, tables and layout, then export a file anyone can open.",
    },
    web: "/craft/word-editor/",
    light: "documents",
    repo: "CROC101/crocwork-word",
    asset: "wordcraft",
    tag: "v0.18.1-crocwork.3",
  },
  {
    slug: "slides",
    icon: Presentation,
    word: "Slides",
    kind: { th: "สไลด์", en: "Slides" },
    description: {
      th: "ออกแบบสไลด์นำเสนอ จัดหน้า ใส่ภาพ แล้วเปิดโหมดนำเสนอได้เลย",
      en: "Design slides with layouts and pictures, then present straight from the app.",
    },
    web: "/craft/slides/",
    light: "presentation",
    repo: "CROC101/crocwork-slides",
    asset: "deckcraft",
    tag: "v0.18.1-crocwork.1",
  },
  {
    slug: "vector",
    icon: PenTool,
    word: "Vector",
    kind: { th: "ภาพเวกเตอร์", en: "Vector art" },
    description: {
      th: "วาดภาพเวกเตอร์ด้วยเส้น รูปทรง และตัวอักษร ขยายเท่าไรก็คม",
      en: "Draw vector art with paths, shapes and text that stays sharp at any size.",
    },
    web: "/craft/vector/",
    light: "vector-studio",
    repo: "CROC101/crocwork-vector",
    asset: "vectorcraft",
    tag: "v0.24.1-crocwork.1",
  },
  {
    slug: "layout",
    icon: LayoutTemplate,
    word: "Layout",
    kind: { th: "จัดหน้าสิ่งพิมพ์", en: "Page layout" },
    description: {
      th: "จัดหน้าหนังสือ โบรชัวร์ และนิตยสาร พร้อมส่งพิมพ์",
      en: "Lay out books, brochures and magazines, ready for print.",
    },
    web: "/craft/layout/",
    repo: "CROC101/crocwork-layout",
    asset: "designcraft",
    tag: "v0.20.1-crocwork.2",
  },
  {
    slug: "interface",
    icon: Frame,
    word: "Interface",
    kind: { th: "ออกแบบหน้าจอ", en: "Interface design" },
    description: {
      th: "ออกแบบหน้าจอแอปและเว็บ แล้วต่อเป็นต้นแบบที่กดได้",
      en: "Design app and web screens, then link them into a clickable prototype.",
    },
    web: "/craft/interface/",
    repo: "CROC101/crocwork-interface",
    asset: "figcraft",
    tag: "v0.18.1-crocwork.1",
  },
  {
    slug: "cad",
    icon: DraftingCompass,
    word: "CAD",
    kind: { th: "เขียนแบบ", en: "CAD" },
    description: {
      th: "เขียนแบบ 2 มิติและ 3 มิติ วัดขนาดได้แม่นยำ",
      en: "2D and 3D drafting with exact measurements.",
    },
    web: "/craft/cad/",
    light: "cad",
    repo: "CROC101/crocwork-cad",
    asset: "cadcraft",
    tag: "v0.20.1-crocwork.2",
  },
  {
    slug: "motion",
    icon: WandSparkles,
    word: "Motion",
    kind: { th: "โมชันกราฟิก", en: "Motion graphics" },
    description: {
      th: "ทำโมชันกราฟิกและเอฟเฟกต์ภาพ บนไทม์ไลน์ที่ปรับได้ทุกเฟรม",
      en: "Motion graphics and visual effects on a frame-accurate timeline.",
    },
    web: "/craft/motion/",
    light: "video-studio",
    repo: "CROC101/crocwork-motion",
    asset: "effectcraft",
    tag: "v0.24.1-crocwork.1",
  },
  {
    slug: "animate",
    icon: Film,
    word: "Animate",
    kind: { th: "แอนิเมชัน", en: "Animation" },
    description: {
      th: "แอนิเมชันเวกเตอร์ 2 มิติ มีไทม์ไลน์ เลเยอร์ และคีย์เฟรม",
      en: "2D vector animation with a timeline, layers and keyframes.",
    },
    light: "video-studio",
    repo: "CROC101/crocwork-animate",
    asset: "anicraft",
    tag: "v0.2.1-crocwork.2",
  },
  {
    slug: "material",
    icon: Workflow,
    word: "Material",
    kind: { th: "วัสดุสามมิติ", en: "Materials" },
    description: {
      th: "สร้างวัสดุสำหรับงานสามมิติด้วยการต่อโหนด",
      en: "Build materials for 3D work by connecting nodes.",
    },
    web: "/craft/material/",
    light: "3d",
    repo: "CROC101/crocwork-material",
    asset: "materialcraft",
    tag: "v0.4.1-crocwork.1",
  },
  {
    slug: "texture",
    icon: Paintbrush,
    word: "Texture",
    kind: { th: "ระบายพื้นผิว", en: "Texture painting" },
    description: {
      th: "ระบายสีและวัสดุลงบนโมเดลสามมิติโดยตรง",
      en: "Paint colour and materials straight onto 3D models.",
    },
    web: "/craft/texture/",
    light: "3d",
    repo: "CROC101/crocwork-texture",
    asset: "texturecraft",
    tag: "v0.6.1-crocwork.1",
  },
  {
    slug: "icons",
    icon: Shapes,
    word: "Icons",
    kind: { th: "คลังไอคอน", en: "Icon library" },
    description: {
      th: "โลโก้แบรนด์ ไอคอนคลาวด์ และธงชาติกว่า 6,000 ชิ้น คัดลอกเป็น SVG ได้ทันที",
      en: "Over 6,000 brand logos, cloud icons and flags, ready to copy as SVG.",
    },
    web: "/icons",
  },
];

export const releaseUrl = (app: CraftApp) =>
  app.repo && app.tag ? `https://github.com/${app.repo}/releases/tag/${app.tag}` : undefined;

/** Direct download links of a release: the MSI installer and the portable zip (no install). */
export function downloads(app: CraftApp) {
  if (!app.repo || !app.tag || !app.asset) return undefined;
  const version = /^v(d+.d+.d+)/.exec(app.tag)?.[1];
  if (!version) return undefined;
  const base = `https://github.com/${app.repo}/releases/download/${app.tag}/${app.asset}-${version}-windows-x64`;
  return { msi: `${base}.msi`, zip: `${base}-portable.zip` };
}

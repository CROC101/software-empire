import {
  Aperture,
  AudioWaveform,
  Clapperboard,
  DraftingCompass,
  FileText,
  Film,
  Frame,
  Image,
  LayoutTemplate,
  Paintbrush,
  PenTool,
  Presentation,
  Scissors,
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
  /** release holds <asset>-<version>-windows-x86_64-setup.exe and .msi (Inno + WiX) instead of MSI + zip */
  setup?: true;
  /** when not the default dual MIT OR Apache-2.0 */
  licence?: "MIT" | "AGPL-3.0-or-later";
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
    tag: "v0.23.1-crocwork.4",
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
    tag: "v0.21.1-crocwork.4",
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
    tag: "v0.18.1-crocwork.5",
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
    tag: "v0.18.1-crocwork.2",
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
    tag: "v0.24.1-crocwork.2",
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
    tag: "v0.20.1-crocwork.3",
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
    tag: "v0.18.1-crocwork.2",
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
    tag: "v0.20.1-crocwork.3",
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
    tag: "v0.24.1-crocwork.2",
  },
  {
    slug: "animate",
    icon: Clapperboard,
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
    tag: "v0.4.1-crocwork.2",
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
    tag: "v0.6.1-crocwork.2",
  },
  {
    slug: "darkroom",
    icon: Aperture,
    word: "Darkroom",
    kind: { th: "ห้องมืดดิจิทัล", en: "Photo darkroom" },
    description: {
      th: "จัดคลังรูปและล้างไฟล์ RAW ปรับแสง สี และโทนโดยไม่ทับไฟล์ต้นฉบับ",
      en: "Organise your photos and develop RAW files: light, colour and tone, never touching the original.",
    },
    web: "/craft/darkroom/",
    light: "photo-studio",
    repo: "CROC101/crocwork-darkroom",
    asset: "lightcraft",
    tag: "v0.21.1-crocwork.1",
  },
  {
    slug: "sound",
    icon: AudioWaveform,
    word: "Sound",
    kind: { th: "ทำเพลง", en: "Music studio" },
    description: {
      th: "อัดเสียง เรียงแทร็ก มิกซ์ และใส่เอฟเฟกต์ ทำเพลงได้ครบในเบราว์เซอร์",
      en: "Record, arrange, mix and add effects: a full music studio in the browser.",
    },
    web: "/craft/sound/",
    light: "music-studio",
    repo: "CROC101/crocwork-sound",
    asset: "soundcraft",
    tag: "v0.20.1-crocwork.1",
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
  {
    slug: "video",
    icon: Film,
    word: "Video",
    kind: { th: "ตัดต่อวิดีโอ", en: "Video editor" },
    description: {
      th: "ตัดต่อหลายแทร็ก ใส่ข้อความ เสียง และเอฟเฟกต์ งานทั้งหมดอยู่ในเครื่องคุณ ไม่ต้องอัปโหลด",
      en: "Multi-track editing with text, audio and effects. Your footage stays on your device, nothing is uploaded.",
    },
    web: "/craft/video/",
    repo: "CROC101/crocwork-video",
    licence: "MIT",
    tag: "v0.3.0-crocwork.1",
  },
  {
    slug: "cut",
    icon: Scissors,
    word: "Cut",
    kind: { th: "ตัดต่อวิดีโอบนเครื่อง", en: "Desktop video editor" },
    description: {
      th: "ตัดต่อวิดีโอบน Windows หลายแทร็ก ใส่ข้อความ เสียง เอฟเฟกต์ และซับไตเติล ทำงานออฟไลน์บนเครื่องคุณ",
      en: "A Windows video editor: multi-track, titles, audio, effects and captions, working offline on your PC.",
    },
    light: "video-studio",
    repo: "CROC101/crocwork-cut",
    asset: "crocwork-cut",
    tag: "v0.2.11-crocwork.1",
    setup: true,
    licence: "AGPL-3.0-or-later",
  },
];

/** the release page; only apps with a Windows build (an `asset`) have one worth showing */
export const releaseUrl = (app: CraftApp) =>
  app.repo && app.tag && app.asset
    ? `https://github.com/${app.repo}/releases/tag/${app.tag}`
    : undefined;

/** Direct download links of a release: the MSI installer plus the portable zip (no install), or the setup EXE. */
export function downloads(app: CraftApp) {
  if (!app.repo || !app.tag || !app.asset) return undefined;
  const version = /^v(\d+\.\d+\.\d+)/.exec(app.tag)?.[1];
  if (!version) return undefined;
  const dir = `https://github.com/${app.repo}/releases/download/${app.tag}/${app.asset}-${version}`;
  if (app.setup)
    return { msi: `${dir}-windows-x86_64.msi`, setup: `${dir}-windows-x86_64-setup.exe` };
  return { msi: `${dir}-windows-x64.msi`, zip: `${dir}-windows-x64-portable.zip` };
}

/** an accent per app for its tile, number and name (palette tokens, cycled) */
const HUES = [
  "blue-600",
  "coral-500",
  "teal-600",
  "violet-600",
  "croc-600",
  "gold-500",
  "sky-500",
  "fuchsia-500",
];
export const craftHue = (slug: string) =>
  `var(--em-${
    HUES[
      Math.max(
        0,
        CRAFT_APPS.findIndex((a) => a.slug === slug),
      ) % HUES.length
    ]
  })`;

/** screenshots of the web builds in public/craft-shots (800x500 webp); the rest show their tile */
const SHOTS = new Set([
  "cad",
  "darkroom",
  "icons",
  "interface",
  "layout",
  "material",
  "pdf-editor",
  "slides",
  "sound",
  "texture",
  "vector",
  "video",
  "word-editor",
]);
export const craftShot = (slug: string) =>
  SHOTS.has(slug) ? `/craft-shots/${slug}.webp` : undefined;

/** The launcher that installs every craft app (our fork, unsigned MSI). */
export const LAUNCHER = "https://github.com/CROC101/crocwork-launcher/releases/latest";

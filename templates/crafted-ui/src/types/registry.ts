import type { ComponentType } from "react";

export type PropValue = string | number | boolean;

interface PropControlBase<K extends string, V extends PropValue> {
  kind: K;
  name: string;
  label: string;
  default: V;
  description?: string;
}

export type NumberControl = PropControlBase<"number", number> & { min: number; max: number; step: number; unit?: string };
/** accent: the studio's theme accent swatch drives this colour. */
export type ColorControl = PropControlBase<"color", string> & { accent?: boolean };
export type BooleanControl = PropControlBase<"boolean", boolean>;
export type TextControl = PropControlBase<"text", string>;
export type SelectControl = PropControlBase<"select", string> & { options: readonly string[] };

export type PropControl = NumberControl | ColorControl | BooleanControl | TextControl | SelectControl;

export type PropValues = Record<string, PropValue>;

export type Category =
  | "Hero Sections"
  | "Bento Grids"
  | "Buttons"
  | "Cards"
  | "Text Effects"
  | "Backgrounds"
  | "Navigation"
  | "Forms";

export type Library = "Framer Motion" | "GSAP" | "Three.js" | "Pure CSS";

export interface RegistryComponent {
  slug: string;
  name: string;
  /** Exported React component name in the source file. */
  exportName: string;
  description: string;
  category: Category;
  library: Library;
  author: { handle: string; name: string; hue: number };
  dependencies: string[];
  registryDependencies: string[];
  tailwind?: { config: Record<string, unknown> };
  installs: number;
  bookmarks: number;
  published: string;
  propSchema: PropControl[];
  /** Height the live preview wants inside a card frame. */
  previewHeight: number;
  /** Background the preview canvas defaults to. */
  canvas: "dark" | "light";
  Component: ComponentType<PropValues>;
}

export interface RegistryFile {
  path: string;
  content: string;
  type: "registry:ui";
}

/** https://ui.shadcn.com/schema/registry-item.json */
export interface RegistryItemJSON {
  $schema: "https://ui.shadcn.com/schema/registry-item.json";
  name: string;
  type: "registry:ui";
  title: string;
  description: string;
  dependencies: string[];
  registryDependencies: string[];
  files: RegistryFile[];
  tailwind: { config: Record<string, unknown> };
}

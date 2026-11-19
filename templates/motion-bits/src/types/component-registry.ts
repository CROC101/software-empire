import type { ComponentType } from "react";

export type Category = "Text Animations" | "Animations" | "Components" | "Backgrounds";

export const CATEGORIES: Category[] = ["Text Animations", "Animations", "Components", "Backgrounds"];

export type PropValue = string | number | boolean;

interface ControlBase {
  name: string;
  label?: string;
}

export type PropControl =
  | (ControlBase & { type: "range"; min: number; max: number; step: number; unit?: string })
  | (ControlBase & { type: "color" })
  | (ControlBase & { type: "toggle" })
  | (ControlBase & { type: "text" })
  | (ControlBase & { type: "select"; options: string[] });

export interface PropDoc {
  name: string;
  type: string;
  default: string;
  description: string;
}

export type Dependency = "framer-motion" | "lucide-react" | "canvas";

export interface ComponentItem {
  slug: string;
  name: string;
  /** PascalCase file / export name */
  exportName: string;
  category: Category;
  description: string;
  dependencies: Dependency[];
  badge?: "NEW" | "POPULAR";
  component: ComponentType<Record<string, PropValue>>;
  defaultProps: Record<string, PropValue>;
  propControls: PropControl[];
  propDocs: PropDoc[];
  source: { ts: string; js: string };
  /** Backgrounds fill the stage instead of being centred */
  fill?: boolean;
}

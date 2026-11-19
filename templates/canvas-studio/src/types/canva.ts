export type FontFamily =
  | 'Inter'
  | 'Playfair Display'
  | 'JetBrains Mono'
  | 'Oswald'
  | 'Space Grotesk'
  | 'Pacifico';

export interface Gradient {
  kind: 'linear' | 'radial';
  stops: [string, string];
  /** CSS degrees, linear only (90 = left to right) */
  angle?: number;
}

/** A solid colour string (hex / rgba) or a two-stop gradient. */
export type Paint = string | Gradient;

export type ShapeKind =
  | 'rect'
  | 'roundedRect'
  | 'circle'
  | 'triangle'
  | 'star'
  | 'hexagon'
  | 'line'
  | 'arrow'
  | 'pill';

export type AnimationType = 'none' | 'fade' | 'rise' | 'pan' | 'pop' | 'pulse' | 'float' | 'typewriter';

export interface ElementAnimation {
  type: AnimationType;
  /** seconds */
  duration: number;
  /** seconds */
  delay: number;
}

export type ElementType = 'text' | 'shape' | 'image';

export interface CanvasElement {
  id: string;
  type: ElementType;
  name?: string;
  x: number;
  y: number;
  w: number;
  h: number;
  rotation: number;
  opacity: number;
  locked?: boolean;
  hidden?: boolean;
  flipH?: boolean;
  flipV?: boolean;
  shadow?: boolean;
  // shape + image
  shape?: ShapeKind;
  fill?: Paint;
  stroke?: string;
  strokeWidth?: number;
  radius?: number;
  // image
  src?: string;
  // text
  text?: string;
  fontFamily?: FontFamily;
  fontSize?: number;
  fontWeight?: number;
  italic?: boolean;
  underline?: boolean;
  strike?: boolean;
  align?: 'left' | 'center' | 'right';
  color?: string;
  letterSpacing?: number;
  lineHeight?: number;
  glow?: boolean;
  uppercase?: boolean;
  animation?: ElementAnimation;
}

export interface DesignPage {
  id: string;
  background: Paint;
  elements: CanvasElement[];
  animation?: ElementAnimation;
}

export interface DesignProject {
  id: string;
  title: string;
  width: number;
  height: number;
  pages: DesignPage[];
  createdAt: number;
  updatedAt: number;
  starred: boolean;
  trashed: boolean;
  folderId?: string | null;
  templateId?: string;
}

export interface FolderItem {
  id: string;
  name: string;
  createdAt: number;
}

export interface BrandPalette {
  id: string;
  name: string;
  colors: string[];
}

export interface BrandTypographyRole {
  family: FontFamily;
  weight: number;
}

export interface BrandLogo {
  id: string;
  name: string;
  /** data: URL (svg or uploaded image) */
  src: string;
  w: number;
  h: number;
}

export interface BrandKit {
  palettes: BrandPalette[];
  activePaletteId: string;
  typography: { heading: BrandTypographyRole; subheading: BrandTypographyRole; body: BrandTypographyRole };
  logos: BrandLogo[];
}

export interface WorkspaceSettings {
  theme: 'dark' | 'light';
  snap: boolean;
  grid: boolean;
  exportScale: 1 | 2;
}

export type TemplateCategory =
  | 'YouTube'
  | 'Instagram'
  | 'TikTok'
  | 'Presentations'
  | 'Resumes'
  | 'Logos'
  | 'Posters'
  | 'Flyers'
  | 'Business Cards'
  | 'Banners';

export interface DesignTemplate {
  id: string;
  name: string;
  category: TemplateCategory;
  pro: boolean;
  width: number;
  height: number;
  colors: string[];
  pages: DesignPage[];
}

export interface DesignPreset {
  id: string;
  label: string;
  width: number;
  height: number;
  group: string;
}

export interface FontCombo {
  id: string;
  name: string;
  heading: Partial<CanvasElement>;
  sub: Partial<CanvasElement>;
}

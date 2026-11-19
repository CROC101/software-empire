// The clone templates in /templates (repo root). Built by tools/templates.mjs into public/tpl/<slug>/
// and served there in a sandbox (public/_headers); the source zip sits next to it.
export type Template = {
  slug: string;
  name: string;
  about: string;
  stack: "Next.js" | "Vite";
  /** the product it was modelled on; its mark lives in public/brands (see NOTICE.txt). No url = not linked */
  inspired: { name: string; url?: string; icon?: string };
};

export const templates: readonly Template[] = [
  {
    slug: "lumora",
    name: "Lumora",
    about: "เว็บดูหนัง หน้าแรก เลือกโปรไฟล์ แถวหนัง หน้าดู ค้นหา บัตรของขวัญ",
    stack: "Vite",
    inspired: { name: "Netflix", url: "https://www.netflix.com", icon: "netflix" },
  },
  {
    slug: "viewtube",
    name: "ViewTube",
    about: "เว็บวิดีโอ หน้าแรก หน้าดู ผลค้นหา Shorts และ Studio",
    stack: "Next.js",
    inspired: { name: "YouTube", url: "https://www.youtube.com", icon: "youtube" },
  },
  {
    slug: "sonora",
    name: "Sonora",
    about: "เครื่องเล่นเพลง ค้นหา คิวเพลง เนื้อเพลง บัญชี",
    stack: "Next.js",
    inspired: { name: "Spotify", url: "https://open.spotify.com", icon: "spotify" },
  },
  {
    slug: "pulse",
    name: "Pulse",
    about: "ฟีดวิดีโอสั้น สำรวจ ไลฟ์ ข้อความ และร้านค้าถึงหน้าสั่งซื้อ",
    stack: "Next.js",
    inspired: { name: "TikTok", url: "https://www.tiktok.com", icon: "tiktok" },
  },
  {
    slug: "lumigram",
    name: "Lumigram",
    about: "ฟีดรูป สตอรี่ Reels ข้อความ โปรไฟล์ และโพสต์รูปจากเครื่อง",
    stack: "Vite",
    inspired: { name: "Instagram", url: "https://www.instagram.com", icon: "instagram" },
  },
  {
    slug: "crocwork-freelance",
    name: "crocwork freelance",
    about: "ตลาดฟรีแลนซ์ ค้นหาบริการ แชต คำสั่งซื้อ รายการโปรด",
    stack: "Next.js",
    inspired: { name: "Fastwork", url: "https://fastwork.co", icon: "fastwork" },
  },
  {
    slug: "canvas-studio",
    name: "Canvas Studio",
    about: "เว็บออกแบบกราฟิก หน้าเทมเพลต โปรเจกต์ ชุดแบรนด์ แอปเสริม",
    stack: "Next.js",
    inspired: { name: "Canva", url: "https://www.canva.com", icon: "canva" },
  },
  {
    slug: "streamhub",
    name: "StreamHub",
    about: "เว็บวิดีโอ หน้าแรก หมวด ช่อง เพลย์ลิสต์ หน้าดู ไลฟ์ และอัปโหลด",
    stack: "Next.js",
    inspired: { name: "รู้ๆ กันอยู่", icon: "ph" },
  },
  {
    slug: "crafted-ui",
    name: "Crafted UI",
    about: "คลังคอมโพเนนต์ ดูตัวอย่างสด คัดลอกโค้ด หน้าราคา",
    stack: "Next.js",
    inspired: { name: "21st.dev", url: "https://21st.dev" },
  },
  {
    slug: "motion-bits",
    name: "Motion Bits",
    about: "คลังคอมโพเนนต์เคลื่อนไหว ปรับค่าสด คัดลอกโค้ด TS/JS เก็บรายการโปรด",
    stack: "Next.js",
    inspired: { name: "React Bits", url: "https://reactbits.dev" },
  },
  {
    slug: "craft-everything",
    name: "Craft Everything",
    about: "เว็บแนะนำเครื่องมือโอเพนซอร์ส หน้าสตูดิโอ ราคา ช่วยเหลือ",
    stack: "Vite",
    inspired: { name: "ArtCraft", url: "https://getartcraft.com" },
  },
];

export const templateBase = (slug: string) => `/tpl/${slug}/`;
export const templateZip = (slug: string) => `/tpl/${slug}.zip`;

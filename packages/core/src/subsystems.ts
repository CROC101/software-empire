/** The portfolio: every app in the hub. Shared so each app can link to the others. */
// shortcut: static list; move to table hub.subsystems when the registry gets health checks (Phase 2)
// accent = a palette token from @empire/ui, so every tile stays inside the Aurora theme
// every app has tile artwork in hub public/logos/<slug>-light.webp + -dark.webp (SubsystemLogo)
export const subsystems = [
  {
    slug: "community",
    name: "Community",
    summary: "โซเชียลเต็มรูปแบบ — ฟีด รีลส์ สตอรี่ และแชตเรียลไทม์",
    accent: "var(--em-violet-600)",
  },
  {
    slug: "commerce",
    name: "Commerce",
    summary: "ตลาดงานฟรีแลนซ์พร้อม escrow จำลอง",
    accent: "var(--em-gold-500)",
  },
  {
    slug: "toolboxes",
    name: "Toolboxes",
    summary: "เครื่องมือนักพัฒนาและ MCP Inspector ในเบราว์เซอร์",
    accent: "var(--em-teal-600)",
  },
  {
    slug: "tarot",
    name: "crocwork tarot",
    summary: "ไพ่ประจำวัน อ่านไพ่ 1 หรือ 3 ใบ เช็กอินรับเหรียญ",
    accent: "var(--em-fuchsia-500)",
  },
  {
    slug: "design",
    name: "Design Registry",
    summary: "คลัง component และ prompt พร้อมโค้ด",
    accent: "var(--em-sky-500)",
  },
  {
    slug: "canva",
    name: "Empire Canvas",
    summary: "โปรแกรมกราฟิกหลายเลเยอร์บนเว็บ",
    accent: "var(--em-coral-500)",
  },
  {
    slug: "crocbyte",
    name: "CrocByte",
    summary: "เว็บรับงานฟรีแลนซ์ของผมเอง ระบบสมาชิก VIP และอันดับลูกค้า",
    accent: "var(--em-teal-600)",
  },
  {
    slug: "stream",
    name: "Stream",
    summary: "หนัง เพลง คลิปสั้น จาก YouTube ทางการ พับจอฟังต่อได้ ดูพร้อมเพื่อนได้",
    accent: "var(--em-violet-800)",
  },
] as const;

/** The owner's public contact channels, shown in every app (HubSwitcher panel, hub footer). `icon` = a BrandIcon name in @empire/ui. */
export const contactEmail = "skizzkat@gmail.com";
export const contacts = [
  { label: "Facebook", href: "https://www.facebook.com/sarawut.phusee", icon: "facebook" },
  { label: "Instagram", href: "https://www.instagram.com/sxrx_wut.18/", icon: "instagram" },
  { label: "Discord", href: "https://discord.gg/sNYsVbh3v", icon: "discord" },
  { label: "GitHub", href: "https://github.com/CROC101", icon: "github" },
  { label: "อีเมล", href: `mailto:${contactEmail}`, icon: "gmail" },
] as const;

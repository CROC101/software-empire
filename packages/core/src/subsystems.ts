/** The portfolio: every app in the hub. Shared so each app can link to the others. */
// shortcut: static list; move to table hub.subsystems when the registry gets health checks (Phase 2)
// accent = a palette token from @empire/ui, so every tile stays inside the Aurora theme
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
    name: "AI Tarot",
    summary: "ไพ่ทาโรต์ 3D ทำนายด้วย AI บน WebGPU",
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
    summary: "เครื่องเล่นเสียงเล่นต่อเมื่อปิดจอ คุมจาก lockscreen",
    accent: "var(--em-violet-800)",
  },
] as const;

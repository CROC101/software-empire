// shortcut: static list; move to table hub.subsystems when the registry gets health checks (Phase 2)
export const subsystems = [
  { slug: "community", name: "Community", summary: "แชตเรียลไทม์ ห้อง DM และ presence" },
  { slug: "commerce", name: "Commerce", summary: "ตลาดงานฟรีแลนซ์พร้อม escrow จำลอง" },
  {
    slug: "toolboxes",
    name: "Toolboxes",
    summary: "เครื่องมือนักพัฒนาและ MCP Inspector ในเบราว์เซอร์",
  },
  { slug: "tarot", name: "AI Tarot", summary: "ไพ่ทาโรต์ 3D ทำนายด้วย AI บน WebGPU" },
  { slug: "design", name: "Design Registry", summary: "คลัง component และ prompt พร้อมโค้ด" },
  { slug: "canva", name: "Canva", summary: "โปรแกรมกราฟิกหลายเลเยอร์บนเว็บ" },
  {
    slug: "stream",
    name: "Stream",
    summary: "เครื่องเล่นเสียงเล่นต่อเมื่อปิดจอ คุมจาก lockscreen",
  },
] as const;

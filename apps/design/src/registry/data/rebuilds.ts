import { def, range, type Control, type Entry } from "../types";

/**
 * crocwork rebuilds of React Bits backgrounds. Written from how the originals look and move, never
 * from their code (React Bits is MIT + Commons Clause: no ports). Every one runs on the shared fx
 * clock in `@empire/ui` (one frame loop, off-screen pause, adaptive resolution, Canvas 2D only).
 */
const r = (
  added: string,
  inspiredBy: string,
  slug: string,
  name: string,
  summary: string,
  blend: readonly string[],
  controls: readonly Control[],
): Entry => ({ ...def(added, "background", slug, name, summary, blend, controls), inspiredBy });

const day1 = "2026-11-19";

export const rebuilds: readonly Entry[] = [
  r(
    day1,
    "Plasma",
    "tide-plasma",
    "Tide Plasma",
    "คลื่นไซน์สี่ชั้นซ้อนกันไหลเป็นสีน้ำทะเลลึก วาดที่ความละเอียดหนึ่งในห้าแล้วขยาย",
    ["sine field", "palette ramp"],
    [range("speed", "ความเร็ว", 0.1, 2, 0.1, 0.6), range("zoom", "ซูม", 0.5, 2, 0.1, 1)],
  ),
  r(
    day1,
    "Silk",
    "silk-current",
    "Silk Current",
    "ผ้าไหมพับเป็นลอนพลิ้วช้าๆ ด้านที่หันเข้าหาแสงสว่างกว่า",
    ["fold stripes", "soft light"],
    [range("speed", "ความเร็ว", 0.1, 2, 0.1, 0.5), range("folds", "จำนวนลอน", 1, 6, 1, 3)],
  ),
  r(
    day1,
    "Galaxy",
    "deep-galaxy",
    "Deep Galaxy",
    "ดาราจักรกังหันเอียง ดาววงในหมุนเร็วกว่าขอบ เมาส์ขยับมุมมอง",
    ["spiral arms", "differential spin"],
    [
      range("arms", "จำนวนแขน", 2, 6, 1, 3),
      range("speed", "ความเร็ว", 0.1, 1.5, 0.1, 0.4),
      range("stars", "จำนวนดาว", 400, 3000, 100, 1400),
    ],
  ),
  r(
    day1,
    "Hyperspeed",
    "warp-lanes",
    "Warp Lanes",
    "เส้นแสงพุ่งผ่านกล้อง กดค้างเพื่อเร่งความเร็ว",
    ["perspective streaks", "hold to boost"],
    [range("speed", "ความเร็ว", 0.1, 1.5, 0.1, 0.5), range("count", "จำนวนเส้น", 60, 500, 20, 220)],
  ),
  r(
    day1,
    "Particles",
    "float-particles",
    "Float Particles",
    "ทรงกลมจุดลอยหมุนสามมิติ จุดใกล้ใหญ่และสว่างกว่า เมาส์เอียงทรงกลม",
    ["3D point cloud", "pointer tilt"],
    [range("count", "จำนวนจุด", 100, 1500, 50, 500), range("speed", "ความเร็ว", 0, 1.5, 0.1, 0.3)],
  ),
  r(
    day1,
    "Letter Glitch",
    "glyph-glitch",
    "Glyph Glitch",
    "กำแพงตัวอักษรที่เปลี่ยนทีละไม่กี่ช่อง วาดใหม่เฉพาะช่องที่เปลี่ยน",
    ["character grid", "dirty cells"],
    [
      range("cell", "ขนาดช่อง", 10, 28, 2, 16),
      range("rate", "อัตราเปลี่ยน", 0.01, 0.2, 0.01, 0.04),
    ],
  ),
  r(
    day1,
    "Ripple Grid",
    "ripple-mesh",
    "Ripple Mesh",
    "ตารางเส้นยกตัวเป็นคลื่นวงจากกลาง แตะเพื่อหยดคลื่นอีกวง",
    ["displaced grid", "tap ripple"],
    [range("gap", "ระยะห่างเส้น", 14, 48, 2, 24), range("speed", "ความเร็ว", 0.2, 3, 0.1, 1)],
  ),
  r(
    day1,
    "Threads",
    "thread-drift",
    "Thread Drift",
    "เส้นด้ายบางพาดทั้งกรอบ แกว่งตามคลื่นของตัวเอง เมาส์ดึงเข้าหา",
    ["layered sines", "pointer pull"],
    [range("lines", "จำนวนเส้น", 8, 60, 2, 28), range("sway", "ความแกว่ง", 0.2, 2, 0.1, 1)],
  ),
  r(
    day1,
    "Lightning",
    "bolt-strike",
    "Bolt Strike",
    "ฟ้าผ่าแตกกิ่ง กะพริบแล้วจางหาย ผ่าใหม่ที่อื่น แตะเพื่อเรียกฟ้า",
    ["midpoint displacement", "flicker"],
    [range("every", "วินาทีต่อครั้ง", 0.6, 4, 0.2, 1.6)],
  ),
  r(
    day1,
    "Dither",
    "dither-tide",
    "Dither Tide",
    "คลื่นซัดวาดด้วยหมึกสองสีแบบจุดเรียง เหมือนจอขาวดำยุคเก่า",
    ["ordered dither", "pixel art"],
    [range("pixel", "ขนาดพิกเซล", 2, 8, 1, 4), range("speed", "ความเร็ว", 0.1, 2, 0.1, 0.6)],
  ),
  r(
    day1,
    "Magnet Lines",
    "magnet-lines",
    "Magnet Needles",
    "เข็มสั้นเต็มกรอบหันตามเมาส์ ไม่มีเมาส์จะหันตามจุดที่วนอยู่",
    ["vector field", "pointer follow"],
    [range("gap", "ระยะห่าง", 18, 48, 2, 28), range("length", "ความยาวเข็ม", 6, 24, 1, 12)],
  ),
  r(
    day1,
    "Ballpit",
    "ball-pool",
    "Ball Pool",
    "ลูกบอลตกลงสระ เด้งแล้วนิ่ง ลากเมาส์ผ่านเพื่อกวน",
    ["2D physics", "pointer stir"],
    [
      range("count", "จำนวนลูก", 10, 80, 2, 40),
      range("gravity", "แรงโน้มถ่วง", 200, 2000, 50, 900),
    ],
  ),
  r(
    day1,
    "Pixel Snow",
    "pixel-snow",
    "Pixel Flurry",
    "หิมะเม็ดสี่เหลี่ยมบนตารางพิกเซล เม็ดใกล้ใหญ่และเร็ว ลอยตามลม",
    ["parallax", "pixel snap"],
    [
      range("count", "จำนวนเม็ด", 40, 400, 20, 160),
      range("pixel", "ขนาดพิกเซล", 2, 6, 1, 3),
      range("wind", "แรงลม", -1, 1, 0.1, 0.4),
    ],
  ),
  r(
    day1,
    "Topography",
    "topo-lines",
    "Topo Lines",
    "เส้นชั้นความสูงของภูมิประเทศที่ค่อยๆ เปลี่ยน ลากด้วย marching squares",
    ["contour map", "marching squares"],
    [
      range("levels", "จำนวนชั้น", 4, 16, 1, 9),
      range("speed", "ความเร็ว", 0.05, 0.6, 0.05, 0.15),
      range("cell", "ความละเอียด", 8, 24, 2, 14),
    ],
  ),
  r(
    day1,
    "Radar",
    "radar-sweep",
    "Sonar Sweep",
    "จอโซนาร์ วงแหวน เส้นกวาดพร้อมหางจาง เป้าสว่างขึ้นเมื่อเส้นกวาดผ่าน",
    ["sweep trail", "contacts"],
    [range("speed", "ความเร็ว", 0.2, 2, 0.1, 0.8), range("contacts", "จำนวนเป้า", 3, 20, 1, 9)],
  ),
];

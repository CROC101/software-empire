import { def, range, text, type Entry } from "../types";

/** Showpieces: the parts with the strongest effect, kept in their own group at the top. */
export const exclusive: readonly Entry[] = [
  {
    ...def(
      "2026-11-20",
      "showcase",
      "orbit-gallery-hero",
      "Orbit Gallery Hero",
      "รูปผลงานสิบรูปหมุนเป็นวงรอบข้อความกลางจอช้า ๆ แต่ละรูปหมุนกลับเท่ากันจึงตั้งตรงตลอดทาง กลางจอเป็นหัวเรื่อง ปุ่มสองปุ่ม และจุดเด่นสามข้อ",
      ["วงโคจร", "แกลเลอรี", "hero", "หมุนสวนทาง"],
      [range("seconds", "วินาทีต่อรอบ", 15, 60, 5, 35), range("tiles", "จำนวนรูป", 6, 10, 1, 10)],
    ),
    prompt:
      "Build a full-height landing hero: a ring of 6-10 landscape screenshots (16:9, rounded at most 0.75rem, hairline border) turns once every 35 seconds round the centre of the section, with a radius of about clamp(12rem, 40vw, 31rem). Place each picture with rotate(angle) translateX(radius) rotate(-angle), and give each picture the same spin in reverse so it stays upright all the way round. Drive both spins with one CSS keyframe on transform only, stop them under prefers-reduced-motion, and hide the ring from screen readers. Over it, a soft radial fade of the page background keeps the middle readable: a small chip, a two-line headline (second line in the accent), one paragraph, a primary and a secondary button, and three short points in a row. Use your stack's design tokens for every colour.",
  },
  {
    ...def(
      "2026-11-20",
      "spotlight",
      "lamp-hero",
      "Lamp Spotlight Hero",
      "hero พื้นมืด แถบไฟบาง ๆ กางออกสองข้างแล้วส่องลำแสงรูปกรวยลงมาที่หัวเรื่อง ขอบลำแสงสว่างกว่าตรงกลาง ข้อความลอยขึ้นมารับแสง เปิดไฟใหม่ทุกครั้งที่เลื่อนกลับมาเห็น",
      ["ไฟส่อง", "ลำแสง", "hero", "พื้นมืด"],
      [
        text("title", "หัวเรื่อง", "เปิดไฟให้งานที่ทำ", 32),
        range("seconds", "วินาทีที่ไฟเปิด", 0.4, 2, 0.1, 0.9),
      ],
    ),
    prompt:
      "Build a dark full-height hero lit from above. Near the top sits a thin 2px bar of light with a soft blurred glow under it; below it a cone of light spreads downward (a conic-gradient anchored at the top centre, bright along both edges and dimmer in the middle, masked to fade out toward the bottom), and a solid block of the page colour sits above the bar so light only falls down. When the section comes into view the bar, glow and cone open out from half width with scaleX and fade up, and the headline block (eyebrow, headline, one line, one button) rises into the light, all with transform and opacity only, replaying each time it re-enters view; under prefers-reduced-motion everything is already on. Use your stack's design tokens for every colour.",
  },
  {
    ...def(
      "2026-11-20",
      "stories",
      "story-rings",
      "Story Rings Viewer",
      "วงสตอรี่รอบรูปโปรไฟล์ แบ่งเป็นช่วงตามจำนวนภาพ ช่วงที่ดูแล้วเปลี่ยนเป็นสีเทา กดเปิดดูในกรอบแนวตั้งมีแถบเวลาต่อภาพ แตะซ้ายขวาหรือปัดเพื่อเปลี่ยนภาพ กดค้างหรือ Space เพื่อหยุด ปัดลงหรือ Esc เพื่อปิด",
      ["สตอรี่", "วงแหวน", "แกลเลอรี", "ปัด"],
      [range("seconds", "วินาทีต่อภาพ", 3, 10, 1, 5)],
    ),
    prompt:
      "Build a story viewer. A row of round avatars, each wearing an SVG ring split into one arc per picture (stroke-dasharray with small gaps); an arc is in the accent until its picture has been seen, then it turns neutral. Clicking an avatar opens a dialog (role=dialog, focus moves in, Escape closes, focus returns to the avatar) with a tall 9:16 frame starting at the first unseen picture: one thin bar per picture along the top, the current one filling with a CSS scaleX keyframe whose animationend steps forward, so pausing is just animation-play-state. Tap the left or right half to step, hold to pause (a press over 250ms is not a tap), Space toggles pause, arrow keys step, swipe sideways to step or down to close; the last picture closes the viewer. Pictures slide in from the side they come from. Under prefers-reduced-motion there is no auto-advance and no slide. Use your stack's design tokens for every colour.",
  },
  {
    ...def(
      "2026-11-20",
      "team",
      "lanyard-rail",
      "Lanyard Rail Team Badges",
      "บัตรพนักงานห้อยสายจากราวเดียวกัน ชี้แล้วบัตรแกว่งและยกขึ้นมาข้างหน้า กดหรือ Enter พลิกดูประวัติด้านหลัง ลมพัดให้บัตรแกว่งทีละใบ ลูกศร Home End เลื่อนไปตามราว Esc พลิกกลับ จอแคบเลื่อนข้างทีละใบ",
      ["ทีม", "บัตร", "พลิก", "แกว่ง"],
      [range("seconds", "วินาทีระหว่างลมพัด", 2, 10, 1, 4)],
    ),
    prompt:
      "Build a team section where ID badges hang from one horizontal rail. Each badge has a strap, a reel and a clip above a card whose front shows a coloured band, initials in a round portrait, name, role, a team chip and a barcode generated from the name. Pointing at a badge sways it from the top (rotate keyframes, transform-origin at the strap) and lifts it forward with a spring; click or Enter flips it with rotateY 180 to a back with a short bio and tags (both faces backface-hidden). Every few seconds a breeze sways the next badge, paused while the pointer or focus is inside. ArrowLeft/Right, Home and End move focus along the rail, Escape turns the badge back, and an aria-live line names the badge in front. Narrow screens scroll the rail sideways with scroll-snap. Transform and opacity only, still under prefers-reduced-motion. Use your stack's design tokens for every colour.",
  },
  {
    ...def(
      "2026-11-20",
      "carousel",
      "orbit-swing",
      "Orbit Swing Carousel",
      "ภาพวงกลมหมุนบนวงโคจรกว้างที่จุดหมุนอยู่สูงเหนือเวที ภาพเก่าเหวี่ยงออกด้านหนึ่ง ภาพใหม่เหวี่ยงเข้าอีกด้าน หัวเรื่องสองน้ำหนักเลื่อนสลับทาง การ์ดจางสลับ ส่วนโค้งด้านหลังหมุนและเปลี่ยนสีตามภาพ มีปุ่มลูกศร จุด ภาพย่อ คีย์ลูกศร และปัด",
      ["สไลด์", "วงโคจร", "แกลเลอรี", "ปัด"],
      [range("tilt", "องศาที่เหวี่ยง", 20, 70, 5, 45)],
    ),
    prompt:
      "Build a carousel where a round picture rides a wide orbit: its transform-origin sits far above the stage (around 50% -140%), so on each step the old picture rotates out to one side while the next rotates in from the other, in the direction of travel. Beside it a two-weight title wipes inside overflow-clipped lines, the thin word entering from the right and the heavy word from the left; a small card with a thumbnail, one line of text, tag chips and a link cross-fades with a short rise; an SVG arc behind the picture turns by a fixed angle per step and cross-fades to the slide's colour. Step with arrow buttons, pager dots, a thumbnail strip, ArrowLeft/Right on the focused region and a sideways swipe. Time-driven only, no scroll pinning; transform and opacity only, instant under prefers-reduced-motion; an aria-live line names the current slide. Use your stack's design tokens for every colour.",
  },
];

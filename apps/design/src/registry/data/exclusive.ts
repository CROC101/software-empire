import { def, pick, range, text, toggle, type Entry } from "../types";

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
  {
    ...def(
      "2026-11-20",
      "showcase",
      "perspective-tunnel",
      "Perspective Tunnel",
      "การ์ดผลงานลอยมาจากจุดลึกสุดสายตาแล้วบินผ่านกล้องตามการเลื่อนหน้า ใต้หัวเรื่องใหญ่ ทุกใบเป็นลิงก์ ลดการเคลื่อนไหวแล้วเหลือเป็นกริดนิ่ง",
      ["อุโมงค์", "3D", "เลื่อนหน้า", "แกลเลอรี"],
      [],
    ),
    prompt:
      "Build a work section where screenshot cards fly toward the camera out of a far vanishing point as the page scrolls. A tall section holds a sticky stage with CSS perspective; native scroll progress (no scroll hijacking, no pin library) moves each card along translateZ with a staggered offset, fading in from the distance and out as it passes the lens. A large two-line headline, a short paragraph and a scroll hint sit over the start of the tunnel. Each card is a link with a title. Transform and opacity only; under prefers-reduced-motion the tunnel becomes a still grid of the same cards. Use your stack's design tokens for every colour.",
  },
  {
    ...def(
      "2026-11-20",
      "team",
      "clothing-rail",
      "Clothing Rail Roles",
      "บทบาทในทีมเป็นเสื้อแขวนบนราว ชี้แล้วเสื้อหันหน้ามา กดแล้วหยิบลงมาดูด้านหน้าและด้านหลังพร้อมรายละเอียด เลื่อนเองทีละตัวจนกว่าจะมีคนชี้",
      ["ทีม", "ราวเสื้อ", "พลิก", "หยิบ"],
      [range("seconds", "วินาทีต่อตัว", 2, 8, 1, 3)],
    ),
    prompt:
      "Build a team or roles section drawn as garments on one clothes rail: shirts, knits, hoodies, jackets and coats hang side-on from hangers, each an SVG illustration in its own colour. Pointing at one turns it to face the viewer; clicking lifts it off the rail into a detail view that shows the front and back with a name and a short description, and Escape hangs it back. With no pointer on the rail it turns the next garment every few seconds. Keyboard reaches every garment, the rail has an accessible name, and motion is transform and opacity only, still under prefers-reduced-motion. Use your stack's design tokens for every colour.",
  },
  {
    ...def(
      "2026-11-20",
      "carousel",
      "polaroid-line",
      "Polaroid Line Carousel",
      "รูปโพลารอยด์หนีบบนเชือกที่หย่อนตรงกลาง ลากหรือกดลูกศรแล้วรูปเลื่อนตามเชือกพร้อมแกว่งเบา ๆ เลื่อนเองตามเวลาและหยุดรอเมื่อมีคนแตะ",
      ["สไลด์", "โพลารอยด์", "เชือก", "ลาก"],
      [range("seconds", "วินาทีต่อรูป", 3, 10, 1, 5)],
    ),
    prompt:
      "Build a carousel of instant-film prints pegged to a string that sags in the middle like a washing line. Each print sits on the string's curve with a small clothes peg, a picture, a handwritten-style title and caption. Dragging or the prev/next buttons slide the prints along the curve with a spring, and each print swings a little from its peg as it moves and settles. Autoplay steps every few seconds and waits while someone interacts. Arrow keys step, an aria-live label reads 'print n of total'. Transform and opacity only, no swing under prefers-reduced-motion. Use your stack's design tokens for every colour.",
  },
  {
    ...def(
      "2026-11-20",
      "carousel",
      "water-ripple",
      "Water Ripple Carousel",
      "สไลด์รูปใหญ่ กดตรงไหนวงน้ำกระจายจากจุดนั้นแล้วบิดภาพถัดไปให้ไหลเข้ามา มีลูกศร เส้นนับเวลา และเลื่อนเองตามเวลา",
      ["สไลด์", "น้ำ", "WebGL", "แตะ"],
      [range("strength", "แรงบิดของวงน้ำ", 0, 2, 0.1, 1)],
    ),
    prompt:
      "Build a full-width image carousel whose transition is a ring of water: clicking or tapping the picture starts a circular ripple at that point, and inside the expanding ring the next picture appears, refracted at the ring's edge by a WebGL fragment shader; arrow buttons start the ripple from the side they point to. Show a slide counter, a title and caption, and a thin progress line for autoplay. Strength sets how far the ring bends the picture. Keyboard arrows step; an aria-live label names the slide. Under prefers-reduced-motion it cross-fades instantly. Use your stack's design tokens for every colour.",
  },
  {
    ...def(
      "2026-11-20",
      "water-ui",
      "liquid-switch",
      "Liquid Toggle",
      "สวิตช์ที่ปุ่มเป็นหยดน้ำ กดแล้วหยดยืด ดีด และกระเพื่อมก่อนนิ่ง มีไอคอนพระอาทิตย์กับพระจันทร์ลอยในหยด และเสียงแผ่วเบาเลือกเปิดได้",
      ["สวิตช์", "น้ำ", "ปุ่ม", "WebGL"],
      [range("size", "ความสูง", 24, 56, 4, 36), toggle("sound", "เสียงหยดน้ำ", false)],
    ),
    prompt:
      "Build a switch whose knob is a drop of water: on toggle the drop stretches toward the other end, snaps across with a spring and ripples before it settles, rendered as a soft refractive blob over the track. Optional icons ride inside the drop (a sun when off, a moon when on). It is a real role=switch with aria-checked, works with Space and Enter, supports controlled and uncontrolled use and form submission, and can play a short synthesised plip on snap. Light and dark water tones. Transform and opacity only, instant under prefers-reduced-motion. Use your stack's design tokens for every colour.",
  },
  {
    ...def(
      "2026-11-20",
      "water-ui",
      "nimbus-nav",
      "Water Drop Navbar",
      "เมนูแคปซูลที่หยดน้ำไหลไปอยู่ใต้ลิงก์ที่เลือก ไอคอนแต่ละตัวเล่นฉากสั้นของตัวเองตอนกด เช่นโบกมือ หมุน เด้ง เรืองแสง หยดลง",
      ["เมนู", "น้ำ", "ไอคอน", "แคปซูล"],
      [toggle("compact", "ไอคอนอย่างเดียว", false)],
    ),
    prompt:
      "Build a pill-shaped navigation bar where the active link sits inside a drop of water: choosing another link makes the drop stretch and flow to it, then wobble and settle. Each link has an icon that plays its own tiny scene when picked (a wave, a spin, a pop, a glow, a drop falling). A compact mode shows icons only with the labels kept as accessible names. Links are real anchors or buttons with aria-current on the active one and arrow-key movement. Light and dark water tones; transform and opacity only, no flow under prefers-reduced-motion. Use your stack's design tokens for every colour.",
  },
  {
    ...def(
      "2026-11-20",
      "intro",
      "glass-logo-reveal",
      "Glass Logo Reveal",
      "หยดแก้ววางลงบนโลโก้ ขอบหยดหักเหแสงเป็นสีรุ้งบาง ๆ แล้วค่อยถอยออกให้เห็นโลโก้ชัด วนเล่นใหม่และกดเพื่อเล่นอีกครั้งได้",
      ["โลโก้", "แก้ว", "WebGL2", "อินโทร"],
      [range("hold", "วินาทีที่ค้างโลโก้", 1, 6, 0.5, 2)],
    ),
    prompt:
      "Build a logo reveal where a drop of glass lands on a logo tile: a WebGL2 shader refracts the logo through the drop, splitting a thin band of colour at its rim, then the drop draws back and leaves the logo sharp at its final scale. The canvas paints the page background colour so the edges disappear. It loops after a hold, and a click replays it. The logo can be an SVG string or a same-origin image. Provide an accessible name; under prefers-reduced-motion show the finished logo with no animation. Use your stack's design tokens for every colour.",
  },
  {
    ...def(
      "2026-11-20",
      "intro",
      "skeleton-key-intro",
      "Skeleton Key Preloader",
      "หน้าโหลดแรกเข้าเว็บ ตัวเลขนับขึ้นถึงร้อย คำในหน้าประกอบจากพิกเซล ตัวยก และลายมือ แล้วกุญแจหมุนในหน้าปัดและเปิดเข้าสู่หน้าเว็บผ่านรูกุญแจ",
      ["โหลด", "กุญแจ", "อินโทร", "ตัวนับ"],
      [
        text("word", "คำ", "crocwork", 12),
        pick("metal", "โลหะกุญแจ", ["gold", "silver", "rose", "bronze"], "silver"),
      ],
    ),
    prompt:
      "Build a first-visit preloader on paper: a percentage counts from 0 to 100 (real progress when given, simulated otherwise) while a handwritten version number ticks up; the wordmark is set in mixed faces, first letter as pixels, the next as a superscript, two letters inside a round dial and the rest in script. At 100 an ornate key slides into the dial and turns, and the page opens through the keyhole with a zoom. A key-only mode waits for the visitor to drop the key in. Paper and ink are theme colours; transform and opacity only, and under prefers-reduced-motion it skips straight to the page. Use your stack's design tokens for every colour.",
  },
  {
    ...def(
      "2026-11-20",
      "atmosphere",
      "murmuration-word",
      "Murmuration Wordmark",
      "ฝูงนกนับร้อยบินวนเป็นกลุ่มก้อนบนฟ้าแล้วรวมตัวเป็นคำ ค้างไว้สักพักแล้วแตกฝูงบินต่อ เมาส์เป็นเหยี่ยวที่ฝูงนกหนี",
      ["ฝูงนก", "คำ", "canvas", "บรรยากาศ"],
      [
        text("word", "คำ", "croc", 10),
        pick("preset", "ท้องฟ้า", ["dusk", "dawn", "paper", "night"], "dusk"),
      ],
    ),
    prompt:
      "Build a canvas scene where a murmuration of a few hundred starlings wheels across a sky, steered by a curl-noise flow around a drifting centre, then each bird flies to a point sampled from a word rendered offscreen, holds the word for a few seconds and breaks away again. The pointer acts as a hawk the flock bends away from. Sky presets (dusk, dawn, paper, night) set the gradient and bird colour, with reeds silhouetted along the bottom. Fewer birds on small screens; under prefers-reduced-motion draw the formed word still. Use your stack's design tokens for every colour.",
  },
  {
    ...def(
      "2026-11-20",
      "atmosphere",
      "hoarfrost-pane",
      "Hoarfrost Pane",
      "น้ำแข็งเกาะกระจกงอกเป็นลายเฟิร์นจากขอบหน้าต่างเข้าหากลาง ลากเมาส์หรือนิ้วเพื่อเช็ดฝ้าให้เห็นถนนด้านหลัง แล้วน้ำแข็งค่อย ๆ เกาะกลับ",
      ["น้ำแข็ง", "กระจก", "เช็ด", "canvas"],
      [range("coverage", "น้ำแข็งเกาะลึก", 0.2, 1, 0.05, 0.6)],
    ),
    prompt:
      "Build a frosted window pane: ice crystals grow in from the frame toward the centre as branching fern patterns (diffusion-limited growth on a grid, seeded from the edges), drawn on a canvas over a soft night street scene. Dragging the pointer or a finger wipes the frost away along the stroke, leaving clear glass that slowly frosts over again. Coverage sets how far the frost reaches in. The pane has an accessible description; under prefers-reduced-motion the frost appears fully grown and wiping still works without regrowth animation. Use your stack's design tokens for every colour.",
  },
];

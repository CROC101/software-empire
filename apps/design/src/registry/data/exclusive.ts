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
      "Lanyard Rail Team Badges · Lite",
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
      "team",
      "lanyard-rail-original",
      "Lanyard Rail Team Badges · V.original",
      "ต้นฉบับตามที่ผู้เขียนเผยแพร่บน 21st.dev ทั้งไฟล์ รุ่น Lite คือฉบับที่เราเขียนใหม่เองจากชิ้นนี้",
      ["ทีม", "บัตร", "ฟิสิกส์", "ต้นฉบับ"],
      [],
    ),
    prompt:
      "Build a team section where ID badges hang from one horizontal rail. Each badge has a strap, a reel and a clip above a card whose front shows a coloured band, initials in a round portrait, name, role, a team chip and a barcode generated from the name. Pointing at a badge sways it from the top (rotate keyframes, transform-origin at the strap) and lifts it forward with a spring; click or Enter flips it with rotateY 180 to a back with a short bio and tags (both faces backface-hidden). Every few seconds a breeze sways the next badge, paused while the pointer or focus is inside. ArrowLeft/Right, Home and End move focus along the rail, Escape turns the badge back, and an aria-live line names the badge in front. Narrow screens scroll the rail sideways with scroll-snap. Transform and opacity only, still under prefers-reduced-motion. Use your stack's design tokens for every colour.",
  },
  {
    ...def(
      "2026-11-20",
      "carousel",
      "orbit-swing",
      "Orbit Swing Carousel · Lite",
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
      "carousel",
      "orbit-swing-original",
      "Orbit Swing Carousel · V.original",
      "ต้นฉบับตามที่ผู้เขียนเผยแพร่บน 21st.dev ทั้งไฟล์ รุ่น Lite คือฉบับที่เราเขียนใหม่เองจากชิ้นนี้",
      ["สไลด์", "วงโคจร", "gsap", "ต้นฉบับ"],
      [],
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
  {
    ...def(
      "2026-11-20",
      "carousel",
      "curved-lens",
      "Curved Lens Carousel · Lite",
      "สไลด์ภาพที่มองผ่านเลนส์โค้ง ใบกลางแบนตรง ใบที่ออกห่างจากกลางยิ่งสูง ลึก และหันข้าง มีสีแยกที่ขอบเหมือนเลนส์ ลากหรือสะบัดแล้วหยุดที่ใบใกล้สุด วนไม่รู้จบ",
      ["สไลด์", "เลนส์", "3D", "ลาก"],
      [range("bend", "ความโค้งของเลนส์", 0, 2, 0.1, 1)],
    ),
    prompt:
      "Build a looping photo carousel seen through a curved lens. Cards share one position value; each card's signed distance from it (the short way round the loop) drives translateX, rotateY (turned away from the centre), scaleY (taller further out), a negative translateZ and opacity, so the centre card reads flat and the outer ones bend away. Two tinted copies behind each card slide apart with distance to fake chromatic split at the rim. Dragging sets the position directly; on release a flick picks the nearest whole card up to two away and a critically damped spring settles there. Arrow keys and buttons step; clicking a side card brings it to the centre. The caption rises in per slide and is announced politely. A bend value scales every effect; 0 is flat. Transform and opacity only, instant under prefers-reduced-motion. Use your stack's design tokens for every colour.",
  },
  {
    ...def(
      "2026-11-20",
      "carousel",
      "curved-lens-original",
      "Curved Lens Carousel · V.original",
      "ต้นฉบับ WebGL ของสไลด์เลนส์โค้ง การ์ดทุกใบวาดบนแคนวาสเดียว ใบนอกยืดสูงและโค้งตามเลนส์จริงพร้อมสีแยกที่ขอบ หัวเรื่องลอยขึ้นทีละตัว ลากหรือสะบัดแล้วสปริงหยุดที่ใบใกล้สุด",
      ["สไลด์", "เลนส์", "WebGL", "ลาก"],
      [range("bend", "ความโค้งของเลนส์", 0, 2, 0.05, 0.55)],
    ),
    prompt:
      "Build a looping photo carousel seen through a curved lens, drawn on one WebGL canvas. Each card is a 36 x 12 grid mesh; the vertex shader places it at its signed offset from a shared scroll position (the short way round the loop), then stretches it taller and pinches it narrower by bend * x squared, so the centre card is flat and the outer ones bulge like glass. The fragment shader covers the photo into the card, splits red and blue sideways more toward the rim and with speed, darkens the outer cards, adds a thin rounded rim of light and a soft top sheen. Cards rise in one after another on first view. Dragging moves the position directly; on release a flick throws to the nearest whole card up to three away and a critically damped spring settles there; arrow keys and two buttons step. Only run the frame loop while something moves and the stage is on screen. The title of the current slide rises in letter by letter in a large serif with its kicker and caption, a counter and a progress bar sit at the bottom right, and the caption region is announced politely. Fall back to a plain image without WebGL. Reduced motion: no intro, no spring, no wobble. Use your stack's design tokens for every colour.",
  },
  {
    ...def(
      "2026-11-20",
      "carousel",
      "arc-fan",
      "Spring Arc Fan · Lite",
      "การ์ดสิบใบกางเป็นพัดบนล้อที่มีจุดหมุนอยู่ไกลใต้เวที เวลาเลื่อน การ์ดใบนำขยับก่อนแล้วแรงส่งไล่ออกไปทีละใบเหมือนดีดสาย ตอนเปิดหน้าการ์ดลอยขึ้นแล้วกางออก",
      ["สไลด์", "พัด", "สปริง", "ปัด"],
      [range("gap", "องศาระหว่างการ์ด", 8, 24, 1, 16)],
    ),
    prompt:
      "Build a fanned wheel carousel of ten cards. Every card is absolutely centred at the bottom of the stage with transform-origin far below it (about 50% 280%), and rotates by (index - current) times a gap angle, so the deck reads as an arc. Each card animates on its own spring with a delay proportional to its distance from the current card, so a step starts at the leading card and ripples outward like a plucked string. On first view the cards rise from below and fan out from the centre. The current card lifts and grows slightly; cards fade with distance and z-order follows distance. Step with arrow buttons, ArrowLeft/Right, Home/End, a sideways swipe or a click on any card; the big label above is announced politely. No wheel or scroll hijacking. Transform and opacity only, instant under prefers-reduced-motion. Use your stack's design tokens for every colour.",
  },
  {
    ...def(
      "2026-11-20",
      "carousel",
      "arc-fan-original",
      "Chained Spring Arc Carousel · V.original",
      "ต้นฉบับตามที่ผู้เขียนเผยแพร่บน 21st.dev ทั้งไฟล์ รุ่น Lite คือฉบับที่เราเขียนใหม่เองจากชิ้นนี้",
      ["สไลด์", "พัด", "ต้นฉบับ"],
      [],
    ),
    prompt:
      "Build a fanned wheel carousel of ten cards. Every card is absolutely centred at the bottom of the stage with transform-origin far below it (about 50% 280%), and rotates by (index - current) times a gap angle, so the deck reads as an arc. Each card animates on its own spring with a delay proportional to its distance from the current card, so a step starts at the leading card and ripples outward like a plucked string. On first view the cards rise from below and fan out from the centre. The current card lifts and grows slightly; cards fade with distance and z-order follows distance. Step with arrow buttons, ArrowLeft/Right, Home/End, a sideways swipe or a click on any card; the big label above is announced politely. No wheel or scroll hijacking. Transform and opacity only, instant under prefers-reduced-motion. Use your stack's design tokens for every colour.",
  },
  {
    ...def(
      "2026-11-20",
      "carousel",
      "warp-ring",
      "Warp Ring Carousel · Lite",
      "การ์ดเรียงรอบทรงกระบอกแล้วหมุนเอง แต่ละรอบค่อย ๆ ออกตัว พุ่งเร็ว แล้วค่อย ๆ หยุด วงยืดออกนิดหนึ่งตอนพุ่ง การ์ดหน้าส่องแสงสีของตัวเองบนและล่าง ตัวเลขจาง ๆ ใหญ่สลับอยู่ข้างหลัง",
      ["สไลด์", "วงแหวน", "3D", "เล่นเอง"],
      [range("seconds", "วินาทีต่อรอบ", 2, 8, 0.5, 4)],
    ),
    prompt:
      "Build a ring carousel: six cards stand on a cylinder (each rotateY(k * 360/n) translateZ(r), with r about 0.95 of the card width) inside a preserve-3d stage pushed back by r under perspective. The ring rotates by -position * 360/n with a slow-fast-slow cubic-bezier (about 0.83, 0, 0.17, 1) over 1.4s, and turns one step on its own every few seconds, pausing while the pointer is over it or it has focus. On every turn the ring wrapper stretches scaleX 1 to 1.1 and back. Two soft blurred ellipses above and below the ring cross-fade to the front card's colour, and a huge faint two-digit numeral behind swaps with a short rise. Buttons and arrow keys step both ways; the title is announced politely. Transform and opacity only, no autoplay and instant changes under prefers-reduced-motion. Use your stack's design tokens for every colour.",
  },
  {
    ...def(
      "2026-11-20",
      "carousel",
      "warp-ring-original",
      "Warp Ring Carousel · V.original",
      "ต้นฉบับตามที่ผู้เขียนเผยแพร่บน 21st.dev ทั้งไฟล์ รุ่น Lite คือฉบับที่เราเขียนใหม่เองจากชิ้นนี้",
      ["สไลด์", "วงแหวน", "ต้นฉบับ"],
      [],
    ),
    prompt:
      "Build a ring carousel: six cards stand on a cylinder (each rotateY(k * 360/n) translateZ(r), with r about 0.95 of the card width) inside a preserve-3d stage pushed back by r under perspective. The ring rotates by -position * 360/n with a slow-fast-slow cubic-bezier (about 0.83, 0, 0.17, 1) over 1.4s, and turns one step on its own every few seconds, pausing while the pointer is over it or it has focus. On every turn the ring wrapper stretches scaleX 1 to 1.1 and back. Two soft blurred ellipses above and below the ring cross-fade to the front card's colour, and a huge faint two-digit numeral behind swaps with a short rise. Buttons and arrow keys step both ways; the title is announced politely. Transform and opacity only, no autoplay and instant changes under prefers-reduced-motion. Use your stack's design tokens for every colour.",
  },
  {
    ...def(
      "2026-11-20",
      "art-wall",
      "picture-rail",
      "Picture Rail Gallery · Lite",
      "ภาพพิมพ์ใส่กรอบแขวนด้วยลวดจากรางแขวนภาพ แต่ละภาพเอียงนิด ๆ ชี้แล้วภาพแกว่งจากตะขอ ภาพข้าง ๆ ขยับตาม มีไฟส่องจากด้านบน กดแล้วภาพหันหลังให้อ่านป้ายแกลเลอรี ถ้ายังไม่มีใครแตะ ไฟจะส่องทีละภาพเอง",
      ["แกลเลอรี", "กรอบภาพ", "แกว่ง", "พลิก"],
      [range("interval", "วินาทีที่ไฟส่องแต่ละภาพ", 2, 8, 0.5, 3)],
    ),
    prompt:
      "Build a gallery wall where framed prints hang from one picture rail. Each print is a thick moulding around a bevelled mat and the image, hung from a hook by two wires drawn in SVG to its top corners, with alternating wire lengths and a slightly crooked rest angle (about ±1.5deg). The hanging group rotates around its hook (transform-origin top). Pointing at or focusing a print kicks a damped swing (rotate keyframes rest, +6, -3.5, +1.5, rest degrees times an amplitude) and nudges its two neighbours at a third of the amplitude; alternate the sign per kick so each replays. The pointed print is lit by a radial spot from above and lifts with a spring. Click or Enter turns it with rotateY 180 to a back of brown paper with a gallery label (title, medium, size, year); Escape turns it back. Until the visitor interacts, the prints are lit one by one on an interval. A wall label under each frame and an aria-live line name the lit print. Narrow screens scroll the rail sideways with scroll-snap. Transform and opacity only, no swinging under prefers-reduced-motion. Use your stack's design tokens for every colour.",
  },
  {
    ...def(
      "2026-11-20",
      "art-wall",
      "picture-rail-original",
      "Picture Rail Gallery · V.original",
      "ต้นฉบับตามที่ผู้เขียนเผยแพร่บน 21st.dev ทั้งไฟล์ รุ่น Lite คือฉบับที่เราเขียนใหม่เองจากชิ้นนี้",
      ["แกลเลอรี", "ผนังภาพ", "ต้นฉบับ"],
      [],
    ),
    prompt:
      "Build a gallery wall where framed prints hang from one picture rail. Each print is a thick moulding around a bevelled mat and the image, hung from a hook by two wires drawn in SVG to its top corners, with alternating wire lengths and a slightly crooked rest angle (about ±1.5deg). The hanging group rotates around its hook (transform-origin top). Pointing at or focusing a print kicks a damped swing (rotate keyframes rest, +6, -3.5, +1.5, rest degrees times an amplitude) and nudges its two neighbours at a third of the amplitude; alternate the sign per kick so each replays. The pointed print is lit by a radial spot from above and lifts with a spring. Click or Enter turns it with rotateY 180 to a back of brown paper with a gallery label (title, medium, size, year); Escape turns it back. Until the visitor interacts, the prints are lit one by one on an interval. A wall label under each frame and an aria-live line name the lit print. Narrow screens scroll the rail sideways with scroll-snap. Transform and opacity only, no swinging under prefers-reduced-motion. Use your stack's design tokens for every colour.",
  },
  {
    ...def(
      "2026-11-20",
      "product",
      "sneaker-hero",
      "Sneaker Product Hero · Lite",
      "หน้าสินค้ารองเท้าหนึ่งคู่ รองเท้าลอยอยู่เหนือเงาสะท้อนบนพื้น เลือกสีแล้วรองเท้าหมุนสลับ ไซซ์บอกว่าหมดหรือใกล้หมด กดถูกใจแล้วหัวใจแตกเป็นจุด ใส่ถุงแล้วมีแถบแจ้งสั้น ๆ",
      ["สินค้า", "รองเท้า", "เลือกสี", "ร้านค้า"],
      [range("price", "ราคา (บาท)", 990, 9990, 100, 4290)],
    ),
    prompt:
      "Build a product hero for one sneaker. On the right, a side-profile shoe drawn in SVG from three colour roles (upper, accent, sole) floats with a slow bob and tilt over its own mirrored reflection, faded with a mask; a soft blurred halo in the upper colour sits behind. Picking a colourway swatch swaps the shoe: the old one leaves to the left with a small turn, the new one arrives from the right. On the left: eyebrow, name, star rating with count, short description, price, colour swatches (aria-pressed), a six-size grid where sold-out sizes for the colourway are disabled and struck through, and a polite live line that says pick a size, sold out, only N left or in stock. Add to bag is disabled until a size in stock is picked and shows a short status toast; the like button pops and bursts eight dots outward once. Transform and opacity only, no floating or bursts under prefers-reduced-motion. Use your stack's design tokens for every colour.",
  },
  {
    ...def(
      "2026-11-20",
      "product",
      "sneaker-hero-original",
      "Sneaker Product Hero · V.original",
      "ต้นฉบับตามที่ผู้เขียนเผยแพร่บน 21st.dev ทั้งไฟล์ รุ่น Lite คือฉบับที่เราเขียนใหม่เองจากชิ้นนี้",
      ["สินค้า", "รองเท้า", "gsap", "ต้นฉบับ"],
      [],
    ),
    prompt:
      "Build a product hero for one sneaker. On the right, a side-profile shoe drawn in SVG from three colour roles (upper, accent, sole) floats with a slow bob and tilt over its own mirrored reflection, faded with a mask; a soft blurred halo in the upper colour sits behind. Picking a colourway swatch swaps the shoe: the old one leaves to the left with a small turn, the new one arrives from the right. On the left: eyebrow, name, star rating with count, short description, price, colour swatches (aria-pressed), a six-size grid where sold-out sizes for the colourway are disabled and struck through, and a polite live line that says pick a size, sold out, only N left or in stock. Add to bag is disabled until a size in stock is picked and shows a short status toast; the like button pops and bursts eight dots outward once. Transform and opacity only, no floating or bursts under prefers-reduced-motion. Use your stack's design tokens for every colour.",
  },
  {
    ...def(
      "2026-11-20",
      "showcase",
      "project-deck",
      "Project Deck",
      "การ์ดงานที่แจกลงกองทีละใบ ใบใหม่ลอยขึ้นจากด้านล่างแล้ววางทับ ใบที่ถูกทับถอยหลังและยกขอบให้เห็นเป็นกอง ปุ่มเปิดงานฝังอยู่ในมุมที่ถูกตัดของการ์ด เล่นเองจนกว่าจะมีคนแตะ",
      ["ผลงาน", "การ์ดซ้อน", "สปริง", "เล่นเอง"],
      [range("seconds", "วินาทีต่อใบ", 2, 8, 0.5, 3.5)],
    ),
    prompt:
      "Build a project deck: five full-bleed project cards that deal onto one stack. Card k is either still below the stage (translateY about 115%, transparent) or dealt; a dealt card covered by m newer cards scales to 1 - 0.05m and lifts by 4% per card (capped at three, hidden beyond) with transform-origin top, so the pile shows its edges. Each card springs to its state. A notch cut from the bottom-right corner, filled with the page background and rounded on its inner corner, holds the square visit button. The deck deals on its own every few seconds and loops until the visitor touches it; up/down buttons, arrow keys and a vertical swipe deal or take back. The name, kind and year beside it are announced politely, with a 01 / 05 counter. Never pinned or tied to page scroll. Transform and opacity only, instant under prefers-reduced-motion. Use your stack's design tokens for every colour.",
  },
  {
    ...def(
      "2026-11-20",
      "product",
      "coffee-pour",
      "Coffee Pour Menu · Lite",
      "เมนูร้านกาแฟที่ชงให้ดูเมื่อเลือก แก้วเก่าเลื่อนออกจากบาร์ แก้วใสใบใหม่หล่นลงมา แล้วแต่ละชั้นเทลงจากด้านบนตามสูตรทีละชั้น เต็มแล้วมีไอน้ำลอย",
      ["เมนู", "กาแฟ", "ร้านค้า", "เท"],
      [range("pour", "วินาทีต่อชั้น", 0.4, 2, 0.1, 0.9)],
    ),
    prompt:
      "Build a café menu that builds the drink you pick. The menu is a list of buttons (name, short description, price, aria-pressed). The bar on the right holds one clear glass keyed by drink and pick count inside AnimatePresence popLayout: the old glass slides off to the side with a small tilt while the new one drops in on a spring. Each recipe is a list of layers (colour, height, name); layer k pours after k times the pour time: a thin stream in the layer colour grows down from above (scaleY from the top), then the layer rises from the bottom of the glass (scaleY from the bottom), stacked with flex-col-reverse. Once full, three soft blurred steam wisps drift up and fade in a loop. Brew colours are mixed from palette tokens with color-mix so they follow the theme. A small legend of layers is announced politely. The newest pick always wins. Transform and opacity only, no pouring or steam under prefers-reduced-motion. Use your stack's design tokens for every colour.",
  },
  {
    ...def(
      "2026-11-20",
      "product",
      "coffee-pour-original",
      "Coffee Pour Menu · V.original",
      "ต้นฉบับตามที่ผู้เขียนเผยแพร่บน 21st.dev ทั้งไฟล์ รุ่น Lite คือฉบับที่เราเขียนใหม่เองจากชิ้นนี้",
      ["เมนู", "กาแฟ", "ต้นฉบับ"],
      [],
    ),
    prompt:
      "Build a café menu that builds the drink you pick. The menu is a list of buttons (name, short description, price, aria-pressed). The bar on the right holds one clear glass keyed by drink and pick count inside AnimatePresence popLayout: the old glass slides off to the side with a small tilt while the new one drops in on a spring. Each recipe is a list of layers (colour, height, name); layer k pours after k times the pour time: a thin stream in the layer colour grows down from above (scaleY from the top), then the layer rises from the bottom of the glass (scaleY from the bottom), stacked with flex-col-reverse. Once full, three soft blurred steam wisps drift up and fade in a loop. Brew colours are mixed from palette tokens with color-mix so they follow the theme. A small legend of layers is announced politely. The newest pick always wins. Transform and opacity only, no pouring or steam under prefers-reduced-motion. Use your stack's design tokens for every colour.",
  },
  {
    ...def(
      "2026-11-20",
      "stories",
      "journal-spread",
      "Journal Spread · Lite",
      "สมุดบันทึกการเดินทางเปิดเป็นหน้าคู่ รูปติดด้วยขอบขาวหรือเทปกาว โน้ตบนกระดาษแผ่นเล็ก ภาพใหญ่พาดข้ามสองหน้าแล้วพับที่สันสมุด พลิกหน้าเองจนกว่าจะมีคนแตะ",
      ["สมุด", "พลิกหน้า", "3D", "เล่นเอง"],
      [range("seconds", "วินาทีต่อหน้า", 2, 10, 0.5, 4)],
    ),
    prompt:
      "Build a travel journal open on a double page. Each spread is described once at double width: an optional background picture plus photos (white polaroid border or a strip of translucent tape) and short notes, each placed by x, y and width as percentages of the whole spread with a small rotation, so items may cross the spine. Each page renders the full spread inside an overflow-clipped half (left page at 0, right page shifted by -100%), with a soft shade toward the spine. A page turn is a leaf over the right half with transform-origin at the spine and preserve-3d: forward, its front shows the current right page and its back the next left page while it rotates 0 to -180deg; backward is the reverse; under the leaf lie the destination pages, and the index commits on animation complete. Pages turn on their own every few seconds until the first touch; buttons, arrow keys and a sideways swipe turn by hand; the spread title and counter are announced politely. Transform and opacity only, instant changes under prefers-reduced-motion. Use your stack's design tokens for every colour.",
  },
  {
    ...def(
      "2026-11-20",
      "stories",
      "journal-spread-original",
      "Journal Spread · V.original",
      "ต้นฉบับตามที่ผู้เขียนเผยแพร่บน 21st.dev ทั้งไฟล์ รุ่น Lite คือฉบับที่เราเขียนใหม่เองจากชิ้นนี้",
      ["สมุด", "รูปถ่าย", "ต้นฉบับ"],
      [],
    ),
    prompt:
      "Build a travel journal open on a double page. Each spread is described once at double width: an optional background picture plus photos (white polaroid border or a strip of translucent tape) and short notes, each placed by x, y and width as percentages of the whole spread with a small rotation, so items may cross the spine. Each page renders the full spread inside an overflow-clipped half (left page at 0, right page shifted by -100%), with a soft shade toward the spine. A page turn is a leaf over the right half with transform-origin at the spine and preserve-3d: forward, its front shows the current right page and its back the next left page while it rotates 0 to -180deg; backward is the reverse; under the leaf lie the destination pages, and the index commits on animation complete. Pages turn on their own every few seconds until the first touch; buttons, arrow keys and a sideways swipe turn by hand; the spread title and counter are announced politely. Transform and opacity only, instant changes under prefers-reduced-motion. Use your stack's design tokens for every colour.",
  },
  {
    ...def(
      "2026-11-20",
      "showcase",
      "contribution-skyline",
      "Contribution Skyline · Lite",
      "ตารางกิจกรรมรายวันที่ลุกขึ้นเป็นแท่ง 3 มิติเมื่อเลื่อนมาเห็น สลับ 2D กับ 3D ได้ ชี้วันไหนบอกวันที่และจำนวน",
      ["สถิติ", "แคนวาส", "ไอโซเมตริก"],
      [range("weeks", "จำนวนสัปดาห์", 8, 53, 1, 26)],
    ),
    prompt:
      "Build an activity heatmap that stands up into a skyline. Draw a seeded sample of N weeks x 7 days on a canvas: each day is a square coloured by one of five levels (empty, then four steps of the brand blue). The first time it is half in view, morph it over 1.2 s into an isometric view where each square becomes a bar whose height is that day's count, with darker right and front faces, drawn back to front. A 2D / 3D toggle with aria-pressed morphs either way and stops any running morph. Pointing at a day shows a small tooltip with its date and count (hit-test the top faces, front-most wins). Show the total, the longest streak and the busiest day below. Read colours from CSS variables at draw time and redraw on resize. Reduced motion jumps straight to the chosen view. Use your stack's design tokens for every colour.",
  },
  {
    ...def(
      "2026-11-20",
      "showcase",
      "contribution-skyline-original",
      "Contribution Skyline · V.original",
      "ต้นฉบับตามที่ผู้เขียนเผยแพร่บน 21st.dev ทั้งไฟล์ รุ่น Lite คือฉบับที่เราเขียนใหม่เองจากชิ้นนี้",
      ["สถิติ", "แคนวาส", "ต้นฉบับ"],
      [],
    ),
    prompt:
      "Build an activity heatmap that stands up into a skyline. Draw a seeded sample of N weeks x 7 days on a canvas: each day is a square coloured by one of five levels (empty, then four steps of the brand blue). The first time it is half in view, morph it over 1.2 s into an isometric view where each square becomes a bar whose height is that day's count, with darker right and front faces, drawn back to front. A 2D / 3D toggle with aria-pressed morphs either way and stops any running morph. Pointing at a day shows a small tooltip with its date and count (hit-test the top faces, front-most wins). Show the total, the longest streak and the busiest day below. Read colours from CSS variables at draw time and redraw on resize. Reduced motion jumps straight to the chosen view. Use your stack's design tokens for every colour.",
  },
  {
    ...def(
      "2026-11-20",
      "spotlight",
      "comeback-poster",
      "Comeback Poster · Lite",
      "ฮีโร่แบบโปสเตอร์คอนเสิร์ต หัวกระดาษชื่อใหญ่กับคำธีม 12 คำ เหนือทุ่งดอกป๊อปปี้ที่ไหวตามลม ชี้คำแล้วชื่อถอดรหัส กดแล้วลมพัด",
      ["โปสเตอร์", "SVG", "ตัวอักษร"],
      [text("title", "ชื่อบนโปสเตอร์", "COMEBACK", 12)],
    ),
    prompt:
      "Build a gig-poster hero. A paper masthead holds a giant title and a grid of twelve theme words; under it a field of poppies on two hills with a hooded figure in a white robe. Poppies are SVG (stem, five petals, dark centre), seeded so server and client agree, sorted by depth, some behind the figure and some in front; each sways on its own loop and parts sideways round the pointer on a spring. Clicking the field blooms a clutch of five new poppies there (cap the total). Hovering or focusing a word decodes the title into it (letters settle left to right, the rest flicker); clicking keeps it (aria-pressed) and sends a gust that tilts the poppies one after another from left to right. The hood turns a few degrees toward the pointer. Screen readers get the title once from a visually hidden copy, not every flicker. Reduced motion: still field, words set without decoding. Use your stack's design tokens for every colour.",
  },
  {
    ...def(
      "2026-11-20",
      "spotlight",
      "comeback-poster-original",
      "Comeback Poster · V.original",
      "ต้นฉบับตามที่ผู้เขียนเผยแพร่บน 21st.dev ทั้งไฟล์ รุ่น Lite คือฉบับที่เราเขียนใหม่เองจากชิ้นนี้",
      ["โปสเตอร์", "SVG", "ต้นฉบับ"],
      [],
    ),
    prompt:
      "Build a gig-poster hero. A paper masthead holds a giant title and a grid of twelve theme words; under it a field of poppies on two hills with a hooded figure in a white robe. Poppies are SVG (stem, five petals, dark centre), seeded so server and client agree, sorted by depth, some behind the figure and some in front; each sways on its own loop and parts sideways round the pointer on a spring. Clicking the field blooms a clutch of five new poppies there (cap the total). Hovering or focusing a word decodes the title into it (letters settle left to right, the rest flicker); clicking keeps it (aria-pressed) and sends a gust that tilts the poppies one after another from left to right. The hood turns a few degrees toward the pointer. Screen readers get the title once from a visually hidden copy, not every flicker. Reduced motion: still field, words set without decoding. Use your stack's design tokens for every colour.",
  },
  {
    ...def(
      "2026-11-20",
      "footer",
      "doodle-crew-footer",
      "Doodle Crew Footer · Lite",
      "หน้าสุดท้ายของสมุดสเก็ตช์ ชื่อแบรนด์ตัวยักษ์ มีตัวการ์ตูนพิง นั่ง และโผล่หลังตัวอักษร ตามองตามเมาส์ กดแล้วกระโดดพูด",
      ["ฟุตเตอร์", "วาดมือ", "ตัวละคร"],
      [text("word", "คำยักษ์", "CROCWORK", 9)],
    ),
    prompt:
      "Build a footer like the last page of a sketchbook. The brand word (4 to 9 letters) is set huge in a heavy face; a hand-drawn ground line draws under it first, then the letters stamp in left to right (scale down from 1.6 on a spring), then a small crew of hand-drawn characters pops up: one leans on a letter, one sits on top, one peeks over from behind. Their pupils follow the pointer across the footer and they blink on their own loops. Clicking one (a real button with an accessible label) makes it hop and say a short line in a speech bubble. Doodles (star, loop, heart, cross, squiggle) drift down and turn; catching one pops it and it comes back from the top. Then a line of copy fades up word by word and two buttons rise. Letters wobble on hover. Reduced motion: everything in place, nothing drifts. Use your stack's design tokens for every colour.",
  },
  {
    ...def(
      "2026-11-20",
      "footer",
      "doodle-crew-footer-original",
      "Doodle Crew Footer · V.original",
      "ต้นฉบับตามที่ผู้เขียนเผยแพร่บน 21st.dev ทั้งไฟล์ รุ่น Lite คือฉบับที่เราเขียนใหม่เองจากชิ้นนี้",
      ["ฟุตเตอร์", "วาดมือ", "ต้นฉบับ"],
      [],
    ),
    prompt:
      "Build a footer like the last page of a sketchbook. The brand word (4 to 9 letters) is set huge in a heavy face; a hand-drawn ground line draws under it first, then the letters stamp in left to right (scale down from 1.6 on a spring), then a small crew of hand-drawn characters pops up: one leans on a letter, one sits on top, one peeks over from behind. Their pupils follow the pointer across the footer and they blink on their own loops. Clicking one (a real button with an accessible label) makes it hop and say a short line in a speech bubble. Doodles (star, loop, heart, cross, squiggle) drift down and turn; catching one pops it and it comes back from the top. Then a line of copy fades up word by word and two buttons rise. Letters wobble on hover. Reduced motion: everything in place, nothing drifts. Use your stack's design tokens for every colour.",
  },
  {
    ...def(
      "2026-11-20",
      "footer",
      "signature-pen-footer",
      "Signature Pen Footer · Lite",
      "ปากกาสไตลัสร่อนเข้ามาเซ็นชื่อทีละเส้น ยกปากการะหว่างเส้น เซ็นเสร็จบรรทัดล่างกลายเป็นเวลาที่เซ็น แล้วลากเขียนเองได้",
      ["ฟุตเตอร์", "ลายเซ็น", "SVG"],
      [text("name", "ชื่อในคำอธิบาย", "crocwork")],
    ),
    prompt:
      "Build a footer that signs itself. The signature is a few single-stroke SVG paths drawn in order (the run, a cross, a dot, an underline swash), each hidden with a dash array until written. When in view a stylus glides in lifted, its shadow on the paper closes in as the nib touches down, it writes each stroke at a steady speed by following getPointAtLength and revealing the dash, leans a little into its travel, lifts between strokes, then rests to the right. Write every frame straight to the DOM through refs so React does not re-render. When it lifts, the caption under the signing line becomes 'signed at <date, time> - ID <short hash of the name>'. Afterwards the pen hovers after a mouse or stylus pointer, pressing writes ink that dries and fades away, and a 'sign again' button replays it (cancel any run in progress). The copy above fades up word by word. Reduced motion: signature shown, pen at rest, no free drawing. Use your stack's design tokens for every colour.",
  },
  {
    ...def(
      "2026-11-20",
      "footer",
      "signature-pen-footer-original",
      "Signature Pen Footer · V.original",
      "ต้นฉบับตามที่ผู้เขียนเผยแพร่บน 21st.dev ทั้งไฟล์ รุ่น Lite คือฉบับที่เราเขียนใหม่เองจากชิ้นนี้",
      ["ฟุตเตอร์", "ลายเซ็น", "ต้นฉบับ"],
      [],
    ),
    prompt:
      "Build a footer that signs itself. The signature is a few single-stroke SVG paths drawn in order (the run, a cross, a dot, an underline swash), each hidden with a dash array until written. When in view a stylus glides in lifted, its shadow on the paper closes in as the nib touches down, it writes each stroke at a steady speed by following getPointAtLength and revealing the dash, leans a little into its travel, lifts between strokes, then rests to the right. Write every frame straight to the DOM through refs so React does not re-render. When it lifts, the caption under the signing line becomes 'signed at <date, time> - ID <short hash of the name>'. Afterwards the pen hovers after a mouse or stylus pointer, pressing writes ink that dries and fades away, and a 'sign again' button replays it (cancel any run in progress). The copy above fades up word by word. Reduced motion: signature shown, pen at rest, no free drawing. Use your stack's design tokens for every colour.",
  },
  {
    ...def(
      "2026-11-20",
      "footer",
      "string-tie-footer",
      "String Tie Footer · Lite",
      "ฟุตเตอร์ซองจดหมายผูกเชือกพันกระดุม เชือกพันเป็นเลขแปดเมื่อเห็น แล้วลายเซ็นเขียนตัวเอง กดกระดุมแล้วเชือกคลาย ฝาพับเปิด จดหมายเลื่อนออกมา",
      ["ฟุตเตอร์", "ซองจดหมาย", "3D"],
      [text("email", "อีเมลบนจดหมาย", "hello@example.com")],
    ),
    prompt:
      "Build a string-and-button envelope as a footer. A dark envelope body with a white pointed flap on top, held shut by two blue paper buttons with grommets, one on the flap's tip and one on the body. When in view the cord draws itself as a figure eight wound round both buttons (pathLength), a loose end sways from the lower button, then a short signature writes itself in on the body. Pressing either button (real buttons with aria-expanded) unwinds the cord, folds the flap back with a 3D rotateX round its top edge, and slides a note up out of the envelope with a thank-you line and a mailto link that is only focusable while open. Pressing again reverses it. Reduced motion: every change is instant. Use your stack's design tokens for every colour.",
  },
  {
    ...def(
      "2026-11-20",
      "footer",
      "string-tie-footer-original",
      "String Tie Footer · V.original",
      "ต้นฉบับตามที่ผู้เขียนเผยแพร่บน 21st.dev ทั้งไฟล์ รุ่น Lite คือฉบับที่เราเขียนใหม่เองจากชิ้นนี้",
      ["ฟุตเตอร์", "ซองจดหมาย", "ต้นฉบับ"],
      [],
    ),
    prompt:
      "Build a string-and-button envelope as a footer. A dark envelope body with a white pointed flap on top, held shut by two blue paper buttons with grommets, one on the flap's tip and one on the body. When in view the cord draws itself as a figure eight wound round both buttons (pathLength), a loose end sways from the lower button, then a short signature writes itself in on the body. Pressing either button (real buttons with aria-expanded) unwinds the cord, folds the flap back with a 3D rotateX round its top edge, and slides a note up out of the envelope with a thank-you line and a mailto link that is only focusable while open. Pressing again reverses it. Reduced motion: every change is instant. Use your stack's design tokens for every colour.",
  },
  {
    ...def(
      "2026-11-20",
      "menu",
      "link-preview",
      "Link Preview",
      "ลิงก์ในข้อความที่ชี้แล้วการ์ดภาพหน้าเว็บปลายทางลอยขึ้นมาตามเมาส์ เปิดดูก่อนกดได้",
      ["ลิงก์", "การ์ดลอย", "hover"],
      [],
    ),
    prompt:
      "Build an inline link that previews its page. Wrap a link in a hover card (open after a short delay, close on leave). The card holds a screenshot of the target page: either a fixed image passed in, or one built from a screenshot service URL with the page URL and a fixed viewport. The card springs up from below with a slight scale, follows the pointer sideways on a spring (translate x from the pointer's offset inside the trigger), and links to the same page. Preload the image when the link mounts so the card opens with the picture ready. Keyboard focus opens it too. Use your stack's design tokens for every colour.",
  },
  {
    ...def(
      "2026-11-20",
      "menu",
      "user-dropdown",
      "User Dropdown",
      "เมนูบัญชีจากรูปโปรไฟล์ หัวการ์ดมีชื่อกับสถานะ เลือกสถานะจากเมนูย่อย รายการมีไอคอนกับป้าย",
      ["เมนู", "บัญชี", "dropdown"],
      [],
    ),
    prompt:
      "Build an account menu opened from the user's avatar. The panel's header shows the avatar, name, handle and a small coloured status badge. Below it: a submenu to set the status (radio items with icons), then groups of items (profile, appearance, settings, notifications; plan, referrals; download apps, what's new; log out), each a row with a leading icon and, where it applies, a trailing badge, a small avatar or an external-link icon. Separators between groups. Use an accessible dropdown menu primitive so arrow keys, typeahead and escape work. Use your stack's design tokens for every colour.",
  },
  {
    ...def(
      "2026-11-20",
      "scroll-text",
      "text-scroll",
      "Text Scroll Animation",
      "ตัวอักษรแตกกระจายแล้วไหลกลับมาเรียงเป็นคำเมื่อเลื่อนหน้า 3 แบบ ตัวอักษรบิดหมุน ตัวอักษรตกลงมา และไอคอนที่หุบเข้ากลาง",
      ["ตัวอักษร", "สกอลล์", "3D"],
      [],
    ),
    prompt:
      "Build three scroll-driven type scenes, each a tall section with a sticky stage. In each, split a word into characters and drive them from the section's scroll progress (0 to 0.5): first the letters start pushed out from the centre and turned on X by their distance from the middle, then settle in a row; second they start spread and lifted by their distance and fall into place; third a row of small icons between brackets starts spread and rotated and closes into the centre. Use transforms only. Use your stack's design tokens for every colour.",
  },
  {
    ...def(
      "2026-11-22",
      "studio-hero",
      "grid-pulse",
      "Grid Pulse",
      "ตารางเส้นบางที่สว่างเป็นสีรุ้งตรงที่เมาส์ผ่านแล้วค่อยดับ ไม่ทับตัวหนังสือที่ติด data-grid-avoid",
      ["พื้นหลัง", "ตาราง", "เมาส์"],
      [],
    ),
    prompt:
      "Build a hero background: a fine CSS grid of hairlines (foreground at 7%) with a canvas on top. Cells near the pointer light up in a hue spectrum and fade a moment later; a few ambient cells pulse on their own. Read the theme from the inherited text colour to pick a light or dark lightness ladder. Never light cells under text marked data-grid-avoid. Mask the bottom edge so the next section climbs over it. Reduced motion: grid only.",
  },
  {
    ...def(
      "2026-11-22",
      "studio-hero",
      "shiny-text-rb",
      "Shiny Text · React Bits",
      "React Bits Shiny Text ต้นฉบับ แสงวิ่งผ่านตัวหนังสือ ใช้กับธีมมืด",
      ["ข้อความ", "แสง", "ต้นฉบับ"],
      [],
    ),
    prompt:
      "Render text clipped to a background so a soft band of light sweeps across it on a loop: base colour plus a shine colour, configurable angle, width, softness, speed and delay. Pause when off screen. Use for dark themes, with colours from your design tokens.",
  },
  {
    ...def(
      "2026-11-22",
      "studio-hero",
      "tech-text",
      "Tech Text · V.original",
      "React Bits Tech Text ต้นฉบับ ตัวหนังสือบนแคนวาสมีเส้นไกด์ประ ป้ายวัดขนาด และจุดเล็ก ๆ ตามเมาส์ ใช้กับธีมสว่าง",
      ["ข้อความ", "แคนวาส", "ต้นฉบับ"],
      [],
    ),
    prompt:
      "Draw a headline on a canvas like a type specimen: near the pointer, dashed guide lines, metric labels and small specks reveal letter by letter, letters can be dragged and spring back. Resolve colours from design tokens before drawing (a canvas cannot read CSS variables). Expose the text through role=img and aria-label. Use for light themes.",
  },
  {
    ...def(
      "2026-11-22",
      "studio-hero",
      "hub-hero-gridpulse",
      "Hub Hero · Grid Pulse",
      "hero หน้าแรกของ hub ชุดก่อน Provably: ตาราง Grid Pulse ด้านหลัง หัวข้อ Shiny Text ตอนมืด Tech Text ตอนสว่าง และแถบภาพหน้าจอเลื่อนช้า ๆ ด้านล่าง",
      ["hero", "ประวัติ", "ตาราง", "ภาพหน้าจอ"],
      [],
    ),
    prompt:
      "Build a full-viewport light hero with no WebGL. Behind everything, a fine hairline grid whose cells light up near the pointer and fade. Centre: a small chip (a Latin mono label plus a short line), a two-line headline (on dark themes a sweeping shine across the text, on light themes a canvas type-specimen headline whose second line is the accent blue), a muted lead line and two buttons. Along the bottom, a band of 16:10 screenshots slides sideways forever as one CSS transform loop, cards tilted a few degrees, edges masked to transparent. Reduced motion: text in place, band still. Colours from design tokens only.",
  },
  {
    ...def(
      "2026-11-22",
      "studio-hero",
      "provably",
      "Provably · Lite",
      "hero Provably ในคำของ crocwork ตามที่ hub ใช้ สวิตช์ตรวจระบบแทนตัวอักษรแรกของคำสุดท้าย การ์ดระบบย่อยเอียงซ้อนกัน ตัวเลขระบบที่เปิดใช้ และตรา TESTED IN CI ซ่อน navbar ของตัวเองให้หน้าเว็บใช้ของเดิม",
      ["hero", "สวิตช์", "การ์ด", "ตรา"],
      [],
    ),
    prompt:
      "Build a full-viewport white hero on a thin grid. Left: a Latin eyebrow chip, a two-line headline whose letters rise one by one (split by grapheme so Thai marks stay on their letter), then a last line where a pill switch stands in for the first letter; flipping it turns the page from 'not checked' to 'checked': a soft wave washes across, a stats card counts up the live number with a state word, and a stack of three tilted sample cards (title, maker, four skills, accent colour per card from a token) settles flatter and shows a status. A round stamp in the corner rotates and flips to a short explanation. Two actions under a muted lead line. Hide the hero's own navbar when there is no brand and no links, so the host page keeps its own. Respect reduced motion.",
  },
  {
    ...def(
      "2026-11-22",
      "studio-hero",
      "provably-original",
      "Provably · V.original",
      "ต้นฉบับตามที่ได้มาทั้งไฟล์ hero แพลตฟอร์มใบรับรอง มี navbar ของตัวเอง สวิตช์ Verify แทนตัวอักษรแรก การ์ดใบรับรองเอียงซ้อน ตัวนับทักษะ ตรา OFFICIALLY VERIFIED และแถบโลโก้ (ข้อความตัวอย่างภาษาอังกฤษของผู้สร้าง)",
      ["hero", "ต้นฉบับ", "สวิตช์", "ใบรับรอง"],
      [],
    ),
    prompt:
      "Build a certification-platform hero exactly like this: a white panel on a faint grid with a top navbar (brand, three links, a contact button). Headline 'We make / skills / official.' where the first letter of 'official' is a pill switch labelled 'Verify skills'. Turning it on sends a wave across the panel, a stats card counts to 125,000+ and switches 'completed' to 'verified', and a stack of three tilted credential cards (Product Design, Data Analysis, UX Writing, each with an accent colour and four skills) straightens and shows Verified; a card can be opened and its link copied. A rotating round stamp reads READY TO VERIFY / OFFICIALLY VERIFIED and flips to a back face. Under the panel a 'Trusted by' strip of six logos. Autoplay verifies after a few seconds; reduced motion shows the settled state.",
  },
  {
    ...def(
      "2026-11-22",
      "studio-hero",
      "marquee-hero",
      "Marquee Hero · Lite",
      "ฮีโร่สว่างไม่มี WebGL หัวข้อลอยขึ้นทีละคำ แถบภาพหน้าจอจริงเลื่อนวนด้านล่าง แต่ละใบเอียงนิด ๆ วนด้วย CSS ล้วน ไม่กินสคริปต์ต่อเฟรม",
      ["ฮีโร่", "มาร์คี", "ภาพหน้าจอ"],
      [],
    ),
    prompt:
      "Build a light hero with no WebGL: a pill chip, a two-line headline whose words rise one after another on a spring (the second line in the accent), a lead line and the actions. Along the bottom a band of real screenshots slides forever: render the list twice in one row and move the row by -50% with a linear CSS keyframe, so it costs no script per frame. Tilt cards alternately -2 and 3 degrees and fade the band in and out at its top and bottom with a mask. Serve the screenshots at twice their shown size so they stay sharp on retina. Reduced motion: text in place, band still. Use your stack's design tokens for every colour.",
  },
  {
    ...def(
      "2026-11-22",
      "studio-hero",
      "marquee-hero-original",
      "Marquee Hero · V.original",
      "ต้นฉบับ hero-3 (AnimatedMarqueeHero) หัวข้อลอยขึ้นทีละคำ ปุ่มเด้งเมื่อชี้ แถบภาพแนวตั้งเลื่อนวนด้านล่าง",
      ["ฮีโร่", "มาร์คี", "ต้นฉบับ"],
      [],
    ),
    prompt:
      "Build a centred hero: a pill tagline, a large headline whose words fade up one by one on a spring stagger, a description and one rounded call to action that grows on hover and shrinks on press. In the bottom third, a row of portrait images (the list twice) slides forever with motion's animate x from -100% to 0%, 40 s linear, each card tilted -2 or 5 degrees, the band masked to fade at its top and bottom. Use your stack's design tokens for every colour.",
  },
  {
    ...def(
      "2026-11-22",
      "studio-hero",
      "glass-trust-hero",
      "Glass Trust Hero",
      "ฮีโร่มืดสไตล์กระจก ซ้ายเป็นหัวข้อใหญ่และปุ่ม ขวาเป็นการ์ดตัวเลขพร้อมแถบความพึงพอใจ และการ์ดโลโก้ลูกค้าเลื่อนวน ทุกส่วนค่อย ๆ ลอยขึ้นตามลำดับ",
      ["ฮีโร่", "กระจก", "ตัวเลข", "มาร์คี"],
      [],
    ),
    prompt:
      "Build a dark hero in two columns over a faint photo masked to fade at the bottom. Left: a glass badge with a star, a three-line headline with the middle word in a light-to-gold text gradient, a muted paragraph and two rounded buttons (solid light, and glass with a play icon). Right: a glass stats card (icon tile, big figure, a labelled progress bar, a hairline, three mini stats split by thin rules, and pills including a pinging live dot) and a glass card whose client logos scroll forever as one CSS loop masked at both sides. Everything fades up in order with short staggered delays. Reduced motion: no fades, no loop. Use your stack's design tokens for every colour.",
  },
  {
    ...def(
      "2026-11-22",
      "studio-hero",
      "status-live",
      "Status · Live",
      "แถบมืดของหน้า hub บอกสถานะระบบจริง ตัวเลขหมุนขึ้น ป้ายพลิกบอกชื่อระบบที่ออนไลน์ และเทอร์มินัล crocwork status พร้อมป้ายเปิดใช้แล้ว / กำลังทำ",
      ["สถานะ", "เทอร์มินัล", "ตัวเลข", "มืด"],
      [],
    ),
    prompt:
      "Build a dark status band: a faint square grid masked to a soft ellipse. Left: a mono eyebrow with a pinging live dot, a two-line black headline (second line in the accent), an intro, three glass stat cards whose numbers roll to their value, and a split-flap board cycling '<APP> ONLINE' for each live app. Right: a terminal card with a gradient hairline rim and a coloured shadow, three window dots, '$ crocwork status' then one row per app with a pill (live or in progress), then a short quote command. Only real data. Use your stack's design tokens for every colour.",
  },
  {
    ...def(
      "2026-11-22",
      "studio-hero",
      "storm-hero",
      "Storm Hero",
      "Hero เต็มจอที่รวมเมฆ WebGL กับวิดีโอกลางคืนเป็นท้องฟ้าเดียว วิดีโอซ้อนแบบ screen ย้อมเป็นสีน้ำเงิน มีฟ้าแลบในเมฆเป็นระยะ เมฆ วิดีโอ และตัวหนังสือขยับคนละระยะตามเมาส์ หัวข้อใหญ่ค่อยๆ ชัดจากเบลอทีละตัว คำท้ายบรรทัดล่างเปลี่ยนเรื่อยๆ และตัวเลขจริงเรียงด้านล่าง",
      ["hero", "เมฆ", "วิดีโอ", "WebGL", "parallax"],
      [
        text("line1", "หัวข้อ บรรทัด 1", "ระบบที่ผมสร้าง", 40),
        text("line2", "หัวข้อ บรรทัด 2", "ทำงานได้จริง", 40),
        text("lead", "ข้อความหน้าคำที่เปลี่ยน", "ทีมของผม =", 40),
        range("seconds", "วินาทีต่อคำ", 1.5, 6, 0.5, 2.5),
      ],
    ),
    prompt:
      "Build a full-height hero that blends two skies into one. Back layer: a WebGL cloud sky (one fragment shader, a vertical gradient, a soft glow top right, drifting billow-noise clouds; colours from design tokens, re-read when the theme flips). Over it: a muted looping background video, object-cover, mix-blend-mode screen so its black drops out and only its light stays, tinted toward the brand blue with a hue-rotate filter, played only while the hero is on screen and dimmer on phones. Then a lightning layer: a radial glow at the top right that flashes twice every nine seconds and is otherwise invisible. Then a dark scrim from the left and from the bottom so white text stays readable, and a faint 8 by 12 grid. Pointer parallax: write the pointer position as two CSS variables (-1..1) once per animation frame and let each layer translate by its own distance (clouds a little, the video more, the text slightly the other way) with a 700ms ease-out transition; skip it on touch screens. Content: an eyebrow with a short rule, a very large two-line headline (clamp up to about 8.5rem, heavy weight, tight leading) whose letters, split by grapheme, each come out of a 20px blur with a 38ms stagger that runs on across both lines, a full-text screen-reader-only copy, a line under it whose last word changes every few seconds with the same blur-in, the actions, and three true numbers along the bottom in a three-column row with a hairline on top of each. Reduced motion: one still frame, the video paused, no flashes, no parallax. Use your stack's design tokens for every colour.",
  },
  {
    ...def(
      "2026-11-22",
      "studio-hero",
      "cloud-hero",
      "Cloud Hero · Lite",
      "Hero เต็มจอบนท้องฟ้าที่มีเมฆลอยผ่าน (ธีมมืดเป็นคืนเดือนหงาย) หัวข้อใหญ่ บรรทัดใต้หัวข้อมีคำที่ตัวอักษรค่อยๆ ชัดขึ้นจากเบลอทีละตัว ปุ่ม และตัวเลขจริงเรียงด้านล่าง",
      ["hero", "เมฆ", "WebGL", "ท้องฟ้า"],
      [
        text("line1", "หัวข้อ บรรทัด 1", "ระบบที่ผมสร้าง", 40),
        text("line2", "หัวข้อ บรรทัด 2", "ทำงานได้จริง", 40),
        text("lead", "ข้อความหน้าคำที่เปลี่ยน", "ผมทำเองทุกขั้น", 40),
        range("seconds", "วินาทีต่อคำ", 1.5, 6, 0.5, 2.5),
      ],
    ),
    prompt:
      "Build a full-height hero over a WebGL sky. One fragment shader draws a vertical sky gradient, a soft light glow at the top right and six clouds drifting sideways at different speeds and heights; each cloud is a dome-topped ellipse filled with domain-warped billow noise and shaded by a second density sample above it, and far clouds fade toward the sky colour. Take the sky, cloud and glow colours from design tokens: a day sky in the light theme, a deep night sky with grey clouds and a pale moon glow in the dark theme, re-read when the theme flips. Pause the loop when off screen or the tab is hidden, and draw one still frame under reduced motion. Over it: a dark scrim from the left so white text stays readable, a faint 8 by 12 grid, an eyebrow with a short rule, a heavy two-line headline, a line under it whose last word changes every few seconds with each letter (split by grapheme) fading in from a 20px blur with a tinted start colour and a 45ms stagger, the actions, and three true numbers along the bottom. Keep the full word list in a screen-reader-only span. Use your stack's design tokens for every colour.",
  },
  {
    ...def(
      "2026-11-22",
      "studio-hero",
      "water-tribe-hero",
      "Water Tribe Hero",
      "Hero เดิมของ crocwork แบบเผ่าน้ำ ป้ายแก้วมีแสงวิ่งผ่านชื่อ หัวข้อหนาบรรทัดท้ายนับเลขขึ้นเป็นสีน้ำ ขีดเส้นใต้แบบมือวาด กล่องแก้วที่ตำแหน่งในทีมผลัดกันโผล่ขึ้นมา และต้นไม้ริมน้ำที่ผลไม้คือระบบต่างๆ ตามฤดูกาล",
      ["hero", "เผ่าน้ำ", "ต้นไม้", "ฤดูกาล"],
      [
        text("line1", "หัวข้อ บรรทัด 1", "ระบบที่ผมสร้าง", 40),
        text("line2", "หัวข้อ บรรทัด 2", "ทำงานได้จริง", 40),
        range("count", "จำนวนระบบ", 1, 12, 1, 7),
        pick(
          "season",
          "ฤดู / เทศกาล",
          [
            "theme",
            "bloom",
            "rain",
            "snow",
            "space",
            "songkran",
            "loykrathong",
            "halloween",
            "christmas",
            "newyear",
          ],
          "theme",
        ),
      ],
    ),
    prompt:
      "Build a two-column hero. Left: a glass chip (translucent background, hairline border, inner top highlight) with a small dot, the studio name in small mono caps with a light glint sweeping across it now and then, and a short tagline; a heavy three-line headline whose last line reads 'all N systems' with N counting up from zero, set in a sky-to-blue water gradient over a hand-drawn underline (one uneven SVG stroke); a glass box reading 'my team =' followed by role names that rotate every 2.4 seconds, each sliding up letter by letter from a clipped line so the slot is never blank; then a solid primary button and a glass secondary button. Right: an illustrated tree by the water whose fruit are links to the systems and whose foliage follows the season. Stack on phones with the scene after the headline. Use your stack's design tokens for every colour.",
  },
  {
    ...def(
      "2026-11-22",
      "studio-hero",
      "cloud-hero-original",
      "Cloud Hero · V.original",
      "ต้นฉบับตามที่ได้มาทั้งไฟล์ วิดีโอพื้นหลังเต็มจอ เส้นกริดจางๆ หัวข้อใหญ่ชิดซ้ายที่คำท้ายเปลี่ยนทุก 2.5 วินาทีโดยตัวอักษรค่อยๆ ชัดจากเบลอเป็นสีรุ้งแล้วกลายเป็นขาว และตัวเลข 3 ชุดด้านล่าง รุ่นของเราคือ Cloud Hero",
      ["hero", "วิดีโอ", "ต้นฉบับ"],
      [],
    ),
    prompt:
      "Build a full-screen black hero with a looping muted background video (object-cover, 80% opacity) under two scrims: a left-to-right dark gradient for the text side and a top-to-bottom one for the bottom edge. Add a faint grid of 8 horizontal and 12 vertical hairlines. On the left, an eyebrow in small mono with a short rule before it, then a huge left-aligned two-line headline whose last word cycles through a list every 2.5 seconds: each letter animates from opacity 0 and a 20px blur to sharp over 500ms with a cubic ease-out and a 45ms stagger, tinted along a colour ramp while it settles, then turns white. The eyebrow and headline fade up on mount. Along the bottom, three metrics, each a big value over a small muted label. Use your stack's design tokens for every colour.",
  },
  {
    ...def(
      "2026-11-22",
      "atmosphere",
      "cloud-sky",
      "Cloud Sky · Lite",
      "ท้องฟ้า WebGL มีเมฆฟูลอยผ่าน สีมาจาก token ของธีม กลางวันเป็นฟ้าใส ธีมมืดเป็นคืนเดือนหงายเมฆสีเทา หยุดวาดเมื่อเลื่อนพ้นจอ ใส่เนื้อหาซ้อนด้านบนได้",
      ["เมฆ", "WebGL", "shader", "ท้องฟ้า"],
      [range("speed", "ความเร็ว", 0, 3, 0.1, 1), range("count", "จำนวนเมฆ", 1, 6, 1, 6)],
    ),
    prompt:
      "Build a WebGL1 cloud sky as a box that fills its parent and holds children on top. A full-screen triangle runs one fragment shader: a vertical sky gradient, a soft glow at the top right (sun by day, a pale moon at night), and up to six clouds drifting sideways at their own speed and height, wrapping around; each cloud is a dome-topped ellipse whose edge is broken by domain-warped billow noise, with a second density sample above it for self-shadow, and far clouds fade toward the sky. Read every colour from design tokens at runtime and re-read them when the theme class flips: a clear day sky in light, a deep night sky with grey clouds in dark. Pause the loop when the box is off screen or the tab is hidden, draw one still frame under reduced motion, and show the sky gradient alone without WebGL. Props: speed and cloud count. Use your stack's design tokens for every colour.",
  },
  {
    ...def(
      "2026-11-22",
      "atmosphere",
      "cloud-sky-original",
      "Cloud Sky · V.original",
      "ต้นฉบับตามที่ได้มาทั้งไฟล์ ท้องฟ้า WebGL มีเมฆฟูลอยผ่าน 6 ก้อน แสงแดดมุมขวาบน เมฆบางชั้นสูง ปรับความเร็วกับจำนวนเมฆได้ รุ่นของเราคือ Cloud Sky",
      ["เมฆ", "WebGL", "shader", "ต้นฉบับ"],
      [range("speed", "ความเร็ว", 0, 3, 0.1, 1), range("count", "จำนวนเมฆ", 1, 6, 1, 6)],
    ),
    prompt:
      "Build a WebGL1 cloud sky as a box that fills its parent and can hold children centred on top. A full-screen triangle runs one fragment shader: a vertical gradient between a top and a bottom sky colour, a horizon haze, a soft sun glow at the top right, a thin band of cirrus streaks from stretched fbm noise, and up to six clouds that drift sideways at their own speed and height and wrap around. Each cloud is an ellipse with a taller dome on top whose edge is broken by domain-warped billow noise; a second density sample above it darkens the underside for self-shadow, a soft rim catches the light, and far clouds blend toward the sky. Props: speed, count, cloud colour and the two sky colours (hex). Resize with a ResizeObserver at up to 2x device pixels and hold time at zero under reduced motion. Use your stack's design tokens for every colour.",
  },
];

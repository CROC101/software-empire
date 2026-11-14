import { useEffect } from "react";
import { readLang, type Lang } from "@empire/core/lang";
import { contacts } from "@empire/core/subsystems";
import { CRAFT_APPS, downloads, releaseUrl } from "@/lib/craft-apps";

type Text = Record<Lang, string>;

const COPY = {
  title: { th: "คู่มือแอป crocwork", en: "crocwork apps guide" },
  lead: {
    th: "วิธีเปิด ติดตั้ง และเริ่มใช้แอปตัวเต็มของ crocwork ทุกตัวฟรี ไม่ต้องมีคีย์หรือบัญชีเสียเงิน",
    en: "How to open, install and start using crocwork's Pro apps. All free, with no keys or paid accounts.",
  },
  startTitle: { th: "เริ่มต้น", en: "Getting started" },
  apps: { th: "แอปทีละตัว", en: "App by app" },
  open: { th: "เปิดในเว็บ", en: "Open on the web" },
  install: { th: "ตัวติดตั้ง Windows", en: "Windows installer" },
  help: { th: "ติดปัญหา หรืออยากเสนอไอเดีย", en: "Stuck, or have an idea?" },
  helpNote: {
    th: "ทักมาได้ทุกช่องทางด้านล่าง ส่งภาพหน้าจอกับชื่อแอปมาด้วยจะช่วยได้เร็วขึ้น",
    en: "Message me on any channel below. A screenshot and the app's name help me answer faster.",
  },
} satisfies Record<string, Text>;

const START: Text[] = [
  {
    th: "บนเว็บ: กด เปิดในเว็บ ที่หน้าแอป งานทั้งหมดอยู่ในเบราว์เซอร์ของคุณ ไม่ถูกอัปโหลดไปไหน",
    en: "On the web: choose Open on the web on the apps page. Your work stays in your browser and is never uploaded.",
  },
  {
    th: "เก็บไว้ในเครื่อง: เปิดในเว็บแล้วเลือก ติดตั้งแอป จากเมนูเบราว์เซอร์ จะได้ไอคอนบนเครื่องที่เปิดออฟไลน์ได้",
    en: "Keep it on your device: open it on the web, then choose Install app in the browser menu. You get an icon that opens offline.",
  },
  {
    th: "บน Windows: ดาวน์โหลดตัวติดตั้ง MSI หรือ EXE ตัวติดตั้งยังไม่ได้เซ็น Windows จะขึ้นเตือนครั้งแรก กด ข้อมูลเพิ่มเติม แล้ว เรียกใช้ต่อไป",
    en: "On Windows: download the MSI or EXE installer. It is unsigned, so Windows warns once: choose More info, then Run anyway.",
  },
  {
    th: "แบบพกพา: ไฟล์ ZIP แตกแล้วเปิดได้เลยโดยไม่ต้องติดตั้ง เหมาะกับเครื่องที่ไม่มีสิทธิ์ติดตั้งโปรแกรม",
    en: "Portable: unzip the ZIP and run it with no install, handy on a PC where you cannot install programs.",
  },
];

/** first steps per app, in our own words; an app without an entry shows its description only */
const STEPS: Record<string, Text[]> = {
  "photo-editor": [
    {
      th: "ลากรูปเข้าหน้าต่าง แต่ละการแก้เป็นเลเยอร์แยก ย้อนกลับได้เสมอ",
      en: "Drop a picture in. Each edit is its own layer, so you can always go back.",
    },
    {
      th: "เสร็จแล้วส่งออกเป็นไฟล์ภาพจากเมนูไฟล์",
      en: "When done, export an image from the File menu.",
    },
  ],
  "pdf-editor": [
    {
      th: "เปิด PDF แล้วเลือกเครื่องมือ: แก้ข้อความ รวม แยกหน้า หมุน หรือเซ็น",
      en: "Open a PDF and pick a tool: edit text, merge, split, rotate or sign.",
    },
    {
      th: "ไฟล์ไม่ออกจากเครื่อง ใช้กับเอกสารลับได้",
      en: "The file never leaves your device, so it is fine for private papers.",
    },
  ],
  "word-editor": [
    {
      th: "เริ่มจากเอกสารเปล่าหรือเปิดไฟล์เดิม ใช้หัวข้อจัดโครงเรื่องให้อ่านง่าย",
      en: "Start blank or open a file. Use headings to give it a clear outline.",
    },
    { th: "ส่งออกเป็นไฟล์ที่คนอื่นเปิดได้", en: "Export a file other people can open." },
  ],
  slides: [
    {
      th: "เลือกเลย์เอาต์ ใส่ข้อความและรูป แล้วกดนำเสนอเพื่อเปิดเต็มจอ",
      en: "Pick a layout, add text and pictures, then press Present for full screen.",
    },
  ],
  vector: [
    {
      th: "วาดด้วยปากกาและรูปทรง ปรับจุดได้ทีละจุด งานคมทุกขนาด",
      en: "Draw with the pen and shapes and adjust point by point; it stays sharp at any size.",
    },
  ],
  layout: [
    {
      th: "ตั้งขนาดหน้าและระยะขอบก่อน วางกรอบข้อความกับรูป แล้วส่งออกไปพิมพ์",
      en: "Set the page size and margins first, place text and picture frames, then export for print.",
    },
  ],
  interface: [
    {
      th: "สร้างหน้าจอเป็นเฟรม ลากเส้นเชื่อมเฟรมเพื่อทำต้นแบบที่กดได้",
      en: "Build each screen as a frame, then link frames to make a clickable prototype.",
    },
  ],
  cad: [
    {
      th: "พิมพ์ระยะตอนวาดเส้นเพื่อความแม่นยำ ใช้เลเยอร์แยกแบบโครงสร้างกับเส้นบอกขนาด",
      en: "Type lengths while drawing for exact sizes. Keep structure and dimensions on separate layers.",
    },
  ],
  motion: [
    {
      th: "วางชิ้นงานบนไทม์ไลน์ ใส่คีย์เฟรมที่ต้นและท้าย แอปเติมการเคลื่อนไหวระหว่างให้",
      en: "Place items on the timeline, key the start and end, and the app fills the motion between.",
    },
  ],
  animate: [
    {
      th: "วาดเฟรมแรก เพิ่มคีย์เฟรม แล้วเปิดเงาเฟรมก่อนหน้าเพื่อวาดต่อได้ตรง",
      en: "Draw the first frame, add keyframes, and turn on onion skin to line up the next pose.",
    },
  ],
  material: [
    {
      th: "ต่อโหนดจากซ้ายไปขวา ผลลัพธ์แสดงบนลูกบอลตัวอย่างทันที",
      en: "Connect nodes left to right; the preview ball updates as you go.",
    },
  ],
  texture: [
    {
      th: "นำเข้าโมเดล เลือกแปรงและวัสดุ แล้วระบายลงบนผิวโมเดลโดยตรง",
      en: "Import a model, pick a brush and material, and paint straight onto it.",
    },
  ],
  darkroom: [
    {
      th: "นำเข้าโฟลเดอร์รูป ปรับแสงและสีในห้องมืด ต้นฉบับไม่ถูกแก้ ส่งออกเมื่อพอใจ",
      en: "Import a folder, adjust light and colour in the darkroom; originals stay untouched. Export when happy.",
    },
  ],
  sound: [
    {
      th: "เพิ่มแทร็ก อัดเสียงหรือลากไฟล์เสียงเข้ามา มิกซ์ระดับเสียงแล้วส่งออกเพลง",
      en: "Add tracks, record or drop in audio, mix the levels and export your song.",
    },
  ],
  video: [
    {
      th: "สร้างโปรเจกต์ใหม่ ลากคลิปเข้าไทม์ไลน์ ตัดคลิปตรงตำแหน่งหัวอ่าน",
      en: "Create a project, drag clips to the timeline, and split clips at the playhead.",
    },
    {
      th: "โปรเจกต์เก็บในเบราว์เซอร์ของเครื่องนี้ ล้างข้อมูลเบราว์เซอร์แล้วงานจะหาย ส่งออกวิดีโอเก็บไว้เสมอ",
      en: "Projects live in this browser. Clearing browser data removes them, so export your video to keep it.",
    },
  ],
  cut: [
    {
      th: "ติดตั้งแล้วเปิด crocwork Cut โปรเจกต์ใหม่จะอยู่ในโฟลเดอร์ crocwork Cut บนเดสก์ท็อป",
      en: "Install and open crocwork Cut. New projects go in a crocwork Cut folder on your desktop.",
    },
    {
      th: "ลากคลิปเข้าไทม์ไลน์ ใส่ข้อความ เสียง เอฟเฟกต์ แล้วส่งออกวิดีโอ ทั้งหมดทำบนเครื่อง ใช้ออฟไลน์ได้",
      en: "Drag clips to the timeline, add titles, audio and effects, then export your video. Everything runs on your PC, offline.",
    },
    {
      th: "ซับไตเติลอัตโนมัติและคลังเสียงต้องดาวน์โหลดโมเดลหรือไฟล์เสียงในครั้งแรกที่ใช้ ต้องต่อเน็ตตอนนั้น",
      en: "Auto captions and the sound library download a model or sound files the first time you use them, so be online then.",
    },
  ],
};

/** /craft/guide: our own guide to crocwork's Pro apps, Thai and English (by the lang cookie). */
export function GuideView() {
  const lang = readLang(document.cookie);
  // a SPA does not jump to #app on load; do it once the list is on screen
  useEffect(() => {
    const id = decodeURIComponent(location.hash.slice(1));
    if (id) document.getElementById(id)?.scrollIntoView();
  }, []);
  const link = "font-medium text-primary underline underline-offset-4";
  return (
    <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-on-surface-variant">Guide</p>
      <h1 className="mt-3 font-display text-4xl font-black sm:text-5xl">{COPY.title[lang]}</h1>
      <p className="mt-4 max-w-2xl leading-relaxed text-on-surface-variant">{COPY.lead[lang]}</p>

      <section className="mt-10 border-t border-outline-variant py-8">
        <h2 className="font-display text-2xl font-black">{COPY.startTitle[lang]}</h2>
        <ol className="mt-4 list-decimal space-y-2 pl-5 leading-relaxed">
          {START.map((s) => (
            <li key={s.en}>{s[lang]}</li>
          ))}
        </ol>
      </section>

      <section className="border-t border-outline-variant py-8">
        <h2 className="font-display text-2xl font-black">{COPY.apps[lang]}</h2>
        <div className="mt-4 grid gap-px overflow-hidden rounded-xl border border-outline-variant bg-outline-variant">
          {CRAFT_APPS.filter((a) => a.repo).map((app) => {
            const Icon = app.icon;
            const files = downloads(app);
            const release = releaseUrl(app);
            return (
              <article key={app.slug} id={app.slug} className="scroll-mt-20 bg-surface p-5">
                <h3 className="flex items-center gap-3 text-lg font-bold">
                  <Icon aria-hidden className="size-5 text-primary" />
                  crocwork {app.word}
                  <span className="text-sm font-normal text-on-surface-variant">
                    {app.kind[lang]}
                  </span>
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">
                  {app.description[lang]}
                </p>
                {STEPS[app.slug] && (
                  <ul className="mt-3 list-disc space-y-1 pl-5 text-sm leading-relaxed">
                    {STEPS[app.slug].map((s) => (
                      <li key={s.en}>{s[lang]}</li>
                    ))}
                  </ul>
                )}
                <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm">
                  {app.web && (
                    <a href={app.web} className={link}>
                      {COPY.open[lang]}
                    </a>
                  )}
                  {(files || release) && (
                    <a href={release ?? files?.msi} rel="noreferrer" className={link}>
                      {COPY.install[lang]}
                    </a>
                  )}
                </p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="border-t border-outline-variant py-8">
        <h2 className="font-display text-2xl font-black">{COPY.help[lang]}</h2>
        <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">
          {COPY.helpNote[lang]}
        </p>
        <p className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-sm">
          {contacts.map((c) => (
            <a key={c.href} href={c.href} rel="noreferrer" className={link}>
              {lang === "en" && c.href.startsWith("mailto:") ? "Email" : c.label}
            </a>
          ))}
        </p>
      </section>
    </main>
  );
}

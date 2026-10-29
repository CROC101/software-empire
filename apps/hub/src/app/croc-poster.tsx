"use client";

import "@fontsource/bodoni-moda/500.css";
import "@fontsource/syncopate/400.css";
import "@fontsource/syncopate/700.css";
import "@fontsource/fleur-de-leah/400.css";
import { ComebackPoster, useTokenColors } from "@empire/ui";

const TOKENS = [
  "--background", // paper: follows the theme
  "--foreground", // ink
  "--em-blue-500", // poppies: a field of blue
  "--em-croc-800", // the ground, the croc's own green
  "--em-ink-300", // haze
  "--em-ink-25", // robe
  "--em-ink-0", // marks over the painting
  "--em-croc-600", // the crocodile
  "--em-gold-500", // its eyes
] as const;

/**
 * The studio poster: Kedhareswer Naidu's Comeback Poster (MIT) with our crocodile in the hood, on
 * a field of blue poppies. Words, dates and fine print are the studio's own and true: the hub went
 * up on 15 Oct 2569, the latest round shipped 24 Oct 2569.
 */
export function CrocPoster() {
  const c = useTokenColors(TOKENS);
  if (!c) return <div className="bg-background" style={{ height: "min(100svh, 860px)" }} />;
  const [
    paper = "",
    ink = "",
    poppy = "",
    field = "",
    haze = "",
    robe = "",
    mark = "",
    croc = "",
    eye = "",
  ] = c;
  return (
    <ComebackPoster
      title="Crocwork"
      keywords={[
        "Product",
        "Design",
        "Frontend",
        "Backend",
        "Security",
        "Realtime",
        "Motion",
        "AI",
        "Systems",
        "Ship",
        "Care",
        "Solo",
      ]}
      from="15.10.69"
      to="24.10.69"
      edition="No. 01 / crocwork.studio"
      topNote="Notes from a solo studio: one person, every role. Eight systems share one login, every table carries its own rules, and every screen on this page is real. Printed on a field of blue poppies for the clients who want the person who builds it on the call."
      footNote="Hover a theme and the title becomes it. Click the field and a clutch of poppies blooms where you pointed. The crocodile in the hood keeps an eye on you; it has since the hub went up."
      palette={{ paper, ink, poppy, field, haze, robe, mark, croc, eye }}
      poppies={200}
      displayFont='"Bodoni Moda", Didot, Georgia, serif'
      scriptFont='"Fleur De Leah", cursive'
      labelFont='Syncopate, "Helvetica Neue", Arial, sans-serif'
      labels={{
        still: "หยุดลม",
        blow: "ปล่อยลม",
        gust: "ส่งลมกรรโชกข้ามทุ่ง",
        themes: "หัวข้อ",
        field: "ภาพวาดทุ่งดอกป๊อปปี้สีฟ้า มีจระเข้สวมเสื้อคลุมมีฮู้ดยืนอยู่กลางทุ่ง",
      }}
      height="min(100svh, 860px)"
    />
  );
}

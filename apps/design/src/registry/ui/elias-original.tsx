/*
 * Elias: the author hero as given to crocwork.studio (D:/projects/Exclusive/22-11-69/Felias-author-hero.tsx).
 * The demo that came with it, props word for word. Left out: the embedded font files (the site
 * serves its own) and the cover-capture switch; the embedded portrait is served from /previews.
 */
"use client";

import { Elias, type EliasBook } from "@empire/ui";

const BOOKS: EliasBook[] = [
  {
    label: "The Latest Book",
    title: "A More Intentional Life",
    coverLines: ["A more", "inten-", "tional", "life"],
    topics: ["Ideas", "Behavior", "Life"],
    art: "sunrise",
    colors: { cover: "#f8dccb", type: "#171412", spine: "#ff9f80" },
    chapter: "Chapter one",
    chapterTitle: "The quiet hours",
    text: "The quiet hours are where we decide who we become. Not in the meetings we fill, but in the unclaimed minutes between them, when no one is asking anything of us at all.",
  },
  {
    label: "Also by Elias",
    title: "Deep Work, Light Life",
    coverLines: ["Deep", "work,", "light", "life"],
    topics: ["Work", "Focus", "Craft"],
    art: "lamp",
    colors: { cover: "#d3e3d2", type: "#171412", spine: "#8fb59a" },
    chapter: "Chapter one",
    chapterTitle: "Busy is not useful",
    text: "Most of what fills a working day is motion, not progress. The work that matters rarely shouts; it waits for a quiet hour and a single, unbroken thought.",
  },
  {
    label: "Also by Elias",
    title: "Notes on Being Here",
    coverLines: ["Notes", "on being", "here"],
    topics: ["Attention", "Presence", "Habit"],
    art: "path",
    colors: { cover: "#e2daf0", type: "#171412", spine: "#b4a6d8" },
    chapter: "Chapter one",
    chapterTitle: "The long walk home",
    text: "Attention is the rarest form of generosity. To give it, we have to put something down first: the phone, the plan, the small need to be somewhere else.",
  },
  {
    label: "Also by Elias",
    title: "Small Days, Long Life",
    coverLines: ["Small", "days,", "long", "life"],
    topics: ["Time", "Habit", "Meaning"],
    art: "days",
    colors: { cover: "#d3e6f1", type: "#171412", spine: "#a3c8de" },
    chapter: "Chapter one",
    chapterTitle: "One honest page",
    text: "A life is made of ordinary days. Change what one of them holds, one honest page, one slow meal, one call returned, and the years begin to follow.",
  },
];

export default function Part() {
  return (
    <Elias
      brand={{ name: "Elias", href: "#top" }}
      navLinks={{
        left: [
          { label: "Home", href: "#top", active: true },
          { label: "About me", href: "#about" },
        ],
        right: [
          { label: "Books", href: "#books" },
          { label: "Journal", href: "#journal" },
        ],
      }}
      navCta={{ label: "Contact", href: "#contact" }}
      navStatus={{ label: "Now writing", detail: "Book two" }}
      name={{ first: "Elias", last: "Monroe" }}
      intro={{
        roles: ["Author", "Thinker", "Researcher"],
        headline: ["Stories and ideas", "for a more thoughtful", "tomorrow."],
        description:
          "I write about human behavior, modern work, and the ideas that shape a better, more intentional life.",
      }}
      portrait={{
        src: "/previews/elias-portrait.webp",
        width: 1072,
        height: 1336,
        alt: "Elias Monroe, in a dark coat and round glasses, looking up and away",
      }}
      books={BOOKS}
      bookCard={{ href: "#books", open: "Open", close: "Close and show the next book", folio: "1" }}
      letter={{
        eyebrow: "A letter to tomorrow",
        greeting: "Dear tomorrow,",
        stamp: "Seal & send",
        postmark: "Tomorrow",
        seal: "E",
        sealing: "Sealed for tomorrow",
        messages: [
          "I will put my phone in the drawer and finish one thing I care about.",
          "I will take the long walk home and listen more than I speak.",
          "I will write one honest page before I open my inbox.",
          "I will say no to one meeting and yes to one quiet hour.",
        ],
        counter: "Letter",
      }}
      socialLinks={[
        { label: "LinkedIn", href: "https://www.linkedin.com" },
        { label: "Twitter", href: "https://x.com" },
        { label: "Instagram", href: "https://www.instagram.com" },
      ]}
    />
  );
}

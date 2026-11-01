/** Thai vowels and tone marks stay with their consonant: split by grapheme, not by code unit. */
export const graphemes = (word: string) =>
  typeof Intl.Segmenter === "function"
    ? Array.from(
        new Intl.Segmenter("th", { granularity: "grapheme" }).segment(word),
        (s) => s.segment,
      )
    : Array.from(word);

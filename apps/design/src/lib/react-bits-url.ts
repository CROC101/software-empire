const slug = (s: string) => s.replace(/\s+/g, "-").toLowerCase();

/** The docs page of a React Bits component on reactbits.dev, e.g. Backgrounds + "Letter Glitch". */
export const reactBitsUrl = (category: string, title: string) =>
  `https://reactbits.dev/${slug(category)}/${slug(title)}`;

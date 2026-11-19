/** Kinds of token the code viewer colours; everything else is plain text. */
export type TokenKind = "comment" | "string" | "keyword" | "number" | "tag" | "plain";
export type Token = { kind: TokenKind; text: string };

const KEYWORDS = new Set(
  "as async await break case catch const continue default do else export extends false for from function if import in interface let new null return switch this throw true try type typeof undefined var void while yield".split(
    " ",
  ),
);

// one pass, first alternative wins: comments and strings before anything that could start inside them
const RULES =
  /(\/\/[^\n]*|\/\*[\s\S]*?\*\/)|("(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*'|`(?:\\.|[^`\\])*`)|(<\/?[A-Za-z][\w.]*)|\b(\d[\d_]*(?:\.\d+)?)\b|([A-Za-z_$][\w$]*)/g;

/**
 * A small TSX tokenizer for the code viewer: enough to tell comments, strings, keywords, numbers
 * and JSX tags apart. shortcut: template literals are one string token (no ${} colouring), swap for
 * a real grammar if the viewer ever needs it.
 */
export function tokenize(src: string): Token[] {
  const out: Token[] = [];
  let last = 0;
  const push = (kind: TokenKind, text: string) => {
    const prev = out.at(-1);
    if (prev?.kind === kind) prev.text += text;
    else out.push({ kind, text });
  };
  for (const m of src.matchAll(RULES)) {
    if (m.index > last) push("plain", src.slice(last, m.index));
    const [text, comment, string, tag, number, word] = m;
    if (comment) push("comment", text);
    else if (string) push("string", text);
    else if (tag) push("tag", text);
    else if (number) push("number", text);
    else push(word && KEYWORDS.has(word) ? "keyword" : "plain", text);
    last = m.index + text.length;
  }
  if (last < src.length) push("plain", src.slice(last));
  return out;
}

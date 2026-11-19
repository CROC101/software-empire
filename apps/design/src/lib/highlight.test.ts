import { describe, expect, it } from "vitest";
import { tokenize } from "./highlight";

const kinds = (src: string) => tokenize(src).filter((t) => t.kind !== "plain");

describe("tokenize", () => {
  it("joins back to the exact source", () => {
    const src = 'import { a } from "b";\n// hi\nconst n = 1.5; <Foo.Bar x={`t ${n}`} />';
    expect(
      tokenize(src)
        .map((t) => t.text)
        .join(""),
    ).toBe(src);
  });

  it("tells the kinds apart", () => {
    expect(kinds('const x = "a"; // c\n<Box n={12} /></Box>')).toEqual([
      { kind: "keyword", text: "const" },
      { kind: "string", text: '"a"' },
      { kind: "comment", text: "// c" },
      { kind: "tag", text: "<Box" },
      { kind: "number", text: "12" },
      { kind: "tag", text: "</Box" },
    ]);
  });

  it("keeps keywords and slashes inside strings and comments", () => {
    expect(kinds("'return // no' /* const */")).toEqual([
      { kind: "string", text: "'return // no'" },
      { kind: "comment", text: "/* const */" },
    ]);
  });

  it("does not colour words that only contain a keyword or digits", () => {
    expect(kinds("format x2 imports")).toEqual([]);
  });
});

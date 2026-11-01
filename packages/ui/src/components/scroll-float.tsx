import {
  Children,
  cloneElement,
  Fragment,
  isValidElement,
  type CSSProperties,
  type ReactElement,
  type ReactNode,
} from "react";
import { graphemes } from "../lib/graphemes";

type WithChildren = ReactElement<{ children?: ReactNode }>;

/** The words a screen reader should hear; a line break reads as a space. */
function plainText(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(plainText).join("");
  if (isValidElement(node)) {
    if (node.type === "br") return " ";
    return plainText((node as WithChildren).props.children);
  }
  return "";
}

/**
 * Heading letters that float up out of a slot, stretched tall, and settle as the heading scrolls
 * into view (the ScrollFloat look). Pure CSS scroll-driven animation on one view timeline per
 * heading: it runs on the compositor at the screen's full rate with no JavaScript, and renders on
 * the server. Works through <br/> and styled spans inside the heading; browsers without
 * scroll-driven animations, reduced motion and LITE show the heading as it is.
 */
export function ScrollFloat({ children }: { children: ReactNode }) {
  let index = 0;
  const split = (text: string, at: string) =>
    text.split(/(\s+)/).map((word, w) =>
      word.trim() === "" ? (
        word
      ) : (
        <span key={`${at}-${String(w)}`} className="em-float-word">
          {graphemes(word).map((letter, l) => (
            <span
              key={l}
              className="em-float-char"
              style={{ "--float-i": index++ } as CSSProperties}
            >
              {letter}
            </span>
          ))}
        </span>
      ),
    );
  const walk = (node: ReactNode, at: string): ReactNode => {
    if (typeof node === "string" || typeof node === "number") return split(String(node), at);
    if (Array.isArray(node))
      return Children.toArray(node).map((child, k) => (
        <Fragment key={`${at}.${String(k)}`}>{walk(child, `${at}.${String(k)}`)}</Fragment>
      ));
    if (isValidElement(node) && (node as WithChildren).props.children !== undefined) {
      const el = node as WithChildren;
      return cloneElement(el, undefined, walk(el.props.children, at));
    }
    return node;
  };
  return (
    <>
      <span className="sr-only">{plainText(children)}</span>
      <span aria-hidden className="em-float">
        {walk(children, "f")}
      </span>
    </>
  );
}

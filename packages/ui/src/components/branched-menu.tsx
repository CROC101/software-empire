"use client";

import * as React from "react";
import { cn } from "../lib/cn";

const PAD = 6;
const MARK = 16;

export type BranchedMenuLeaf = { value: string; label: string; icon?: React.ReactNode };
export type BranchedMenuItem = {
  label: string;
  /** a leaf section (no children) selects this value */
  value?: string;
  children?: BranchedMenuLeaf[];
};

const toSet = (open: number | number[]) =>
  new Set(Array.isArray(open) ? open : open >= 0 ? [open] : []);

/**
 * A folding menu drawn as a tree: each open section grows a trunk with a curved branch to every
 * child, and the branch to the active child is traced in the accent colour from the top. A marker
 * on the left rail follows the active section.
 *
 * After React Bits' BranchedMenu (MIT): same geometry and timing; icons are any ReactNode (pass
 * lucide-react icons) instead of @hugeicons; colours come from tokens (`.branched-menu` in
 * styles.css). Left out: per-instance colour and timing props.
 */
export function BranchedMenu({
  items,
  defaultOpen = 0,
  defaultActive = "",
  onSelect,
  onToggle,
  width = 240,
  rowHeight = 36,
  indent = 40,
  trunk = 14,
  radius = 10,
  className,
}: {
  items: BranchedMenuItem[];
  /** the section(s) open at first; -1 for none */
  defaultOpen?: number | number[];
  /** value selected at first; empty picks the first child of the first open section */
  defaultActive?: string;
  onSelect?: (value: string, item: BranchedMenuLeaf | BranchedMenuItem) => void;
  onToggle?: (index: number, open: boolean) => void;
  width?: number;
  rowHeight?: number;
  indent?: number;
  trunk?: number;
  radius?: number;
  className?: string;
}) {
  const [open, setOpen] = React.useState(() => toSet(defaultOpen));
  const [active, setActive] = React.useState(() => {
    if (defaultActive) return defaultActive;
    const first = items.find((it, i) => it.children && toSet(defaultOpen).has(i));
    return first?.children?.[0]?.value ?? "";
  });
  const navRef = React.useRef<HTMLElement>(null);
  const heads = React.useRef<(HTMLButtonElement | null)[]>([]);
  const markerRef = React.useRef<HTMLSpanElement>(null);
  const latest = React.useRef({ onSelect, onToggle });
  latest.current = { onSelect, onToggle };

  const activeSection = items.findIndex((it) => it.children?.some((kid) => kid.value === active));
  const markerShown = activeSection >= 0 && open.has(activeSection);

  React.useLayoutEffect(() => {
    const place = (glide: boolean) => {
      const m = markerRef.current;
      const el = heads.current[activeSection];
      if (!m) return;
      const on = markerShown && el;
      if (!glide) m.style.transition = "none";
      if (on) m.style.top = `${String(el.offsetTop + (el.offsetHeight - MARK) / 2)}px`;
      m.toggleAttribute("data-on", Boolean(on));
      if (!glide) {
        // flush the jump before transitions come back
        m.getBoundingClientRect();
        m.style.transition = "";
      }
    };
    place(true);
    let first = true;
    const ro = new ResizeObserver(() => {
      if (first) {
        first = false;
        return;
      }
      place(false);
    });
    if (navRef.current) ro.observe(navRef.current);
    return () => ro.disconnect();
  }, [activeSection, markerShown, items, rowHeight]);

  const select = (value: string, item: BranchedMenuLeaf | BranchedMenuItem) => {
    setActive(value);
    latest.current.onSelect?.(value, item);
  };
  const toggle = (i: number) => {
    const isOpen = !open.has(i);
    setOpen((prev) => {
      const next = new Set(prev);
      if (isOpen) next.add(i);
      else next.delete(i);
      return next;
    });
    latest.current.onToggle?.(i, isOpen);
  };

  const r = Math.min(radius, rowHeight / 2 - 2);
  const endX = indent - 8;
  const rowY = (k: number) => PAD + k * rowHeight + rowHeight / 2;
  const branch = (k: number) =>
    `M ${String(trunk)} ${String(rowY(k) - r)} A ${String(r)} ${String(r)} 0 0 0 ${String(trunk + r)} ${String(rowY(k))} H ${String(endX)}`;
  const reach = (k: number) =>
    `M ${String(trunk)} 0 V ${String(rowY(k) - r)} A ${String(r)} ${String(r)} 0 0 0 ${String(trunk + r)} ${String(rowY(k))} H ${String(endX)}`;
  const length = (k: number) => rowY(k) - r + (Math.PI * r) / 2 + (endX - trunk - r);

  return (
    <nav
      ref={navRef}
      className={cn("branched-menu", className)}
      style={
        {
          "--bm-w": `${String(width)}px`,
          "--bm-row": `${String(rowHeight)}px`,
          "--bm-indent": `${String(indent)}px`,
        } as React.CSSProperties
      }
    >
      <span ref={markerRef} className="branched-menu__marker" aria-hidden />
      {items.map((item, i) => {
        const kids = item.children;
        const isOpen = kids ? open.has(i) : false;
        const leafValue = item.value ?? item.label;
        const leafActive = !kids && leafValue === active;
        const bodyH = kids ? PAD * 2 + kids.length * rowHeight : 0;
        return (
          <div
            key={leafValue}
            className="branched-menu__section"
            data-open={isOpen ? "" : undefined}
          >
            <button
              ref={(el) => {
                heads.current[i] = el;
              }}
              type="button"
              className="branched-menu__head"
              aria-expanded={kids ? isOpen : undefined}
              aria-current={leafActive ? "true" : undefined}
              data-active={leafActive ? "" : undefined}
              onClick={() => {
                if (kids) toggle(i);
                else select(leafValue, item);
              }}
            >
              {item.label}
            </button>
            {kids ? (
              <div className="branched-menu__body">
                <div className="branched-menu__fold">
                  <div className="branched-menu__tree" style={{ height: bodyH }}>
                    <svg className="branched-menu__lines" width={indent} height={bodyH} aria-hidden>
                      <path
                        className="branched-menu__base"
                        d={`M ${String(trunk)} 0 V ${String(rowY(kids.length - 1) - r)}`}
                      />
                      {kids.map((kid, k) => (
                        <path key={kid.value} className="branched-menu__base" d={branch(k)} />
                      ))}
                      {kids.map((kid, k) => (
                        <path
                          key={kid.value}
                          className="branched-menu__reach"
                          d={reach(k)}
                          style={{
                            strokeDasharray: length(k),
                            strokeDashoffset: kid.value === active ? 0 : length(k),
                          }}
                        />
                      ))}
                    </svg>
                    {kids.map((kid) => (
                      <button
                        key={kid.value}
                        type="button"
                        className="branched-menu__item"
                        aria-current={kid.value === active ? "true" : undefined}
                        data-active={kid.value === active ? "" : undefined}
                        tabIndex={isOpen ? 0 : -1}
                        onClick={() => select(kid.value, kid)}
                      >
                        {kid.icon ? (
                          <span className="branched-menu__icon" aria-hidden>
                            {kid.icon}
                          </span>
                        ) : null}
                        <span className="branched-menu__label">{kid.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        );
      })}
    </nav>
  );
}

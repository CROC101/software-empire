"use client";

import { DodgeField } from "@empire/ui";

const TAUNTS = ["ขอลดราคาหน่อย", "ไม่ลดจ้า", "ช้าไปนิด", "เกือบแล้ว", "โอเค มาคุยกัน"];

/**
 * A joke in the FAQ: the "discount please" pill runs from the pointer, gives up after a few
 * tries, and then leads to the contact section, where the real price talk happens. On touch it
 * sits still and simply links there.
 */
export function Haggle() {
  return (
    <DodgeField
      className="mt-8"
      fieldHeight={180}
      patience={4}
      notice="บนมือถือมันไม่หนี กดคุยได้เลย"
    >
      {({ dodges, gave, caught }) => {
        const label = gave || caught ? TAUNTS.at(-1) : TAUNTS[Math.min(dodges, TAUNTS.length - 2)];
        return (
          <a href="#contact" className="dodge-field__pill no-underline">
            {label}
          </a>
        );
      }}
    </DodgeField>
  );
}

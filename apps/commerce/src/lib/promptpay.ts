/**
 * PromptPay "Thai QR" payload (EMVCo merchant-presented, BOT spec) for a fixed amount.
 * Any Thai banking app scans it and pre-fills the seller's account and the exact price.
 * Pure string building: no network, no third party ever sees the PromptPay id.
 */

const field = (id: string, value: string) =>
  `${id}${String(value.length).padStart(2, "0")}${value}`;

/** CRC-16/CCITT-FALSE (poly 0x1021, init 0xFFFF), as the EMVCo spec requires. */
export function crc16(text: string): string {
  let crc = 0xffff;
  for (const byte of new TextEncoder().encode(text)) {
    crc ^= byte << 8;
    for (let i = 0; i < 8; i++)
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

/** `id`: mobile (0812345678) or e-wallet id (15 digits) — the same rule as commerce.payout_accounts. */
export function promptPayPayload(id: string, amountSatang: number): string {
  const target = /^0\d{9}$/.test(id)
    ? field("01", `0066${id.slice(1)}`.padStart(13, "0"))
    : /^\d{15}$/.test(id)
      ? field("03", id)
      : null;
  if (!target) throw new Error("PromptPay id must be a mobile number or a 15-digit e-wallet id");
  const body =
    field("00", "01") +
    field("01", "12") + // 12 = dynamic: one payment, with an amount
    field("29", field("00", "A000000677010111") + target) +
    field("53", "764") + // THB
    field("54", (amountSatang / 100).toFixed(2)) +
    field("58", "TH") +
    "6304";
  return body + crc16(body);
}

"use client";

import { QRCodeSVG } from "qrcode.react";
import { promptPayPayload } from "@/lib/promptpay";
import { formatBaht } from "@/lib/market";

/**
 * The buyer's payment box: a PromptPay QR for the seller's own account and this order's exact
 * amount. Scanning it in any Thai banking app pre-fills both, so nobody types an account number.
 */
export function PayPanel({
  promptpayId,
  accountName,
  amountSatang,
}: {
  promptpayId: string;
  accountName: string;
  amountSatang: number;
}) {
  const masked = promptpayId.replace(/^(\d{3})\d+(\d{3})$/, "$1-xxx-$2");
  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <div className="rounded-lg bg-[var(--em-ink-0)] p-3">
        <QRCodeSVG
          value={promptPayPayload(promptpayId, amountSatang)}
          size={196}
          level="M"
          title={`พร้อมเพย์ ${accountName} ${formatBaht(amountSatang)}`}
        />
      </div>
      <p className="text-sm">
        โอนให้ <span className="font-semibold">{accountName}</span>
        <br />
        <span className="font-mono text-xs text-muted-foreground">พร้อมเพย์ {masked}</span>
      </p>
      <p className="font-heading text-2xl font-black tabular-nums">{formatBaht(amountSatang)}</p>
      <p className="text-xs text-muted-foreground">สแกนด้วยแอปธนาคารไหนก็ได้ ยอดเงินกรอกให้แล้ว</p>
    </div>
  );
}

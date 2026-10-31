import { PhosphorNotFound } from "@empire/ui";
import Link from "next/link";

export const metadata = { title: "ไม่พบหน้านี้ · crocwork.studio" };

export default function NotFound() {
  return (
    <PhosphorNotFound
      hint="คลิกจอเพื่อเปลี่ยนช่อง"
      powerLabel="เปิด/ปิด"
      caption={
        <>
          หาหน้านี้ไม่เจอ ลิงก์อาจพิมพ์ผิด หรือหน้าถูกย้ายไปแล้ว{" "}
          <Link
            href="/"
            className="font-bold text-[var(--em-sky-500)] underline underline-offset-4"
          >
            กลับหน้าแรก
          </Link>
        </>
      }
    />
  );
}

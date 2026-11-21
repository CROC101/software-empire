import type { Metadata } from "next";
import { FontTabs } from "@/components/font-tabs";
import { ThaiFontCatalog } from "@/components/thai-font-catalog";

export const metadata: Metadata = {
  title: "ฟอนต์ไทย",
  description:
    "ฟอนต์ไทยทั้งหมดจาก f0nt.com แยกตามแบบตัวอักษร อารมณ์ งานที่เหมาะ สัญญาอนุญาต ปี และผู้ออกแบบ แล้วดาวน์โหลดจากต้นฉบับในคลิกเดียว",
};

export default function ThaiFontsPage() {
  return (
    <main className="mx-auto max-w-7xl px-4 pb-20 sm:px-6">
      <header className="py-12">
        <FontTabs current="th" />
        <h1 className="mt-6 font-heading text-4xl leading-tight font-black sm:text-5xl">
          ฟอนต์ไทยทั้งหมด
          <span className="block text-(--em-blue-600) dark:text-(--em-sky-400)">
            เลือกตามแบบ แล้วโหลดจากต้นฉบับ
          </span>
        </h1>
        <p className="mt-4 max-w-2xl text-muted-foreground">
          รวมทุกฟอนต์ที่เปิดให้ดาวน์โหลดบน f0nt.com กรองด้วยแบบตัวอักษร รูปทรง อารมณ์ งานที่เหมาะ
          สัญญาอนุญาต ปี หรือผู้ออกแบบ ปุ่มดาวน์โหลดพาไปที่ไฟล์ของต้นฉบับโดยตรง
          ไม่มีไฟล์ไหนถูกเก็บไว้ที่นี่
        </p>
      </header>
      <ThaiFontCatalog />
    </main>
  );
}

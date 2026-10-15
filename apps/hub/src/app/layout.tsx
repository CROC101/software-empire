import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Software Empire", template: "%s · Software Empire" },
  description: "Core Hub — ศูนย์กลาง SSO และ portfolio ของระบบย่อยทั้ง 7",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="th">
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}

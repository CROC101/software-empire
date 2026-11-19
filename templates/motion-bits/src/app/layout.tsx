import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import CommandPalette from "@/components/layout/CommandPalette";
import Navbar from "@/components/layout/Navbar";
import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });

export const metadata: Metadata = {
  title: { default: "Motion Bits: animated React components", template: "%s · Motion Bits" },
  description: "An interactive library of animated React components. Tune props live, copy the code, keep your favorites.",
};

export const viewport: Viewport = { themeColor: "#120f17", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`dark ${geist.variable} ${geistMono.variable}`}>
      <body>
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-lg focus:bg-white focus:px-3 focus:py-2 focus:text-ink">
          Skip to content
        </a>
        <Navbar />
        <div id="main">{children}</div>
        <CommandPalette />
      </body>
    </html>
  );
}

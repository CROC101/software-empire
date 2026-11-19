import type { Metadata, Viewport } from "next";
import { Arimo } from "next/font/google";
import "./globals.css";
import { MediaHubProvider } from "@/context/MediaHubContext";
import { AppShell } from "@/components/layout/AppShell";

// Arial is the original's font; Arimo is its free metric-compatible fallback.
const arimo = Arimo({ subsets: ["latin"], variable: "--font-arimo", display: "swap" });

export const metadata: Metadata = {
  title: "StreamHub - 4K Creative, Tech & Cinema Videos",
  description: "A dark-theme video hub with SFW open movies, 3D animation, game dev and tech showcase videos.",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#000000" };

const gateScript = `try{if(localStorage.getItem("streamhub-gate-ok")==="1")document.documentElement.classList.add("gate-ok")}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={arimo.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: gateScript }} />
      </head>
      <body>
        <MediaHubProvider>
          <AppShell>{children}</AppShell>
        </MediaHubProvider>
      </body>
    </html>
  );
}

import "./globals.css";
import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { Header } from "@/components/site/header";
import { CommandMenu } from "@/components/playground/command-menu";
import { TooltipProvider } from "@/components/ui/tooltip";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains", display: "swap" });

export const metadata: Metadata = {
  title: "React Components, Templates & Themes — Crafted UI | Craft",
  description: "Find components, copy prompts, and ship polished UI with your AI agent.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`dark ${inter.variable} ${mono.variable}`}>
      <body>
        <TooltipProvider>
          <Header />
          {children}
          <CommandMenu />
        </TooltipProvider>
      </body>
    </html>
  );
}

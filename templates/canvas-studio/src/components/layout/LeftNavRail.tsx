'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { AppWindow, FolderOpen, Home, LayoutTemplate, Palette, Settings, Star, Trash2 } from 'lucide-react';
import { BrandLogo } from '@/components/brand/BrandLogo';
import { CreateDesignMenu } from './CreateDesignMenu';
import { SPRING } from '@/lib/design';

export const NAV_ITEMS = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/templates/', label: 'Templates', icon: LayoutTemplate },
  { href: '/projects/', label: 'Projects', icon: FolderOpen },
  { href: '/starred/', label: 'Starred', icon: Star },
  { href: '/trash/', label: 'Trash', icon: Trash2 },
  { href: '/brand/', label: 'Brand', icon: Palette },
  { href: '/apps/', label: 'Apps', icon: AppWindow },
  { href: '/settings/', label: 'Settings', icon: Settings },
] as const;

export const isActive = (path: string, href: string) => (href === '/' ? path === '/' : path.startsWith(href.replace(/\/$/, '')));

export function LeftNavRail() {
  const path = usePathname() ?? '/';
  return (
    <>
      {/* desktop / tablet rail */}
      <nav aria-label="Main" className="fixed inset-y-0 left-0 z-40 hidden w-[72px] flex-col items-center gap-1 border-r border-line bg-toolbar py-3 md:flex">
        <BrandLogo compact />
        <div className="my-3">
          <CreateDesignMenu variant="rail" />
        </div>
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = isActive(path, href);
          return (
            <Link key={href} href={href} className={`relative flex w-16 flex-col items-center gap-1 rounded-xl py-2 text-[11px] font-medium transition-colors ${active ? 'text-fg' : 'text-muted hover:text-fg'}`}>
              {active && <motion.span layoutId="rail-active" transition={SPRING} className="absolute inset-0 rounded-xl bg-hover ring-1 ring-cyan/40" />}
              <Icon size={20} className="relative" />
              <span className="relative">{label}</span>
            </Link>
          );
        })}
      </nav>
      {/* phone bottom bar (scrolls inside itself, never the page) */}
      <nav aria-label="Main" className="no-scrollbar fixed inset-x-0 bottom-0 z-40 flex h-16 items-center gap-1 overflow-x-auto border-t border-line bg-toolbar px-2 md:hidden">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href} className={`flex min-w-[64px] flex-col items-center gap-0.5 rounded-lg py-1.5 text-[10px] ${isActive(path, href) ? 'text-cyan' : 'text-muted'}`}>
            <Icon size={19} />
            {label}
          </Link>
        ))}
      </nav>
    </>
  );
}

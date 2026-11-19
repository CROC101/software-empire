'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Moon, Search, Sun } from 'lucide-react';
import { useState } from 'react';
import { useCanva } from '@/context/CanvaContext';
import { BrandLogo } from '@/components/brand/BrandLogo';
import { ProBadge } from '@/components/ui/ProBadge';
import { CreateDesignMenu } from './CreateDesignMenu';

export function TopHeader() {
  const { settings, setSettings } = useCanva();
  const router = useRouter();
  const [q, setQ] = useState('');
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-line bg-toolbar/90 px-3 backdrop-blur md:px-5">
      <BrandLogo />
      <form
        className="mx-auto hidden max-w-xl flex-1 sm:block"
        onSubmit={(e) => {
          e.preventDefault();
          router.push(`/templates/?q=${encodeURIComponent(q)}`);
        }}
      >
        <label className="flex items-center gap-2 rounded-lg border border-line bg-canvas px-3 py-1.5 text-sm text-muted focus-within:ring-2 focus-within:ring-cyan/50">
          <Search size={16} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search templates, designs and more" className="w-full bg-transparent text-fg outline-none placeholder:text-muted" />
        </label>
      </form>
      <div className="ml-auto flex items-center gap-2">
        <Link href="/settings/" className="hidden lg:block" aria-label="Pro features">
          <ProBadge />
        </Link>
        <button
          onClick={() => setSettings({ theme: settings.theme === 'dark' ? 'light' : 'dark' })}
          aria-label={settings.theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          className="rounded-lg p-2 text-muted hover:bg-hover hover:text-fg"
        >
          {settings.theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <CreateDesignMenu />
        <Link href="/settings/" aria-label="Account settings" className="bg-brand-gradient flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white">
          CW
        </Link>
      </div>
    </header>
  );
}

'use client';

import Link from 'next/link';
import { Moon, Sun } from 'lucide-react';
import { useCanva } from '@/context/CanvaContext';
import { ProBadge } from '@/components/ui/ProBadge';

const SHORTCUTS: [string, string][] = [
  ['Ctrl + Z', 'Undo'],
  ['Ctrl + Y / Ctrl + Shift + Z', 'Redo'],
  ['Ctrl + D', 'Duplicate selection'],
  ['Delete / Backspace', 'Delete selection'],
  ['Arrow keys (+ Shift)', 'Nudge 1px (10px)'],
  ['Shift while rotating', 'Snap to 15°'],
  ['Ctrl + scroll', 'Zoom the canvas'],
  ['Double-click text', 'Edit text inline'],
  ['Esc', 'Deselect / exit present mode'],
  ['← / → in present mode', 'Previous / next page'],
];

function Toggle({ on, onChange, label, hint }: { on: boolean; onChange: (v: boolean) => void; label: string; hint: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div>
        <p className="font-medium">{label}</p>
        <p className="text-sm text-muted">{hint}</p>
      </div>
      <button role="switch" aria-checked={on} aria-label={label} onClick={() => onChange(!on)} className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${on ? 'bg-cyan' : 'bg-hover'}`}>
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${on ? 'left-[22px]' : 'left-0.5'}`} />
      </button>
    </div>
  );
}

export default function SettingsPage() {
  const { settings, setSettings } = useCanva();
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-sm text-muted">Workspace preferences are saved in this browser.</p>
        </div>
        <ProBadge />
      </header>

      <section className="rounded-2xl border border-line bg-card p-5">
        <h2 className="mb-3 text-lg font-semibold">Appearance</h2>
        <div className="grid grid-cols-2 gap-3">
          {(['dark', 'light'] as const).map((t) => (
            <button key={t} onClick={() => setSettings({ theme: t })} className={`flex items-center gap-3 rounded-xl border p-4 text-left ${settings.theme === t ? 'border-cyan ring-2 ring-cyan/30' : 'border-line hover:bg-hover'}`}>
              <span className={`flex h-10 w-10 items-center justify-center rounded-lg ${t === 'dark' ? 'bg-[#141518] text-white' : 'bg-[#F4F5F7] text-[#141518]'}`}>{t === 'dark' ? <Moon size={18} /> : <Sun size={18} />}</span>
              <span>
                <span className="block font-semibold">{t === 'dark' ? 'Studio Dark' : 'Light'}</span>
                <span className="text-xs text-muted">{t === 'dark' ? 'Default, easy on the eyes' : 'Bright canvas and cards'}</span>
              </span>
            </button>
          ))}
        </div>
      </section>

      <section className="divide-y divide-line rounded-2xl border border-line bg-card px-5 py-2">
        <Toggle on={settings.snap} onChange={(snap) => setSettings({ snap })} label="Smart guides & snapping" hint="Magenta guides snap elements to edges and centres." />
        <Toggle on={settings.grid} onChange={(grid) => setSettings({ grid })} label="Show grid" hint="Overlay a layout grid on the artboard while editing." />
        <div className="flex items-center justify-between gap-4 py-3">
          <div>
            <p className="font-medium">Default PNG export scale</p>
            <p className="text-sm text-muted">2× gives sharper images for retina screens.</p>
          </div>
          <div className="flex rounded-lg border border-line p-0.5">
            {([1, 2] as const).map((s) => (
              <button key={s} onClick={() => setSettings({ exportScale: s })} className={`rounded-md px-3 py-1 text-sm ${settings.exportScale === s ? 'bg-cyan font-semibold text-[#06272a]' : 'text-muted'}`}>
                {s}×
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-line bg-card p-5">
        <h2 className="mb-3 text-lg font-semibold">Keyboard shortcuts</h2>
        <table className="w-full text-sm">
          <tbody>
            {SHORTCUTS.map(([k, v]) => (
              <tr key={k} className="border-t border-line first:border-0">
                <td className="py-2 pr-4">
                  <kbd className="rounded-md border border-line bg-canvas px-2 py-0.5 font-mono text-xs">{k}</kbd>
                </td>
                <td className="py-2 text-muted">{v}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <p className="text-sm text-muted">
        Having trouble loading? See{' '}
        <Link href="/en/help/troubleshoot-cloudflare-error/" className="text-cyan underline">
          the connection troubleshooting page
        </Link>
        .
      </p>
    </div>
  );
}

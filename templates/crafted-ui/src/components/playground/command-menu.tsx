"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Boxes, Copy, CreditCard, Home, Library, Terminal } from "lucide-react";
import {
  CommandDialog,
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { COMPONENTS, LIBRARIES } from "@/data/components-registry";
import { cliCommand } from "@/lib/prompt-builder";
import { useCopy, useOrigin } from "@/lib/use-copy";

export const OPEN_COMMAND_EVENT = "craft:open-command";
export const openCommandMenu = () => window.dispatchEvent(new Event(OPEN_COMMAND_EVENT));

export function CommandMenu() {
  const [open, setOpen] = useState(false);
  const [library, setLibrary] = useState<string | null>(null);
  const router = useRouter();
  const origin = useOrigin();
  const { copy } = useCopy();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    const onOpen = () => setOpen(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener(OPEN_COMMAND_EVENT, onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener(OPEN_COMMAND_EVENT, onOpen);
    };
  }, []);

  const go = (href: string) => {
    setOpen(false);
    router.push(href);
  };
  const list = library ? COMPONENTS.filter((c) => c.library === library) : COMPONENTS;

  return (
    <CommandDialog open={open} onOpenChange={setOpen} title="Search components" className="border border-white/10 bg-panel-3 sm:max-w-xl">
      <Command className="bg-transparent">
        <CommandInput placeholder="Search components, libraries and actions…" />
        <div className="flex flex-wrap gap-1.5 border-b border-white/[0.06] px-3 py-2">
          {LIBRARIES.map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => setLibrary(library === l ? null : l)}
              className={`rounded-full px-2.5 py-1 font-mono text-[11.5px] transition-colors ${library === l ? "bg-ink text-page" : "bg-wash text-dim hover:text-ink"}`}
            >
              {l}
            </button>
          ))}
        </div>
        <CommandList className="max-h-[380px]">
          <CommandEmpty>No components found.</CommandEmpty>
          <CommandGroup heading={library ? `Components · ${library}` : "Components"}>
            {list.map((c) => (
              <CommandItem key={c.slug} value={`${c.name} ${c.category} ${c.library} ${c.slug}`} onSelect={() => go(`/c/${c.slug}/`)}>
                <Boxes />
                <span>{c.name}</span>
                <span className="ml-auto font-mono text-[11px] text-dim">{c.category}</span>
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Quick actions">
            {list.slice(0, 3).map((c) => (
              <CommandItem
                key={`cli-${c.slug}`}
                value={`copy cli install ${c.name}`}
                onSelect={() => {
                  copy(cliCommand(c, "npm", origin));
                  setOpen(false);
                }}
              >
                <Terminal />
                Copy install command: {c.name}
                <CommandShortcut><Copy className="size-3" /></CommandShortcut>
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Go to">
            <CommandItem value="home" onSelect={() => go("/")}><Home />Home</CommandItem>
            <CommandItem value="library components" onSelect={() => go("/community/components/")}><Library />The library<CommandShortcut><ArrowRight className="size-3" /></CommandShortcut></CommandItem>
            <CommandItem value="pricing plans" onSelect={() => go("/pricing/")}><CreditCard />Pricing</CommandItem>
          </CommandGroup>
        </CommandList>
        <div className="flex items-center gap-3 border-t border-white/[0.06] px-3 py-2 font-mono text-[11px] text-dim">
          <span>↑↓ navigate</span>
          <span>↵ open</span>
          <span>esc close</span>
        </div>
      </Command>
    </CommandDialog>
  );
}

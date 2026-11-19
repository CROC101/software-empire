'use client';

import Link from 'next/link';
import { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/** Horizontal carousel with a heading, "Show all" link and scroll arrows. */
export default function Shelf({ title, href, children }: { title: string; href?: string; children: React.ReactNode }) {
  const row = useRef<HTMLDivElement>(null);
  const scroll = (dir: number) => row.current?.scrollBy({ left: dir * row.current.clientWidth * 0.8, behavior: 'smooth' });
  return (
    <section aria-label={title} className="group/shelf relative">
      <div className="flex h-12 items-end justify-between md:pr-2">
        <h2 className="font-title text-2xl font-bold leading-[29px] tracking-[-0.02em] text-white">
          {href ? (
            <Link href={href} className="hover:underline">
              {title}
            </Link>
          ) : (
            title
          )}
        </h2>
        {href && (
          <Link href={href} className="pb-1 text-sm font-bold text-subdued hover:underline">
            Show all
          </Link>
        )}
      </div>
      <div className="relative mt-2">
        <div ref={row} className="no-scrollbar flex overflow-x-auto scroll-smooth -ml-3 -mr-4 md:-mr-10">
          {children}
        </div>
        <button
          type="button"
          aria-label={`Scroll ${title} left`}
          onClick={() => scroll(-1)}
          className="absolute left-2 top-[70px] hidden h-8 w-8 place-items-center rounded-full bg-[#333333] text-white opacity-0 shadow transition group-hover/shelf:opacity-100 md:grid"
        >
          <ChevronLeft size={18} />
        </button>
        <button
          type="button"
          aria-label={`Scroll ${title} right`}
          onClick={() => scroll(1)}
          className="absolute right-2 top-[70px] hidden h-8 w-8 place-items-center rounded-full bg-[#333333] text-white opacity-0 shadow transition group-hover/shelf:opacity-100 md:grid"
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </section>
  );
}

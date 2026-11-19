'use client';

import { useEffect, useRef, useState } from 'react';
import type { DesignPage } from '@/types/canva';
import { PageView } from './ElementView';

/** Live miniature of a page, scaled to the width of its container. */
export function DesignPreview({ page, width, height, animate, playKey, className = '' }: { page: DesignPage; width: number; height: number; animate?: boolean; playKey?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState(0);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const ro = new ResizeObserver(([e]) => setBox(e.contentRect.width));
    ro.observe(node);
    return () => ro.disconnect();
  }, []);
  const scale = box / width;
  return (
    <div ref={ref} className={`relative w-full overflow-hidden ${className}`} style={{ aspectRatio: `${width} / ${height}` }}>
      {box > 0 && (
        <div style={{ transform: `scale(${scale})`, transformOrigin: '0 0', position: 'absolute', left: 0, top: 0 }}>
          <PageView page={page} width={width} height={height} animate={animate} playKey={playKey} />
        </div>
      )}
    </div>
  );
}

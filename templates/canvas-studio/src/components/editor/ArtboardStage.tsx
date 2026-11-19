'use client';

import { ArrowUpToLine, Copy, Lock, LockOpen, RotateCw, Trash2 } from 'lucide-react';
import { useEffect, useRef, useState, type MutableRefObject, type PointerEvent as RPointerEvent } from 'react';
import type { CanvasElement } from '@/types/canva';
import { useCanva } from '@/context/CanvaContext';
import { fitText, paintToCss } from '@/lib/design';
import { ElementView } from '@/components/design/ElementView';
import { SmartGuides, snapBox, type Guides } from './SmartGuides';
import { clampZoom, useEditor } from './editor-context';

const NO_GUIDES: Guides = { v: [], h: [] };
const HANDLES: [number, number, string][] = [
  [-1, -1, 'nwse-resize'], [0, -1, 'ns-resize'], [1, -1, 'nesw-resize'], [1, 0, 'ew-resize'],
  [1, 1, 'nwse-resize'], [0, 1, 'ns-resize'], [-1, 1, 'nesw-resize'], [-1, 0, 'ew-resize'],
];

/** Follow one pointer drag on window until release. */
function track(e: RPointerEvent, onMove: (dx: number, dy: number, ev: PointerEvent) => void, onEnd?: () => void) {
  const sx = e.clientX;
  const sy = e.clientY;
  const move = (ev: PointerEvent) => onMove(ev.clientX - sx, ev.clientY - sy, ev);
  const up = () => {
    window.removeEventListener('pointermove', move);
    window.removeEventListener('pointerup', up);
    onEnd?.();
  };
  window.addEventListener('pointermove', move);
  window.addEventListener('pointerup', up);
}

export function ArtboardStage({ fitRef }: { fitRef: MutableRefObject<(() => void) | null> }) {
  const ed = useEditor();
  const { settings } = useCanva();
  const { project, page, zoom, sel } = ed;
  const W = project.width;
  const H = project.height;
  const scrollRef = useRef<HTMLDivElement>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const zoomRef = useRef(zoom);
  zoomRef.current = zoom;
  const [guides, setGuides] = useState<Guides>(NO_GUIDES);
  const [readout, setReadout] = useState<string | null>(null);

  // Fit-to-screen, exposed to the zoom controls; refit when the artboard size changes (Magic Resize).
  useEffect(() => {
    fitRef.current = () => {
      const r = scrollRef.current?.getBoundingClientRect();
      if (r) ed.setZoom(clampZoom(Math.min((r.width - 96) / W, (r.height - 96) / H)));
    };
    fitRef.current();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [W, H]);

  // Ctrl/Cmd + wheel zoom (needs a non-passive listener to stop the browser zooming the page).
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      ed.setZoom(clampZoom(zoomRef.current * (e.deltaY < 0 ? 1.1 : 1 / 1.1)));
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onElementDown = (el: CanvasElement) => (e: RPointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 || ed.editingId === el.id) return;
    e.stopPropagation();
    if (ed.editingId) ed.setEditingId(null);
    ed.select(el.id);
    if (el.locked) return;
    const others = page.elements.filter((o) => o.id !== el.id && !o.hidden);
    let started = false;
    track(
      e,
      (dx, dy, ev) => {
        if (!started) {
          if (Math.hypot(dx, dy) < 3) return;
          started = true;
          ed.checkpoint();
        }
        let x = el.x + dx / zoom;
        let y = el.y + dy / zoom;
        if (settings.snap && !ev.altKey) {
          const s = snapBox({ x, y, w: el.w, h: el.h }, others, W, H, 6 / zoom);
          x = s.x;
          y = s.y;
          setGuides(s.guides);
        }
        ed.updateEl(el.id, { x, y }, false);
      },
      () => setGuides(NO_GUIDES),
    );
  };

  const onResize = (hx: number, hy: number) => (e: RPointerEvent) => {
    if (!sel) return;
    e.stopPropagation();
    const el = sel;
    ed.checkpoint();
    const th = (el.rotation * Math.PI) / 180;
    const cos = Math.cos(th);
    const sin = Math.sin(th);
    const cx0 = el.x + el.w / 2;
    const cy0 = el.y + el.h / 2;
    track(
      e,
      (dx, dy, ev) => {
        dx /= zoom;
        dy /= zoom;
        // pointer delta in the element's own (rotated) frame
        const lx = dx * cos + dy * sin;
        const ly = -dx * sin + dy * cos;
        let w = hx ? Math.max(8, el.w + hx * lx) : el.w;
        let h = hy ? Math.max(8, el.h + hy * ly) : el.h;
        const corner = hx !== 0 && hy !== 0;
        if (corner && (el.type !== 'shape' || ev.shiftKey)) {
          const s = Math.max(w / el.w, h / el.h);
          w = el.w * s;
          h = el.h * s;
        }
        const patch: Partial<CanvasElement> = { w, h };
        if (el.type === 'text') {
          if (corner) patch.fontSize = Math.max(4, Math.round((el.fontSize ?? 32) * (w / el.w) * 10) / 10);
          h = patch.h = fitText({ ...el, ...patch }).h;
        }
        const dw = w - el.w;
        const dh = h - el.h;
        const lcx = (hx * dw) / 2;
        const lcy = hy ? (hy * dh) / 2 : dh / 2; // text side handles keep the top edge put
        patch.x = cx0 + lcx * cos - lcy * sin - w / 2;
        patch.y = cy0 + lcx * sin + lcy * cos - h / 2;
        ed.updateEl(el.id, patch, false);
        setReadout(`${Math.round(w)} × ${Math.round(h)}`);
      },
      () => setReadout(null),
    );
  };

  const onRotate = (e: RPointerEvent) => {
    if (!sel || !boardRef.current) return;
    e.stopPropagation();
    const el = sel;
    ed.checkpoint();
    const r = boardRef.current.getBoundingClientRect();
    const cx = r.left + (el.x + el.w / 2) * zoom;
    const cy = r.top + (el.y + el.h / 2) * zoom;
    track(
      e,
      (_dx, _dy, ev) => {
        let a = (Math.atan2(ev.clientY - cy, ev.clientX - cx) * 180) / Math.PI + 90;
        a = ((a % 360) + 360) % 360;
        if (ev.shiftKey) a = Math.round(a / 15) * 15;
        else for (const s of [0, 90, 180, 270, 360]) if (Math.abs(a - s) < 3) a = s;
        a = Math.round(a) % 360;
        ed.updateEl(el.id, { rotation: a > 180 ? a - 360 : a }, false);
        setReadout(`${a}°`);
      },
      () => setReadout(null),
    );
  };

  const deselect = () => {
    ed.select(null);
    ed.setEditingId(null);
  };

  const showHandles = sel && !sel.hidden && !sel.locked && ed.editingId !== sel.id;
  // text height follows its content, so text boxes drop the top/bottom handles
  const handles = sel?.type === 'text' ? HANDLES.filter(([hx]) => hx !== 0) : HANDLES;
  const qa = 'pointer-events-auto rounded-md p-1.5 text-fg hover:bg-hover';

  return (
    <div ref={scrollRef} className="relative min-h-0 flex-1 overflow-auto bg-stage scrollbar-thin" onPointerDown={deselect}>
      <div className="flex min-h-full min-w-full items-center justify-center p-12" style={{ width: 'max-content', height: 'max-content' }}>
        <div ref={boardRef} className="relative shrink-0 shadow-[0_8px_40px_rgba(0,0,0,0.35)]" style={{ width: W * zoom, height: H * zoom }}>
          <div
            className="absolute left-0 top-0 overflow-hidden"
            style={{ width: W, height: H, transform: `scale(${zoom})`, transformOrigin: '0 0', background: paintToCss(page.background) }}
          >
            {page.elements.map((el, i) => (
              <ElementView
                key={`${el.id}-${ed.previewing ? ed.playKey : 0}`}
                el={el}
                page={page}
                index={i}
                animate={ed.previewing}
                interactive
                editing={ed.editingId === el.id}
                onPointerDown={onElementDown(el)}
                onDoubleClick={() => el.type === 'text' && !el.locked && ed.setEditingId(el.id)}
                onCommitText={(text) => {
                  ed.updateEl(el.id, (x) => fitText({ ...x, text }));
                  ed.setEditingId(null);
                }}
              />
            ))}
            {settings.grid && (
              <div
                className="pointer-events-none absolute inset-0"
                style={{ backgroundImage: 'linear-gradient(rgba(0,196,204,.25) 1px, transparent 1px), linear-gradient(90deg, rgba(0,196,204,.25) 1px, transparent 1px)', backgroundSize: `${W / 12}px ${W / 12}px` }}
              />
            )}
          </div>

          <SmartGuides guides={guides} zoom={zoom} W={W} H={H} />

          {sel && !sel.hidden && (
            <div className="pointer-events-none absolute z-20" style={{ left: sel.x * zoom, top: sel.y * zoom, width: sel.w * zoom, height: sel.h * zoom, transform: `rotate(${sel.rotation}deg)` }}>
              <div className={`absolute -inset-px border-2 ${sel.locked ? 'border-dashed border-muted' : 'border-cyan'}`} />
              {showHandles &&
                handles.map(([hx, hy, cursor]) => (
                  <span
                    key={`${hx}${hy}`}
                    onPointerDown={onResize(hx, hy)}
                    className={`pointer-events-auto absolute -translate-x-1/2 -translate-y-1/2 border border-cyan bg-white shadow ${hx && hy ? 'h-3 w-3 rounded-full' : hx ? 'h-5 w-2 rounded-full' : 'h-2 w-5 rounded-full'}`}
                    style={{ left: `${((hx + 1) / 2) * 100}%`, top: `${((hy + 1) / 2) * 100}%`, cursor }}
                    aria-label="Resize"
                  />
                ))}
              {showHandles && (
                <span onPointerDown={onRotate} className="pointer-events-auto absolute left-1/2 flex h-6 w-6 -translate-x-1/2 cursor-grab items-center justify-center rounded-full border border-line bg-white text-[#141518] shadow" style={{ top: 'calc(100% + 14px)' }} aria-label="Rotate">
                  <RotateCw size={13} />
                </span>
              )}
            </div>
          )}

          {sel && !sel.hidden && !readout && guides.v.length + guides.h.length === 0 && ed.editingId !== sel.id && (
            <div
              onPointerDown={(e) => e.stopPropagation()}
              className="absolute z-30 flex -translate-x-1/2 items-center gap-0.5 rounded-lg border border-line bg-toolbar p-0.5 shadow-lg"
              style={{ left: (sel.x + sel.w / 2) * zoom, top: Math.max(-46, sel.y * zoom - 48) }}
            >
              <button className={qa} onClick={ed.duplicateSel} title="Duplicate (Ctrl+D)" aria-label="Duplicate">
                <Copy size={15} />
              </button>
              <button className={qa} onClick={() => ed.updateEl(sel.id, { locked: !sel.locked })} title={sel.locked ? 'Unlock' : 'Lock'} aria-label={sel.locked ? 'Unlock' : 'Lock'}>
                {sel.locked ? <Lock size={15} /> : <LockOpen size={15} />}
              </button>
              <button className={qa} onClick={() => ed.arrange('front')} title="Bring to front" aria-label="Bring to front">
                <ArrowUpToLine size={15} />
              </button>
              <button className={`${qa} hover:text-red-400`} onClick={ed.removeSel} title="Delete" aria-label="Delete">
                <Trash2 size={15} />
              </button>
            </div>
          )}

          {readout && sel && (
            <div className="pointer-events-none absolute z-40 -translate-x-1/2 rounded-md bg-[#0b0c0e] px-2 py-1 font-mono text-xs text-white shadow" style={{ left: (sel.x + sel.w / 2) * zoom, top: (sel.y + sel.h) * zoom + 46 }}>
              {readout}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

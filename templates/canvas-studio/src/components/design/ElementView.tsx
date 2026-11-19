'use client';

import { motion } from 'framer-motion';
import { useId, type CSSProperties, type PointerEvent as RPointerEvent, type MouseEvent as RMouseEvent } from 'react';
import type { CanvasElement, DesignPage, Paint } from '@/types/canva';
import { displayText, fontCss, paintToCss, shapePath } from '@/lib/design';
import { motionFor } from '@/lib/animation';

function SvgPaint({ id, paint }: { id: string; paint: Paint }) {
  if (typeof paint === 'string') return null;
  if (paint.kind === 'radial')
    return (
      <radialGradient id={id} cx="0.5" cy="0.5" r="0.71">
        <stop offset="0" stopColor={paint.stops[0]} />
        <stop offset="1" stopColor={paint.stops[1]} />
      </radialGradient>
    );
  return (
    <linearGradient id={id} gradientTransform={`rotate(${(paint.angle ?? 135) - 90} 0.5 0.5)`}>
      <stop offset="0" stopColor={paint.stops[0]} />
      <stop offset="1" stopColor={paint.stops[1]} />
    </linearGradient>
  );
}

export function textStyle(el: CanvasElement): CSSProperties {
  const color = el.color ?? '#000';
  return {
    fontFamily: fontCss(el.fontFamily),
    fontSize: el.fontSize,
    fontWeight: el.fontWeight,
    fontStyle: el.italic ? 'italic' : 'normal',
    textDecoration: [el.underline && 'underline', el.strike && 'line-through'].filter(Boolean).join(' ') || 'none',
    textAlign: el.align,
    color,
    letterSpacing: el.letterSpacing,
    lineHeight: el.lineHeight,
    whiteSpace: 'pre-wrap',
    overflowWrap: 'break-word',
    textShadow: el.glow ? `0 0 ${Math.round((el.fontSize ?? 32) * 0.35)}px ${color}, 0 0 4px ${color}` : el.shadow ? '0 6px 18px rgba(0,0,0,0.45)' : undefined,
  };
}

export function ElementBody({ el, editing, onCommitText }: { el: CanvasElement; editing?: boolean; onCommitText?: (text: string) => void }) {
  const gid = useId().replace(/:/g, '');
  if (el.type === 'text') {
    if (editing)
      return (
        <div
          contentEditable
          suppressContentEditableWarning
          className="outline-none"
          style={{ ...textStyle(el), textTransform: el.uppercase ? 'uppercase' : undefined, minHeight: '100%', cursor: 'text' }}
          ref={(node) => {
            if (node && document.activeElement !== node) {
              node.focus();
              document.getSelection()?.selectAllChildren(node);
            }
          }}
          onBlur={(e) => onCommitText?.(e.currentTarget.innerText.replace(/\n$/, ''))}
          onKeyDown={(e) => {
            e.stopPropagation();
            if (e.key === 'Escape') e.currentTarget.blur();
          }}
          onPointerDown={(e) => e.stopPropagation()}
        >
          {el.text}
        </div>
      );
    return <div style={textStyle(el)}>{displayText(el)}</div>;
  }
  if (el.type === 'image')
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={el.src}
        alt={el.name ?? ''}
        draggable={false}
        style={{
          width: '100%', height: '100%', objectFit: 'cover', display: 'block', borderRadius: el.radius ?? 0,
          outline: el.strokeWidth ? `${el.strokeWidth}px solid ${el.stroke ?? '#fff'}` : undefined, outlineOffset: el.strokeWidth ? -el.strokeWidth : undefined,
        }}
      />
    );
  const fill = el.fill ?? '#CCCCCC';
  return (
    <svg width="100%" height="100%" viewBox={`0 0 ${el.w} ${el.h}`} preserveAspectRatio="none" overflow="visible" style={{ display: 'block' }}>
      <defs>
        <SvgPaint id={gid} paint={fill} />
      </defs>
      <path
        d={shapePath(el.shape, el.w, el.h, el.radius)}
        fill={typeof fill === 'string' ? fill : `url(#${gid})`}
        stroke={el.strokeWidth ? el.stroke : undefined}
        strokeWidth={el.strokeWidth || undefined}
      />
    </svg>
  );
}

interface ElementViewProps {
  el: CanvasElement;
  page?: DesignPage;
  index?: number;
  animate?: boolean;
  editing?: boolean;
  onCommitText?: (text: string) => void;
  onPointerDown?: (e: RPointerEvent<HTMLDivElement>) => void;
  onDoubleClick?: (e: RMouseEvent<HTMLDivElement>) => void;
  interactive?: boolean;
}

export function ElementView({ el, page, index = 0, animate, editing, onCommitText, onPointerDown, onDoubleClick, interactive }: ElementViewProps) {
  if (el.hidden) return null;
  const spec = animate ? motionFor(el.animation ?? page?.animation, el.animation ? 0 : index) : null;
  const flip = `${el.flipH ? ' scaleX(-1)' : ''}${el.flipV ? ' scaleY(-1)' : ''}`;
  const body = <ElementBody el={el} editing={editing} onCommitText={onCommitText} />;
  return (
    <div
      data-el={el.id}
      onPointerDown={onPointerDown}
      onDoubleClick={onDoubleClick}
      style={{
        position: 'absolute', left: el.x, top: el.y, width: el.w, height: el.h, opacity: el.opacity,
        transform: `rotate(${el.rotation}deg)${editing ? '' : flip}`,
        filter: el.shadow && el.type !== 'text' ? 'drop-shadow(0 12px 24px rgba(0,0,0,0.38))' : undefined,
        cursor: interactive ? (el.locked ? 'default' : 'move') : undefined,
        pointerEvents: interactive ? 'auto' : 'none',
        touchAction: 'none',
      }}
    >
      {spec ? (
        <motion.div style={{ width: '100%', height: '100%' }} initial={spec.initial} animate={spec.animate} transition={spec.transition}>
          {body}
        </motion.div>
      ) : (
        body
      )}
    </div>
  );
}

export function PageView({ page, width, height, animate, playKey }: { page: DesignPage; width: number; height: number; animate?: boolean; playKey?: number }) {
  return (
    <div key={playKey} style={{ position: 'relative', width, height, background: paintToCss(page.background), overflow: 'hidden' }}>
      {page.elements.map((el, i) => (
        <ElementView key={el.id} el={el} page={page} index={i} animate={animate} />
      ))}
    </div>
  );
}

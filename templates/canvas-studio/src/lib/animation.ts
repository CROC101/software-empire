import type { AnimationType, ElementAnimation } from '@/types/canva';
import type { TargetAndTransition, Transition } from 'framer-motion';

export const ANIMATIONS: { type: AnimationType; label: string; loop?: boolean }[] = [
  { type: 'none', label: 'None' },
  { type: 'fade', label: 'Fade' },
  { type: 'rise', label: 'Rise' },
  { type: 'pan', label: 'Pan' },
  { type: 'pop', label: 'Pop' },
  { type: 'typewriter', label: 'Typewriter' },
  { type: 'pulse', label: 'Pulse', loop: true },
  { type: 'float', label: 'Float', loop: true },
];

export interface MotionSpec {
  initial: TargetAndTransition;
  animate: TargetAndTransition;
  transition: Transition;
}

/** framer-motion props for an entrance / loop animation; index staggers page-level animations. */
export function motionFor(anim: ElementAnimation | undefined, index = 0): MotionSpec | null {
  if (!anim || anim.type === 'none') return null;
  const delay = anim.delay + index * 0.08;
  const t: Transition = { duration: anim.duration, delay, ease: [0.22, 1, 0.36, 1] };
  switch (anim.type) {
    case 'fade':
      return { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: t };
    case 'rise':
      return { initial: { opacity: 0, y: 60 }, animate: { opacity: 1, y: 0 }, transition: t };
    case 'pan':
      return { initial: { opacity: 0, x: -90 }, animate: { opacity: 1, x: 0 }, transition: t };
    case 'pop':
      return { initial: { opacity: 0, scale: 0.4 }, animate: { opacity: 1, scale: 1 }, transition: { type: 'spring', stiffness: 420, damping: 22, delay } };
    case 'typewriter':
      return { initial: { clipPath: 'inset(0 100% 0 0)' }, animate: { clipPath: 'inset(0 0% 0 0)' }, transition: { duration: anim.duration * 1.6, delay, ease: 'linear' } };
    case 'pulse':
      return { initial: { scale: 1 }, animate: { scale: [1, 1.07, 1] }, transition: { duration: anim.duration * 2, delay, repeat: Infinity, ease: 'easeInOut' } };
    case 'float':
      return { initial: { y: 0 }, animate: { y: [0, -16, 0] }, transition: { duration: anim.duration * 3, delay, repeat: Infinity, ease: 'easeInOut' } };
  }
}

export const DEFAULT_ANIM: ElementAnimation = { type: 'rise', duration: 0.6, delay: 0 };

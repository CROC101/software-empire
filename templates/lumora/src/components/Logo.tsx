import { Link } from 'react-router-dom';
import { brand } from '../brand.config';

/** Brand wordmark. Height drives size; text fills the box like a logo image would. */
export function Logo({ height = 40, to = '/th/', className = '' }: { height?: number; to?: string; className?: string }) {
  return (
    <Link to={to} aria-label={`${brand.name} หน้าหลัก`} className={`inline-flex items-center no-underline ${className}`} style={{ height }}>
      <span
        className="font-display text-accent leading-none select-none"
        style={{ fontSize: height * 1.12, letterSpacing: height * 0.02, transform: 'scaleY(1.02)', textShadow: '0 1px 0 rgba(0,0,0,.25)' }}
      >
        {brand.wordmark}
      </span>
    </Link>
  );
}

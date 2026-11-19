/** Original mark: a white disc with four equalizer bars (neutral placeholder, not the original brand). */
export default function Logo({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden>
      <circle cx="16" cy="16" r="16" fill="#fff" />
      <rect x="8" y="13" width="3" height="8" rx="1.5" fill="#000" />
      <rect x="12.5" y="9" width="3" height="14" rx="1.5" fill="#000" />
      <rect x="17" y="11" width="3" height="11" rx="1.5" fill="#000" />
      <rect x="21.5" y="14" width="3" height="6" rx="1.5" fill="#000" />
    </svg>
  );
}

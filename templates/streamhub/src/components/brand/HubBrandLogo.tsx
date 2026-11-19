import Link from "next/link";

/** Split wordmark: white "Stream" + black "Hub" on an orange box. */
export function HubBrandLogo({ size = 30, badge = false, href = "/" }: { size?: number; badge?: boolean; href?: string | null }) {
  const mark = (
    <span className="group inline-flex select-none items-center font-bold leading-none tracking-[-0.02em]" style={{ fontSize: size }}>
      <span className="text-white">Stream</span>
      <span
        className="ml-[3px] rounded-[4px] bg-brand px-[4px] pb-[3px] pt-[2px] text-black transition-shadow duration-300 group-hover:shadow-[0_0_14px_rgba(255,144,0,0.65)]"
      >
        Hub
      </span>
      {badge && (
        <span className="ml-2 hidden rounded-[2px] border border-brand px-1 py-[2px] text-[9px] font-bold tracking-normal text-brand xl:inline">
          4K PRO
        </span>
      )}
    </span>
  );
  return href ? (
    <Link href={href} aria-label="StreamHub home" className="inline-flex items-center">
      {mark}
    </Link>
  ) : (
    mark
  );
}

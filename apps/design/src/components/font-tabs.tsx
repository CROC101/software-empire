/** ไทย | อังกฤษ switch at the top of both font pages (plain <a>, see the (site) layout note). */
export function FontTabs({ current }: { current: "th" | "en" }) {
  const tabs = [
    ["th", "/fonts", "ฟอนต์ไทย"],
    ["en", "/fonts/en", "ฟอนต์อังกฤษ"],
  ] as const;
  return (
    <nav aria-label="ประเภทฟอนต์" className="inline-flex rounded-md border p-1 text-sm">
      {tabs.map(([k, href, label]) => (
        <a
          key={k}
          href={href}
          aria-current={k === current ? "page" : undefined}
          className="rounded-sm px-4 py-1.5 text-muted-foreground transition-colors hover:text-foreground aria-[current=page]:bg-foreground aria-[current=page]:text-background"
        >
          {label}
        </a>
      ))}
    </nav>
  );
}

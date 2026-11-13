import apps from "@/lib/everything-apps.json";

// Each app is a separate static build under /everything/<slug>/, so links are full page loads.
export function EverythingView() {
  return (
    <main className="px-4 py-6 sm:px-8 sm:py-10">
      <div className="mx-auto max-w-7xl">
        <p className="font-mono text-xs tracking-[0.2em] text-on-surface-variant uppercase">
          Everything apps
        </p>
        <h1 className="mt-2 font-display text-3xl font-bold">แอปทำงานครบชุด</h1>
        <p className="mt-2 max-w-2xl text-on-surface-variant">
          {apps.length} แอปจาก HeyPuter/everything (MIT) ข้อมูลเก็บในเบราว์เซอร์นี้เท่านั้น
          ไม่มีการส่งขึ้นเซิร์ฟเวอร์
        </p>
        <ul className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {apps.map((app) => (
            <li key={app.slug}>
              <a
                href={`/everything/${app.slug}/`}
                className="lift flex h-full min-h-28 gap-3 rounded-2xl border border-outline-variant/70 bg-surface-container-lowest p-4"
              >
                <img
                  src={`/everything/${app.slug}/icon-128.png`}
                  alt=""
                  width={44}
                  height={44}
                  className="size-11 shrink-0 rounded-xl"
                />
                <span className="min-w-0">
                  <span className="block font-semibold leading-snug text-on-surface">
                    {app.name}
                  </span>
                  <span className="mt-1 line-clamp-2 block text-sm leading-relaxed text-on-surface-variant">
                    {app.description}
                  </span>
                </span>
              </a>
            </li>
          ))}
        </ul>
        <p className="mt-8 text-sm text-on-surface-variant">
          สัญญาอนุญาตและต้นทางของแต่ละแอปอยู่ในไฟล์ LICENSE และ SOURCE.md ในโฟลเดอร์ของแอปนั้น
        </p>
      </div>
    </main>
  );
}

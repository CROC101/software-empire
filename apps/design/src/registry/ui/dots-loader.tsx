/** Three dots hop one after another. */
export default function DotsLoader() {
  return (
    <div
      className="grid size-full min-h-56 place-items-center bg-(--em-ink-975) p-6"
      role="status"
      aria-label="กำลังโหลด"
    >
      <style>{`@keyframes dots-loader-hop{0%,60%,100%{transform:translateY(0);opacity:.5}30%{transform:translateY(-12px);opacity:1}}.dots-loader-dot{animation:dots-loader-hop 1s ease-in-out infinite}@media (prefers-reduced-motion:reduce){.dots-loader-dot{animation:none;opacity:.8}}`}</style>
      <div className="flex gap-2">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="dots-loader-dot vt-live size-3 rounded-full bg-(--em-sky-400)"
            style={{ animationDelay: `${String(i * 0.15)}s` }}
          />
        ))}
      </div>
    </div>
  );
}

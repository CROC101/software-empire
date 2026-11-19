/** A chat bubble with three dots bobbing in turn: someone is typing. */
export default function TypingDots() {
  return (
    <div className="flex size-full min-h-56 flex-col justify-center gap-2 bg-(--em-ink-975) p-6">
      <style>{`@keyframes typing-dots-bob{0%,60%,100%{transform:translateY(0);opacity:.4}30%{transform:translateY(-5px);opacity:1}}.typing-dots-dot{animation:typing-dots-bob 1.2s ease-in-out infinite}@media (prefers-reduced-motion:reduce){.typing-dots-dot{animation:none;opacity:.7}}`}</style>
      <p className="max-w-[70%] self-end rounded-xl rounded-br-sm bg-(--em-blue-600) px-4 py-2 text-sm text-(--em-ink-0)">
        งานเสร็จยังครับ
      </p>
      <div
        role="status"
        aria-label="อีกฝ่ายกำลังพิมพ์"
        className="flex gap-1 self-start rounded-xl rounded-bl-sm bg-(--em-ink-800) px-4 py-3.5"
      >
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="typing-dots-dot vt-live size-2 rounded-full bg-(--em-ink-200)"
            style={{ animationDelay: `${String(i * 0.18)}s` }}
          />
        ))}
      </div>
    </div>
  );
}

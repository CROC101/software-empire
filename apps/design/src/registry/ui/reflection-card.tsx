import { Waves } from "lucide-react";

function Face() {
  return (
    <div className="w-56 rounded-xl border border-(--em-ink-700) bg-linear-to-br from-(--em-ink-850) to-(--em-ink-950) p-5">
      <Waves aria-hidden className="size-6 text-(--em-sky-400)" />
      <p className="mt-6 font-heading text-xl font-black text-(--em-ink-50)">ลอยบนน้ำ</p>
      <p className="text-sm text-(--em-ink-300)">มีเงาสะท้อนใต้ผิวน้ำ</p>
    </div>
  );
}

/** The card bobs on the water; its reflection hangs below, faded and wobbling with the ripples. */
export default function ReflectionCard() {
  return (
    <div className="relative grid size-full min-h-80 place-items-center overflow-hidden bg-(--em-ink-975) p-6">
      <style>{`@keyframes reflection-card-bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}@keyframes reflection-card-mirror{0%,100%{transform:scaleY(-1) translateY(0) skewX(0)}50%{transform:scaleY(-1) translateY(-6px) skewX(2deg)}}.reflection-card-up{animation:reflection-card-bob 4s ease-in-out infinite}.reflection-card-down{animation:reflection-card-mirror 4s ease-in-out infinite}@media (prefers-reduced-motion:reduce){.reflection-card-up{animation:none}.reflection-card-down{animation:none;transform:scaleY(-1)}}`}</style>
      <div className="relative flex flex-col items-center">
        <div className="reflection-card-up vt-live">
          <Face />
        </div>
        <div
          aria-hidden
          className="reflection-card-down vt-live mt-2 opacity-35 blur-[1px] [mask-image:linear-gradient(to_top,#000,transparent_70%)]"
        >
          <Face />
        </div>
        <div
          aria-hidden
          className="absolute inset-x-[-30%] top-[calc(50%+0.25rem)] h-px bg-(--em-sky-400)/50"
        />
      </div>
    </div>
  );
}

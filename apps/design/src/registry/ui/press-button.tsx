/** A raised 3D key: the face sits on a darker base and really sinks into it when pressed. */
export default function PressButton({ label = "กดเลย" }: { label?: string }) {
  return (
    <div className="grid size-full min-h-56 place-items-center bg-(--em-ink-975) p-6">
      <button
        type="button"
        className="group relative rounded-lg bg-(--em-blue-800) pt-0 pb-2 outline-offset-4"
      >
        <span className="block -translate-y-1.5 rounded-lg border border-(--em-blue-400)/50 bg-(--em-blue-600) px-9 py-4 font-black text-(--em-ink-0) transition-transform duration-150 ease-out group-hover:-translate-y-2 group-active:translate-y-0 motion-reduce:transition-none">
          {label}
        </span>
      </button>
    </div>
  );
}

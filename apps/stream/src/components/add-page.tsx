import { cn } from "@empire/ui";
import { Check, Link2, LogIn } from "lucide-react";
import { useState, type SyntheticEvent } from "react";
import { useNavigate } from "react-router";
import { KINDS, lookup, saveItem, type Kind } from "@/lib/api";
import { useData } from "@/lib/data";
import { signInUrl, useSession } from "@/lib/session";
import { thumb, youtubeId, type Oembed } from "@/lib/youtube";

const KIND_LABEL: Record<Kind, string> = {
  video: "วิดีโอ",
  movie: "หนัง",
  music: "เพลง",
  short: "Shorts",
};
const KIND_PATH: Record<Kind, string> = {
  video: "/videos",
  movie: "/movies",
  music: "/music",
  short: "/shorts",
};

/** The kind a link most likely is, from where it was copied. */
export function guessKind(link: string): Kind {
  const url = URL.parse(link.trim()) ?? URL.parse(`https://${link.trim()}`);
  if (!url) return "video";
  if (url.hostname === "music.youtube.com") return "music";
  if (/^(www\.|m\.)?youtube\.com$/.test(url.hostname) && url.pathname.startsWith("/shorts/"))
    return "short";
  return "video";
}

/** Paste a YouTube link, check it with YouTube, pick a shelf, save. Nothing is downloaded. */
export function AddPage() {
  const { user, ready } = useSession();
  const { refresh } = useData();
  const navigate = useNavigate();
  const [link, setLink] = useState("");
  const [found, setFound] = useState<{ id: string; info: Oembed } | null>(null);
  const [kind, setKind] = useState<Kind>("video");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (ready && !user)
    return (
      <div className="mx-auto grid max-w-md gap-4 px-4 py-16 text-center">
        <p className="text-[var(--em-ink-200)]">ล็อกอินก่อน แล้วลิงก์ที่เพิ่มจะซิงก์ทุกเครื่อง</p>
        <a
          href={signInUrl(location.href)}
          className="mx-auto inline-flex min-h-11 items-center gap-2 rounded-md bg-[var(--em-blue-600)] px-5 font-semibold text-[var(--em-ink-0)]"
        >
          <LogIn className="size-4" aria-hidden /> ล็อกอิน
        </a>
      </div>
    );

  const check = async (e: SyntheticEvent) => {
    e.preventDefault();
    setError(null);
    setFound(null);
    const id = youtubeId(link);
    if (!id) {
      setError("ไม่ใช่ลิงก์ YouTube ลองคัดลอกจากปุ่มแชร์ของ YouTube");
      return;
    }
    setBusy(true);
    try {
      setFound({ id, info: await lookup(id) });
      setKind(guessKind(link));
    } catch (err) {
      setError(err instanceof Error ? err.message : "ถาม YouTube ไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  };

  const save = async () => {
    if (!found) return;
    setBusy(true);
    try {
      await saveItem({ youtube_id: found.id, kind, ...found.info });
      refresh();
      void navigate(KIND_PATH[kind]);
    } catch (err) {
      console.error("บันทึกไม่สำเร็จ", err);
      setError("บันทึกไม่สำเร็จ ลองใหม่อีกครั้ง");
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-xl px-4 py-5">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--em-blue-300)]">Add</p>
      <h1 className="mb-1 text-3xl font-black text-[var(--em-ink-0)]">เพิ่มลิงก์</h1>
      <p className="mb-5 text-sm text-[var(--em-ink-300)]">
        วางลิงก์จาก YouTube (วิดีโอ, Shorts, YouTube Music) คลิปเล่นผ่านเครื่องเล่นของ YouTube เอง
        เราเก็บแค่ลิงก์กับชื่อ
      </p>
      <form onSubmit={(e) => void check(e)} className="flex gap-2">
        <label htmlFor="link" className="sr-only">
          ลิงก์ YouTube
        </label>
        <input
          id="link"
          type="url"
          inputMode="url"
          required
          value={link}
          onChange={(e) => setLink(e.target.value)}
          placeholder="https://youtu.be/…"
          className="min-h-12 min-w-0 flex-1 rounded-md border border-[color-mix(in_oklab,var(--em-ink-0)_18%,transparent)] bg-[var(--em-ink-950)] px-3 text-[var(--em-ink-0)] placeholder:text-[var(--em-ink-400)] focus:border-[var(--em-blue-400)] focus:outline-none"
        />
        <button
          type="submit"
          disabled={busy}
          className="inline-flex min-h-12 items-center gap-2 rounded-md bg-[var(--em-blue-600)] px-4 font-semibold text-[var(--em-ink-0)] hover:bg-[var(--em-blue-500)] disabled:opacity-60"
        >
          <Link2 className="size-4" aria-hidden /> ตรวจ
        </button>
      </form>
      {error && (
        <p role="alert" className="mt-3 text-sm text-[var(--em-coral-400)]">
          {error}
        </p>
      )}
      {found && (
        <div className="mt-5 grid gap-4 rounded-xl border border-[color-mix(in_oklab,var(--em-ink-0)_12%,transparent)] bg-[var(--em-ink-950)] p-4">
          <div className="flex gap-3">
            <img
              src={thumb(found.id)}
              alt=""
              className="aspect-video w-32 shrink-0 rounded object-cover"
            />
            <div className="min-w-0">
              <p className="line-clamp-2 font-semibold text-[var(--em-ink-0)]">
                {found.info.title}
              </p>
              <p className="truncate text-sm text-[var(--em-ink-300)]">{found.info.author}</p>
            </div>
          </div>
          <fieldset>
            <legend className="mb-2 text-sm text-[var(--em-ink-200)]">เก็บไว้ในโหมด</legend>
            <div className="grid grid-cols-4 gap-2">
              {KINDS.map((k) => (
                <label
                  key={k}
                  className={cn(
                    "flex min-h-11 cursor-pointer items-center justify-center rounded-md border text-sm font-semibold has-focus-visible:outline-2 has-focus-visible:outline-[var(--em-blue-300)]",
                    kind === k
                      ? "border-[var(--em-blue-400)] bg-[color-mix(in_oklab,var(--em-blue-500)_20%,transparent)] text-[var(--em-ink-0)]"
                      : "border-[color-mix(in_oklab,var(--em-ink-0)_15%,transparent)] text-[var(--em-ink-200)]",
                  )}
                >
                  <input
                    type="radio"
                    name="kind"
                    value={k}
                    checked={kind === k}
                    onChange={() => setKind(k)}
                    className="sr-only"
                  />
                  {KIND_LABEL[k]}
                </label>
              ))}
            </div>
          </fieldset>
          <button
            type="button"
            disabled={busy}
            onClick={() => void save()}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-[var(--em-ink-0)] font-bold text-[var(--em-ink-975)] hover:bg-[var(--em-ink-100)] disabled:opacity-60"
          >
            <Check className="size-5" aria-hidden /> บันทึก
          </button>
        </div>
      )}
    </div>
  );
}

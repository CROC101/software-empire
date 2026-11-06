import { TAROT_HOME } from "@empire/core/cms-pages";
import { Megaphone, MessageCircle } from "lucide-react";
import { useCmsContent } from "@/lib/cms";
import { env } from "@/lib/env";

/** The owner's notice from the hub's /admin; hidden there with the section switch. */
export function Announcement() {
  const cms = useCmsContent(TAROT_HOME);
  const shown = cms.sections().find((s) => s.key === "announce")?.visible ?? true;
  const title = cms.text("announce.title").trim();
  const body = cms.text("announce.body").trim();
  if (!shown || (!title && !body)) return null;
  return (
    <aside aria-label="ประกาศ" className="tt-panel flex gap-3 p-4">
      <Megaphone className="mt-0.5 size-5 shrink-0 text-[var(--em-gold-300)]" aria-hidden />
      <div>
        {title && <p className="font-semibold text-[var(--em-ink-0)]">{title}</p>}
        {body && <p className="whitespace-pre-line text-sm text-[var(--em-ink-200)]">{body}</p>}
      </div>
    </aside>
  );
}

/** Questions people ask, and how to reach the studio; both edited at the hub's /admin. */
export function Help() {
  const cms = useCmsContent(TAROT_HOME);
  const visible = (key: string) => cms.sections().find((s) => s.key === key)?.visible ?? true;
  const faq = [1, 2, 3, 4, 5]
    .map((i) => ({
      q: cms.text(`faq.q${String(i)}`).trim(),
      a: cms.text(`faq.a${String(i)}`).trim(),
    }))
    .filter((x) => x.q);
  const line = cms.text("contact.line").trim().replace(/^@?/, "@");

  return (
    <>
      {visible("faq") && faq.length > 0 && (
        <section aria-labelledby="faq-title" className="tt-panel p-4">
          <h2 id="faq-title" className="mb-2 font-bold text-[var(--em-ink-0)]">
            คำถามที่พบบ่อย
          </h2>
          <div className="divide-y divide-[color-mix(in_oklab,var(--em-ink-0)_10%,transparent)]">
            {faq.map(({ q, a }) => (
              <details key={q} className="group py-1">
                <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold">
                  {q}
                  <span
                    aria-hidden
                    className="text-[var(--em-ink-400)] transition-transform group-open:rotate-45"
                  >
                    +
                  </span>
                </summary>
                <p className="whitespace-pre-line pb-3 text-sm text-[var(--em-ink-200)]">{a}</p>
              </details>
            ))}
          </div>
        </section>
      )}
      {visible("contact") && (
        <section aria-labelledby="contact-title" className="tt-panel space-y-3 p-4">
          <h2 id="contact-title" className="font-bold text-[var(--em-ink-0)]">
            ติดต่อเรา
          </h2>
          <div className="grid gap-2 sm:grid-cols-2">
            {line !== "@" && (
              <a
                href={`https://line.me/R/ti/p/${encodeURIComponent(line)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex min-h-11 items-center justify-center gap-2 rounded-md bg-[var(--em-success)] font-bold text-[var(--em-ink-0)]"
              >
                <MessageCircle className="size-4" aria-hidden /> LINE {line}
              </a>
            )}
            <a
              href={new URL("/#contact", env.hubUrl).href}
              className="flex min-h-11 items-center justify-center rounded-md border border-[color-mix(in_oklab,var(--em-ink-0)_25%,transparent)] font-semibold"
            >
              ติดต่อ crocwork studio
            </a>
          </div>
        </section>
      )}
    </>
  );
}

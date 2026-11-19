"use client";

import Link from "next/link";
import { useState } from "react";
import { Info } from "lucide-react";
import { useHub } from "@/context/MediaHubContext";

const input = "block h-[48px] w-full max-w-[393px] rounded-[2px] bg-field px-[12px] text-xs text-white placeholder:text-muted outline-none focus:ring-1 focus:ring-brand";
const REASONS = ["Copyright or trademark issue", "Privacy concern", "Harassment or bullying", "Misleading or spam content", "Other"];
const RELATION = ["I am the person in the content", "Rights holder", "Authorized representative", "None", "Other (please specify)"];

function Check({ label, name, tip }: { label: string; name: string; tip?: boolean }) {
  return (
    <label className="flex min-h-[44px] cursor-pointer items-center gap-[8px] text-[15px] md:text-[15.96px] text-white">
      <input type="checkbox" name={name} value={label} className="peer sr-only" />
      <span className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-[2px] border border-hairline bg-field text-black peer-checked:bg-brand peer-checked:after:content-['✓'] peer-focus-visible:ring-1 peer-focus-visible:ring-brand" />
      {label}
      {tip && <Info className="h-4 w-4 shrink-0 fill-white text-black" aria-hidden />}
    </label>
  );
}

export default function ContentRemovalPage() {
  const { toast } = useHub();
  const [sent, setSent] = useState(false);

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    if (f.get("email") !== f.get("confirm")) return toast("Email addresses don't match");
    if (!f.getAll("reason").length) return toast("Choose what you are reporting");
    setSent(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="mx-auto max-w-grid pb-[60px] pr-[15px] md:pb-[100px] pt-[42px] xl:pr-0">
      <h1 className="text-[20px] font-bold text-brand-text">Content Removal Request</h1>
      <div className="mt-[31px] px-[27px] text-[15px] leading-[20px] text-ink-body">
        {sent ? (
          <p role="status" className="rounded-[3px] border border-approve/40 bg-approve/10 p-4 text-white">
            Thanks — your request was received. In this demo nothing is sent; a real service would email you a confirmation link.
            <Link href="/" className="ml-1 text-brand-text">Back to home</Link>
          </p>
        ) : (
          <form onSubmit={submit} className="space-y-[18px]">
            <h3 className="text-[16px] font-bold uppercase text-ink-soft">Report content that breaks our rules</h3>
            <p>
              Our support team reviews every request. Read the <Link href="/information/terms" className="text-brand-text">Terms of Service</Link> and
              the <Link href="/information/trust-and-safety" className="text-brand-text">Trust and Safety</Link> page to learn how we handle reports.
              Requests are processed around the clock, and you can read about the process in our <Link href="/information/faq" className="text-brand-text">FAQ</Link>.
            </p>
            <p>You may ask us to remove content that:</p>
            <ul className="list-disc space-y-1 pl-[22px] md:space-y-0">
              <li>Violates our <Link href="/information/copyright" className="text-brand-text">Copyright Policy</Link></li>
              <li>Violates our <Link href="/information/privacy" className="text-brand-text">Privacy Notice</Link></li>
              <li>Was posted without permission from the person who made it</li>
              <li>Harasses, threatens or impersonates someone</li>
              <li>May otherwise be against the law</li>
            </ul>
            <p>
              If you simply dislike a video, you can hide it from your recommendations instead. For content you think may break our rules, please use
              this form or the report button on the video page.
            </p>
            <p className="font-bold text-white">Contact Information</p>
            <p>
              Your report is confidential. The uploader will not see your name or contact details if you choose not to share them. If you would rather not
              leave your details, you may report anonymously from the video page.
            </p>
            <p>We may contact you if we need more information about your request and to tell you about any action taken on the content or account.</p>

            {[
              ["email", "Email", "email"],
              ["confirm", "Confirm Email", "email"],
              ["name", "Legal Name", "text"],
            ].map(([n, label, type]) => (
              <div key={n} className="md:pt-[8px]">
                <label htmlFor={n} className="mb-[12px] block md:mb-[17px] text-[16px] font-bold text-white">{label}</label>
                <input id={n} name={n} type={type} required placeholder={label} autoComplete={n === "name" ? "name" : "email"} className={input} />
              </div>
            ))}

            <fieldset>
              <legend className="mb-[12px] flex md:mb-[24px] items-center gap-2 text-[16px] font-bold text-white">
                URL(s) of the content you are reporting <Info className="h-4 w-4 fill-white text-black" aria-hidden />
              </legend>
              <div className="space-y-[32px]">
                {[0, 1, 2, 3, 4].map((i) => (
                  <input key={i} name="url" type="url" required={i === 0} placeholder="Url here" aria-label={`Content URL ${i + 1}`} className={input} />
                ))}
              </div>
            </fieldset>

            <fieldset className="md:mt-[60px]!">
              <legend className="mb-[6px] text-[16px] md:mb-[14px] font-bold text-white">What are you reporting?</legend>
              <p className="mb-[6px] md:mb-[15px]">See our <Link href="/information/faq" className="text-brand-text">community guidelines</Link> for what is not allowed.</p>
              {REASONS.map((r) => <Check key={r} name="reason" label={r} tip />)}
            </fieldset>

            <fieldset className="md:mt-[30px]!">
              <legend className="mb-[6px] text-[16px] md:mb-[15px] font-bold text-white">What is your relationship to the content?</legend>
              {RELATION.map((r) => <Check key={r} name="relation" label={r} />)}
            </fieldset>

            <p className="text-[16px] md:mt-[26px]! text-white">Confirmation &amp; Notice</p>
            <p>
              Please review everything you entered before you send your request. By typing your name in the field below, you confirm that you are the
              person named in this form and that all of the information you provided is accurate.
            </p>
            <input name="signature" required placeholder="Legal Name" aria-label="Signature (legal name)" className={input} />
            <p>
              After you submit, we will send a confirmation email to the address you gave. Once you click the link in that email, the content at the
              URLs you listed will be disabled while we review it.            </p>
            <p>Please note that misuse of this form slows down our team&apos;s work on real, actionable reports.</p>
            <button className="mt-[36px]! h-[45px] w-full max-w-[393px] rounded-[2px] bg-brand text-[13.33px] font-bold text-black hover:bg-brand-hover">Submit</button>
          </form>
        )}
      </div>
    </div>
  );
}

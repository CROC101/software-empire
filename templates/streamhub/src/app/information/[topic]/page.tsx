import Link from "next/link";

const TOPICS: Record<string, { title: string; body: string[] }> = {
  terms: { title: "Terms & Conditions", body: ["By using StreamHub you agree to follow these terms and our community rules.", "You keep ownership of what you upload and give us permission to show it on the site.", "We may remove content or accounts that break the rules."] },
  privacy: { title: "Privacy Notice", body: ["This demo keeps your history, playlists and uploads only in your own browser (local storage).", "Nothing is sent to a server. Clearing your browser data removes it."] },
  copyright: { title: "Copyright", body: ["Only upload videos you made or have the rights to share.", "Rights holders can ask for removal using the content removal form."] },
  accessibility: { title: "Accessibility", body: ["All controls can be reached with the keyboard. The player supports Space, F and arrow keys.", "Tell us about any barrier you find and we will work to fix it."] },
  press: { title: "Press", body: ["For media questions, logos and screenshots, contact our press team.", "StreamHub is a demo streaming hub for creators of animation, games and tech videos."] },
  faq: { title: "FAQ", body: ["How do I save a video? Use the clock (Watch Later) or the heart (Favorite).", "How do I upload? Open Upload, pick a file or a sample stream and press Publish.", "Where are my playlists? Open the profile menu or the Library section in the menu."] },
  "trust-and-safety": { title: "Trust and Safety", body: ["Every report is reviewed by a person.", "We remove content that harasses people, shares private information or infringes rights."] },
};

export const dynamicParams = false;
export function generateStaticParams() {
  return Object.keys(TOPICS).map((topic) => ({ topic }));
}

export async function generateMetadata({ params }: { params: Promise<{ topic: string }> }) {
  const { topic } = await params;
  return { title: `${TOPICS[topic].title} - StreamHub` };
}

export default async function InformationPage({ params }: { params: Promise<{ topic: string }> }) {
  const { topic } = await params;
  const t = TOPICS[topic];
  return (
    <div className="mx-auto max-w-grid px-[15px] pb-[60px] pt-[30px] xl:px-0">
      <h1 className="text-[20px] font-bold text-brand-text">{t.title}</h1>
      <div className="mt-[20px] space-y-[14px] text-[15px] leading-[20px] text-ink-body md:px-[27px]">
        {t.body.map((p) => <p key={p}>{p}</p>)}
        <p>
          Questions? Use the <Link href="/content-removal" className="text-brand-text">content removal form</Link> or read the{" "}
          <Link href="/information/faq" className="text-brand-text">FAQ</Link>.
        </p>
      </div>
    </div>
  );
}

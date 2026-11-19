import Link from "next/link";

export const metadata = { title: "Cookie Notice - StreamHub" };

type Row = [name: string, party: string, purpose: string, expiry: string];

const PURPOSES: Record<string, string[]> = {
  ess: ["Remembers that you entered the website", "Keeps your session secure", "Balances traffic between servers", "Stores your cookie choices", "Protects forms against forgery", "Remembers your region for legal notices"],
  fun: ["Remembers your language", "Stores player volume and quality", "Keeps your Watch Later list", "Remembers the theater mode setting", "Stores search scope", "Keeps your recently viewed videos"],
  ads: ["Would limit how often a promotion is shown", "Would measure promotion clicks", "Would match promotions to the page topic", "Would remember dismissed promotions", "Would group visits by device"],
  ana: ["Counts page views", "Measures how long videos are watched", "Detects slow pages", "Records which menus are used"],
  ls: ["Saved playlists", "Uploaded videos", "Subscriptions", "Ratings and comments", "Welcome gate choice"],
};

/** Deterministic demo table: one entry per purpose, repeated with numbered names. */
const rows = (key: string, count: number, party: string, expiries: string[]): Row[] =>
  Array.from({ length: count }, (_, i) => {
    const p = PURPOSES[key];
    return [`sh_${key}_${String(i + 1).padStart(2, "0")}`, party, p[i % p.length], expiries[i % expiries.length]];
  });

function CookieTable({ data }: { data: Row[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[560px] border-collapse text-left text-[12px] text-[#d2d2d2]">
        <thead>
          <tr className="bg-surface-2 text-ink-soft">
            {["Cookie name", "First or third party", "Purpose", "Expiry"].map((h) => (
              <th key={h} className="border border-hairline px-[10px] py-[10px] font-bold">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((r) => (
            <tr key={r[0]} className="odd:bg-surface">
              {r.map((c, i) => <td key={i} className="border border-hairline px-[10px] py-[10px]">{c}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const H3 = ({ children }: { children: React.ReactNode }) => <h3 className="mt-[24px] text-[18px] font-bold leading-[38px] text-ink-soft">{children}</h3>;
const H4 = ({ children }: { children: React.ReactNode }) => <h4 className="mt-[16px] text-[12px] font-bold text-ink-soft">{children}</h4>;

export default function CookieNoticePage() {
  return (
    <div className="mx-auto max-w-grid px-[15px] pb-[60px] pt-[30px] text-[12px] leading-[18px] text-[#d2d2d2] xl:pl-[7px] xl:pr-[42px]">
      <h1 className="text-[20px] font-bold text-white">Cookie Notice</h1>
      <p className="mt-[4px] text-[#9d9d9d]">Last updated: November 2026</p>

      <H3>What are cookies?</H3>
      <p>Cookies are small text files that a website places on your device when you visit. They let the website remember your actions and preferences, such as your language or whether you entered the site, so you don&apos;t have to set them again each time you come back or move between pages.</p>
      <p className="mt-[10.5px]">Cookies set by the website you are visiting are called first party cookies. Cookies set by another service, for example a video or analytics provider, are called third party cookies. Session cookies are deleted when you close your browser; persistent cookies stay until they expire or you delete them.</p>

      <H3>What are Local Storage Objects?</H3>
      <p>Local storage is a part of your browser where a website can keep larger pieces of data on your own device. Unlike cookies, this data is never sent to a server with each request. StreamHub keeps all of your library here.</p>

      <H3>How we use cookies</H3>
      <p>We sort cookies into the groups below. You can turn every group except essential cookies on or off at any time from the Manage Cookies option in the footer.</p>

      <H3>Essential Cookies</H3>
      <p className="mb-[12px]">These cookies are needed for the website to work and cannot be switched off. They are usually set in response to something you do, such as entering the site or filling in a form.</p>
      <CookieTable data={rows("ess", 38, "First party", ["Session", "1 year", "30 days"])} />

      <H3>Functional Cookies</H3>
      <p className="mb-[12px]">These cookies remember the choices you make so the website works the way you like. If you block them, some features, such as your player settings, may not work.</p>
      <CookieTable data={rows("fun", 34, "First party", ["1 year", "6 months", "Session"])} />

      <H3>Targeting/Advertising cookies</H3>
      <p className="mb-[12px]">This demo shows no advertising and sets none of these cookies. The table lists what such cookies would do, so you know what to look for on other services.</p>
      <CookieTable data={rows("ads", 28, "Third party", ["90 days", "1 year"])} />

      <H3>Analytics cookies</H3>
      <p className="mb-[12px]">Analytics cookies help a website owner understand how visitors use the site. In this demo they are switched off by default and nothing is sent anywhere.</p>
      <CookieTable data={rows("ana", 15, "First party", ["2 years", "24 hours", "Session"])} />

      <H3>Third Party Cookies</H3>
      <p>Embedded sample videos are streamed from a public test bucket. That service may set its own cookies, which are covered by its own policy.</p>

      <H3>Google Analytics</H3>
      <p>Many websites use Google Analytics to count visits. StreamHub does not load it. If a future version does, it will only run after you agree in the cookie banner, and the data will be anonymised.</p>

      <H3>Local Storage</H3>
      <p className="mb-[12px]">These keys are stored on your device by StreamHub. Clearing your browser data removes them.</p>
      <CookieTable data={rows("ls", 15, "First party", ["Until cleared"])} />

      <H3>How To Control and Delete Cookies</H3>
      <H4>Cookie Banner</H4>
      <p>When you first visit, a banner lets you accept or customise cookies. You can change your mind at any time.</p>
      <H4>Manage Cookies Option</H4>
      <p>
        Use the <Link href="/information/cookie-notice" className="text-brand-text">Manage Cookies</Link> link in the footer to turn optional groups on or off.
      </p>
      <H4>Browser Settings</H4>
      <p>Most browsers let you block or delete cookies. Look in the settings or help pages of your browser:</p>
      <ul className="mt-[10.5px] list-disc space-y-[4px] pl-[24px]">
        {["Chrome: Settings → Privacy and security → Cookies", "Firefox: Settings → Privacy & Security → Cookies and Site Data", "Safari: Settings → Privacy → Manage Website Data", "Edge: Settings → Cookies and site permissions", "Opera: Settings → Privacy & security → Cookies"].map((b) => <li key={b}>{b}</li>)}
      </ul>
      <p className="mt-[16px]">
        Questions? Read the <Link href="/information/privacy" className="text-brand-text">Privacy Notice</Link> or the <Link href="/information/faq" className="text-brand-text">FAQ</Link>.
      </p>
    </div>
  );
}

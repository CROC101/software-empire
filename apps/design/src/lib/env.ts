// shortcut: no deploy yet, so the hub falls back to local dev; set NEXT_PUBLIC_HUB_URL when design ships
const hub = process.env.NEXT_PUBLIC_HUB_URL;
export const hubUrl = hub && URL.canParse(hub) ? hub : "http://localhost:3000";

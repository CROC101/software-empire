// deploy.yml writes NEXT_PUBLIC_HUB_URL into .env.production; unset (local dev) = the hub on localhost
const hub = process.env.NEXT_PUBLIC_HUB_URL;
export const hubUrl = hub && URL.canParse(hub) ? hub : "http://localhost:3000";

// this app's own public URL (deploy.yml); unset = root-relative links, fine on the same site
const site = process.env.NEXT_PUBLIC_SITE_URL;
export const siteUrl = site && URL.canParse(site) ? site.replace(/\/$/, "") : "";

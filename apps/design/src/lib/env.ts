// deploy.yml writes NEXT_PUBLIC_HUB_URL into .env.production; unset (local dev) = the hub on localhost
const hub = process.env.NEXT_PUBLIC_HUB_URL;
export const hubUrl = hub && URL.canParse(hub) ? hub : "http://localhost:3000";

function httpUrl(name: string, value: string | undefined): string {
  if (!value || !URL.canParse(value) || !/^https?:$/.test(new URL(value).protocol)) {
    throw new Error(`${name} must be an http(s) URL`);
  }
  return value;
}

// zod-free on purpose: this module is on the critical path; the full Supabase config is
// validated in ./supabase.ts, which loads after first paint
export const env = {
  /** Core Hub — sign-in and account pages live there. */
  hubUrl: httpUrl("VITE_HUB_URL", import.meta.env.VITE_HUB_URL),
  siteUrl: httpUrl("VITE_SITE_URL", import.meta.env.VITE_SITE_URL),
};

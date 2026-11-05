interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_PUBLISHABLE_KEY?: string;
  readonly VITE_SITE_URL?: string;
  readonly VITE_HUB_URL?: string;
  readonly VITE_COOKIE_DOMAIN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

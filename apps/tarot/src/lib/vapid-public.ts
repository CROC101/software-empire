/**
 * Public half of the VAPID key pair (safe to publish: browsers need it to subscribe). The private
 * half is the Cloudflare secret VAPID_PRIVATE_KEY on crocwork-tarot. To rotate: delete
 * apps/tarot/.dev.vars, run `node apps/tarot/scripts/vapid-keys.mjs`, paste the new public key
 * here and the new private key into Cloudflare; every browser then has to subscribe again.
 */
export const VAPID_PUBLIC_KEY =
  "BLFiiCpUWNUZzGsGX8PKxzeBzVG-WUBxuCy5EY8ihteYGqSKvN5-ZqqI0IWUsf_yHITF1sHWBBVXetf1lLfKLi8";

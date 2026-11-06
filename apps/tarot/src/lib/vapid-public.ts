/**
 * Public half of the VAPID key pair (safe to publish: browsers need it to subscribe). The private
 * half is the Cloudflare secret VAPID_PRIVATE_KEY on crocwork-tarot. To rotate: delete
 * apps/tarot/.dev.vars, run `node apps/tarot/scripts/vapid-keys.mjs`, paste the new public key
 * here and the new private key into Cloudflare; every browser then has to subscribe again.
 */
export const VAPID_PUBLIC_KEY =
  "BBqEx-_oOAvJOA5WGPme35BdlYKJtcsxDK0zUSkb2LAQul7i_ni5YNyH2-e6qv1MbUegD7KVmQL97zkmY3xmx3U";

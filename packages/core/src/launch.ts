/**
 * Before launch every app shows only the hub's countdown; CMS admins (cms.is_admin) see
 * everything. The gate opens by itself at this moment, no deploy needed.
 * 1 มกราคม 2570, midnight Thai time.
 */
export const LAUNCH_AT = Date.parse("2027-01-01T00:00:00+07:00");

export const launched = (now = Date.now()) => now >= LAUNCH_AT;

/** The hub answers this for any app: 204 = let them in, 403 = send them to the countdown. */
export const GATE_PATH = "/api/gate";

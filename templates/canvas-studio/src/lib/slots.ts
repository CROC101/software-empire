/**
 * shortcut: a static export can only serve pre-built pages, so design ids come from a fixed pool of 200
 * pre-rendered /design/<id>/ and /present/<id>/ pages. Upgrade to a real server route if users need more.
 */
export const DESIGN_SLOTS = Array.from({ length: 200 }, (_, i) => `d${String(i + 1).padStart(3, '0')}`);

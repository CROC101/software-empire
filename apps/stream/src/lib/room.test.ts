import { describe, expect, it } from "vitest";
import { follow, roomState } from "./room";

describe("roomState", () => {
  it("accepts what a host sends", () => {
    expect(roomState.safeParse({ id: "dQw4w9WgXcQ", t: 12.5, playing: true }).success).toBe(true);
  });
  it.each([
    { id: "not-an-id", t: 1, playing: true },
    { id: "dQw4w9WgXcQ", t: -1, playing: true },
    { id: "dQw4w9WgXcQ", t: 1, playing: "yes" },
    { id: "dQw4w9WgXcQ" },
  ])("refuses %j", (payload) => {
    expect(roomState.safeParse(payload).success).toBe(false);
  });
});

describe("follow", () => {
  const host = { id: "dQw4w9WgXcQ", t: 60, playing: true };
  it("loads the host's video when the guest has another or none", () => {
    expect(follow(null, host)).toEqual({ load: true });
    expect(follow({ id: "aaaaaaaaaaa", t: 60, playing: true }, host)).toEqual({ load: true });
  });
  it("leaves a close guest alone", () => {
    expect(follow({ id: host.id, t: 61.5, playing: true }, host)).toEqual({
      load: false,
      seek: false,
      toggle: null,
    });
  });
  it("seeks a guest that drifted and matches play / pause", () => {
    expect(follow({ id: host.id, t: 40, playing: false }, host)).toEqual({
      load: false,
      seek: true,
      toggle: "play",
    });
    expect(follow({ id: host.id, t: 60, playing: true }, { ...host, playing: false })).toEqual({
      load: false,
      seek: false,
      toggle: "pause",
    });
  });
});

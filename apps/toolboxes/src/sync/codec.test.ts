// @vitest-environment node
import { describe, expect, it } from "vitest";
import { decode, encode, sha256 } from "./codec";

describe("sync codec", () => {
  it("round-trips what apps keep in IndexedDB", async () => {
    const value = {
      $: "looks like a tag",
      n: [1, -0, Number.NaN, Infinity, null, undefined, true, "ไทย"],
      big: 12345678901234567890n,
      when: new Date(1_700_000_000_000),
      re: /a+b/gi,
      buf: new Uint8Array([0, 1, 254, 255]).buffer,
      f32: new Float32Array([1.5, -2]),
      view: new DataView(new Uint8Array([9, 8, 7]).buffer, 1, 2),
      blob: new Blob(["hello"], { type: "text/plain" }),
      file: new File([new Uint8Array(70_000).fill(7)], "big.bin", { lastModified: 42 }),
      map: new Map<unknown, unknown>([[["k"], new Set([1, 2])]]),
      nested: Object.assign(Object.create(null) as object, { deep: [{ x: 1 }] }),
    };
    const back = decode(await encode(value)) as typeof value;

    expect(back.$).toBe("looks like a tag");
    expect(back.n).toEqual([1, -0, Number.NaN, Infinity, null, undefined, true, "ไทย"]);
    expect(Object.is(back.n[1], -0)).toBe(true);
    expect(back.big).toBe(value.big);
    expect(back.when.getTime()).toBe(value.when.getTime());
    expect(back.re.source + back.re.flags).toBe("a+bgi");
    expect([...new Uint8Array(back.buf)]).toEqual([0, 1, 254, 255]);
    expect(back.f32).toBeInstanceOf(Float32Array);
    expect([...back.f32]).toEqual([1.5, -2]);
    expect([...new Uint8Array(back.view.buffer)]).toEqual([8, 7]);
    expect(back.blob.type).toBe("text/plain");
    expect(await back.blob.text()).toBe("hello");
    expect(back.file).toBeInstanceOf(File);
    expect(back.file.name).toBe("big.bin");
    expect(back.file.lastModified).toBe(42);
    expect(back.file.size).toBe(70_000);
    expect([...back.map]).toEqual([[["k"], new Set([1, 2])]]);
    expect(back.nested).toEqual({ deep: [{ x: 1 }] });
  });

  it("refuses values that cannot leave the browser", async () => {
    class Handle {
      id = 1;
    }
    await expect(encode({ h: new Handle() })).rejects.toThrow(/cannot sync/);
    await expect(encode(() => 1)).rejects.toThrow(/cannot sync/);
  });

  it("hashes the same value to the same id", async () => {
    const a = await sha256(await encode({ a: 1, b: [new Uint8Array([1])] }));
    expect(a).toMatch(/^[0-9a-f]{64}$/);
    expect(await sha256(await encode({ a: 1, b: [new Uint8Array([1])] }))).toBe(a);
  });
});

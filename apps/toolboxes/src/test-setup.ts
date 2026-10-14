import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, beforeEach, expect, vi } from "vitest";

afterEach(cleanup);

// React warns once per component pair, so asserting per test misses repeats —
// trap every console.error/React warning at suite level and fail the test that caused it
let captured: string[] = [];

beforeEach(() => {
  captured = [];
  vi.spyOn(console, "error").mockImplementation((...args: unknown[]) => {
    captured.push(args.map(String).join(" "));
  });
  vi.spyOn(console, "warn").mockImplementation((...args: unknown[]) => {
    const message = args.map(String).join(" ");
    if (/^Warning:|React|act\(\)/i.test(message)) captured.push(message);
  });
});

afterEach(() => {
  expect.soft(captured, "React logged errors or warnings during this test").toEqual([]);
});

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { THEME_COOKIE } from "@empire/core/theme";
import { ThemeToggle } from "./theme-toggle";

/// เทสต์ปุ่มสลับธีม
///
/// สิ่งที่ต้องกันไว้คือ **คลาส `.dark` ต้องถูกใส่ที่ `<html>` จริง ๆ**
/// เพราะ `globals.css` ผูกสีชุดมืดทั้งหมดไว้กับคลาสนั้น ถ้าไม่มีใครใส่
/// สีชุดมืดจะกลายเป็นโค้ดที่ไม่มีวันถูกใช้ — ซึ่งเป็นสภาพก่อนหน้านี้จริง ๆ

function mockMatchMedia(prefersDark: boolean) {
  const listeners = new Set<() => void>();

  vi.stubGlobal(
    "matchMedia",
    vi.fn((query: string) => ({
      matches: query.includes("dark") ? prefersDark : false,
      media: query,
      addEventListener: (_: string, fn: () => void) => listeners.add(fn),
      removeEventListener: (_: string, fn: () => void) => listeners.delete(fn),
    })),
  );

  return listeners;
}

beforeEach(() => {
  document.cookie = `${THEME_COOKIE}=; Max-Age=0; Path=/`;
  document.documentElement.className = "";
  document.documentElement.style.colorScheme = "";
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("ปุ่มสลับธีม", () => {
  it("มีสามตัวเลือกและอ่านออกด้วยเครื่องอ่านหน้าจอ", () => {
    mockMatchMedia(false);
    render(<ThemeToggle />);

    expect(screen.getByRole("radiogroup", { name: "ธีมของหน้าจอ" })).toBeInTheDocument();

    for (const label of ["สว่าง", "ตามระบบ", "มืด"]) {
      expect(screen.getByRole("radio", { name: label })).toBeInTheDocument();
    }
  });

  it('ค่าเริ่มต้นคือ "สว่าง" แบบ Core Hub แม้เครื่องตั้งโหมดมืดไว้', () => {
    mockMatchMedia(true);
    render(<ThemeToggle />);

    expect(screen.getByRole("radio", { name: "สว่าง" })).toBeChecked();
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });

  it('เลือก "มืด" แล้ว <html> ต้องได้คลาส dark จริง', async () => {
    mockMatchMedia(false);
    render(<ThemeToggle />);

    await userEvent.click(screen.getByRole("radio", { name: "มืด" }));

    // ถ้าบรรทัดนี้แดง แปลว่าสีชุดมืดทั้งหมดใน globals.css ใช้ไม่ได้
    expect(document.documentElement.classList.contains("dark")).toBe(true);

    // บอกเบราว์เซอร์ด้วย เพื่อให้แถบเลื่อนและช่องกรอกของระบบเป็นโทนมืดตาม
    expect(document.documentElement.style.colorScheme).toBe("dark");
  });

  it('เลือก "สว่าง" แล้วต้องถอดคลาส dark ออก', async () => {
    mockMatchMedia(true);
    document.documentElement.classList.add("dark");
    render(<ThemeToggle />);

    await userEvent.click(screen.getByRole("radio", { name: "สว่าง" }));

    expect(document.documentElement.classList.contains("dark")).toBe(false);
    expect(document.documentElement.style.colorScheme).toBe("light");
  });

  it('"ตามระบบ" ตามการตั้งค่าของเครื่อง ไม่ใช่ค่าที่ฮาร์ดโค้ดไว้', async () => {
    mockMatchMedia(true);
    render(<ThemeToggle />);

    await userEvent.click(screen.getByRole("radio", { name: "ตามระบบ" }));

    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("จำค่าที่เลือกไว้ และคีย์ต้องตรงกับสคริปต์กันจอกะพริบ", async () => {
    mockMatchMedia(false);
    render(<ThemeToggle />);

    await userEvent.click(screen.getByRole("radio", { name: "มืด" }));

    // cookie กลางของทุกแอปใน hub — theme-boot.js ของทุกแอปอ่านค่านี้ก่อนวาดเฟรมแรก
    expect(document.cookie).toContain(`${THEME_COOKIE}=dark`);
  });

  it("อ่านค่าที่จำไว้ตอนเปิดหน้าใหม่", () => {
    mockMatchMedia(false);
    document.cookie = `${THEME_COOKIE}=dark; Path=/`;

    render(<ThemeToggle />);

    expect(screen.getByRole("radio", { name: "มืด" })).toBeChecked();
  });
});

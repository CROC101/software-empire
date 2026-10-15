import { describe, expect, it } from "vitest";
import { CATEGORIES } from "./categories";
import { findTool, IMAGE_TOOL_SLUGS, searchTools, SPEC_TOOLS, TOOLS, toolsIn } from "./registry";
import type { Values } from "./types";

describe("ทะเบียนเครื่องมือ", () => {
  it("มีเครื่องมืออย่างน้อย 100 ชิ้น และ slug ไม่ซ้ำ เป็น kebab-case", () => {
    expect(TOOLS.length).toBeGreaterThanOrEqual(100);
    expect(new Set(TOOLS.map((t) => t.slug)).size).toBe(TOOLS.length);

    for (const t of TOOLS) expect(t.slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/u);
  });

  it("ทุกหมวดมีเครื่องมือ และเครื่องมือทุกชิ้นอยู่ในหมวดที่มีจริง", () => {
    for (const c of CATEGORIES) expect(toolsIn(c.key).length, c.key).toBeGreaterThan(0);

    const keys = new Set(CATEGORIES.map((c) => c.key));

    for (const t of TOOLS) expect(keys.has(t.category), t.slug).toBe(true);
  });

  it("เครื่องมือรูปภาพของ AIE อยู่ในทะเบียน", () => {
    for (const slug of IMAGE_TOOL_SLUGS) expect(findTool(slug)?.kind).toBe("page");
  });

  it("ช่องกรอกของแต่ละเครื่องมือมี key ไม่ซ้ำ และ select มีตัวเลือก", () => {
    for (const t of SPEC_TOOLS) {
      expect(new Set(t.fields.map((f) => f.key)).size, t.slug).toBe(t.fields.length);

      for (const f of t.fields)
        if (f.kind === "select") expect(f.options?.length, `${t.slug}.${f.key}`).toBeGreaterThan(0);
    }
  });

  // ปุ่มที่กดแล้วไม่ทำอะไร/พังเงียบ ห้ามมี — รันทุกเครื่องมือด้วยค่าเริ่มต้น: ต้องได้ผลลัพธ์ หรือข้อความแจ้งเตือนภาษาไทย
  it.each(SPEC_TOOLS.map((t) => [t.slug, t] as const))(
    "%s รันด้วยค่าเริ่มต้นได้",
    async (_slug, tool) => {
      const values: Values = Object.fromEntries(
        tool.fields.map((f) => [f.key, f.defaultValue ?? (f.kind === "checkbox" ? false : "")]),
      );

      try {
        const output = await tool.run(values);

        expect(output.kind).toBeTruthy();
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toMatch(/[฀-๿]/u);
      }
    },
  );

  it("ค้นด้วยคำไทยและอังกฤษ — ชื่อที่ขึ้นต้นด้วยคำค้นมาก่อน", () => {
    expect(searchTools("json")[0]?.name).toMatch(/JSON/u);
    expect(searchTools("เกรด").map((t) => t.slug)).toContain("gpa-calculator");
    expect(searchTools("qr").map((t) => t.slug)).toContain("qr-code-generator");
    expect(searchTools("ไม่มีคำนี้แน่นอน")).toEqual([]);
  });
});

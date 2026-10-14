import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { findTool } from "@/lib/tools/registry";
import type { SpecTool } from "@/lib/tools/types";
import { SpecToolView } from "./spec-tool";

const spec = (slug: string) => findTool(slug) as SpecTool;

describe("SpecToolView", () => {
  it("เครื่องมือ live คำนวณใหม่ขณะพิมพ์ และแสดงข้อผิดพลาดเป็นภาษาไทย", async () => {
    const user = userEvent.setup();

    render(<SpecToolView tool={spec("json-formatter")} />);

    const input = screen.getByLabelText("JSON");

    await user.click(input);
    await user.paste('{"b":1,"a":[1,2]}');

    await waitFor(() => expect(screen.getByText(/"a": \[/u)).toBeInTheDocument());

    await user.clear(input);
    await user.paste('{"a":');

    expect(await screen.findByRole("alert")).toHaveTextContent("JSON");
  });

  it('เครื่องมือสุ่มสร้างชุดแรกทันที และปุ่ม "สุ่มใหม่" ได้ค่าใหม่', async () => {
    const user = userEvent.setup();

    const { container } = render(<SpecToolView tool={spec("uuid-generator")} />);
    const output = () => container.querySelector("pre")?.textContent ?? "";
    const fiveUuids = /^[0-9a-f-]{36}(\n[0-9a-f-]{36}){4}$/u;

    await waitFor(() => expect(output()).toMatch(fiveUuids));

    const before = output();

    await user.click(await screen.findByRole("button", { name: "สุ่มใหม่" }));

    await waitFor(() => expect(output()).not.toBe(before));
    expect(output()).toMatch(fiveUuids);
  });

  it("ล้างค่ากลับเป็นค่าเริ่มต้น", async () => {
    const user = userEvent.setup();

    render(<SpecToolView tool={spec("percentage-calculator")} />);

    const a = screen.getByLabelText("A");

    await user.clear(a);
    await user.type(a, "50");
    expect(await screen.findByText("100")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "ล้างค่า" }));
    expect(screen.getByLabelText("A")).toHaveValue(15);
  });
});

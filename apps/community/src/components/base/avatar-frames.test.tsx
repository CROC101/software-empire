import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { MyProfile } from "@/lib/backend/types";
import { FramePicker } from "./avatar-frames";

/// เทสต์ตัวเลือกกรอบโปรไฟล์ ("แต่งโปรไฟล์")

const patch = vi.fn();
vi.mock("@/lib/backend/api", () => ({ api: { patch: (...a: unknown[]) => patch(...a) } }));
vi.mock("@/components/base/user-name", () => ({ Avatar: () => <span>avatar</span> }));

const profile = {
  coreUserId: "u1",
  displayName: "Ploy",
  avatarFrame: "classic",
} as unknown as MyProfile;

function wrap() {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <FramePicker profile={profile} />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  patch.mockReset().mockResolvedValue(profile);
});

describe("ตัวเลือกกรอบโปรไฟล์", () => {
  it("มีกรอบให้เลือกครบ 6 แบบ และกรอบปัจจุบันถูกเลือกไว้", () => {
    wrap();
    expect(screen.getAllByRole("radio")).toHaveLength(6);
    expect(screen.getByRole("radio", { name: "คลาสสิก" })).toBeChecked();
  });

  it("กดกรอบใหม่ = บันทึกที่หลังบ้านทันที และตัวอย่างเปลี่ยนตาม", async () => {
    wrap();
    await userEvent.click(screen.getByRole("radio", { name: "ออโรร่า" }));
    expect(patch).toHaveBeenCalledWith("/profiles/me", { avatarFrame: "aurora" });
    expect(screen.getByRole("radio", { name: "ออโรร่า" })).toBeChecked();
  });

  it("กดกรอบเดิมซ้ำ ไม่ยิงคำขอซ้ำ", async () => {
    wrap();
    await userEvent.click(screen.getByRole("radio", { name: "คลาสสิก" }));
    expect(patch).not.toHaveBeenCalled();
  });

  it("บันทึกไม่สำเร็จ ตัวอย่างกลับเป็นกรอบเดิม", async () => {
    patch.mockRejectedValue(new Error("boom"));
    wrap();
    await userEvent.click(screen.getByRole("radio", { name: "โมโน" }));
    expect(await screen.findByText("บันทึกไม่สำเร็จ ลองใหม่อีกครั้ง")).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "คลาสสิก" })).toBeChecked();
  });
});

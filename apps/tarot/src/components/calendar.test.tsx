import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { bangkokDay } from "@/lib/reading";

const today = bangkokDay();
vi.mock("@/lib/api", () => ({
  getCheckins: vi.fn(() => Promise.resolve([{ day: today, coins: 30 }])),
}));
// motion's entrance animation needs no real frames in jsdom
Element.prototype.scrollIntoView = vi.fn();

const { CheckInCalendar } = await import("./calendar");

describe("CheckInCalendar", () => {
  it("shows the month's days as a strip, marks today's coins, and switches to a grid", async () => {
    render(<CheckInCalendar refresh={0} />);
    const [y = 0, m = 1] = today.split("-").map(Number);
    const days = new Date(Date.UTC(y, m, 0)).getUTCDate();

    await waitFor(() => expect(screen.getByText("+30")).toBeInTheDocument());
    expect(screen.getAllByRole("button", { pressed: false }).length + 1).toBe(days);
    expect(screen.getByRole("button", { pressed: true })).toHaveAccessibleName(
      /เช็กอินแล้ว 30 เหรียญ/,
    );

    await userEvent.click(screen.getByRole("tab", { name: "รายเดือน" }));
    expect(screen.getByRole("tab", { name: "รายเดือน" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getAllByRole("button", { pressed: false }).length + 1).toBe(days);
  });

  it("cannot move past the current month", () => {
    render(<CheckInCalendar refresh={0} />);
    expect(screen.getByRole("button", { name: "เดือนถัดไป" })).toBeDisabled();
  });
});

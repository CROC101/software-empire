import { createBrowserRouter, Link } from "react-router";
import { HistoryPage } from "@/components/history-page";
import { DailyPage, MePage } from "@/components/pages";
import { ReadPage } from "@/components/read-page";
import { Shell } from "@/components/shell";

const title = (name: string) => <title>{`${name} · crocwork tarot`}</title>;

export const router = createBrowserRouter([
  {
    element: <Shell />,
    children: [
      {
        path: "/",
        element: (
          <>
            {title("ไพ่ประจำวัน")}
            <DailyPage />
          </>
        ),
      },
      {
        path: "/read",
        element: (
          <>
            {title("อ่านไพ่")}
            <ReadPage />
          </>
        ),
      },
      {
        path: "/history",
        element: (
          <>
            {title("ประวัติ")}
            <HistoryPage />
          </>
        ),
      },
      {
        path: "/me",
        element: (
          <>
            {title("โปรไฟล์")}
            <MePage />
          </>
        ),
      },
      {
        path: "*",
        element: (
          <div className="mx-auto max-w-md px-4 py-16 text-center">
            {title("ไม่พบหน้า")}
            <h1 className="text-2xl font-black text-[var(--em-ink-0)]">ไม่พบหน้านี้</h1>
            <Link to="/" className="mt-4 inline-block text-[var(--em-blue-300)] underline">
              กลับไปที่ไพ่ประจำวัน
            </Link>
          </div>
        ),
      },
    ],
  },
]);

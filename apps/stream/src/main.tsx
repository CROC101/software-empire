import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router/dom";
import { DataProvider } from "@/lib/data";
import { SessionProvider } from "@/lib/session";
import { router } from "./routes";
import "./styles.css";

const root = document.getElementById("root");
if (!root) throw new Error("index.html is missing #root");

createRoot(root).render(
  <StrictMode>
    <SessionProvider>
      <DataProvider>
        <RouterProvider router={router} />
      </DataProvider>
    </SessionProvider>
  </StrictMode>,
);

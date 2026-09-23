"use client";

import type { ReactNode } from "react";
import Sidebar from "./Sidebar";

export default function DefaultLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-blue-50">
      <Sidebar />
      <main className="min-w-0 flex-1 overflow-hidden">{children}</main>
    </div>
  );
}

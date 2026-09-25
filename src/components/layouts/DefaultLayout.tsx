"use client";

import type { ReactNode } from "react";
import Sidebar from "./Sidebar";
import SessionGuard from "@/components/features/auth/SessionGuard";

export default function DefaultLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <SessionGuard />
      <div
        id="authenticated-content"
        className="flex h-screen overflow-hidden bg-blue-50"
      >
        <Sidebar />
        <main className="min-w-0 flex-1 overflow-hidden">{children}</main>
      </div>
    </>
  );
}

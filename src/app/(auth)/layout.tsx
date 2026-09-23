import type { ReactNode } from "react";
import Banner from "@/components/layouts/Banner";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <main className="relative min-h-screen">
      <Banner>{children}</Banner>
    </main>
  );
}

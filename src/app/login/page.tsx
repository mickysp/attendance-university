"use client";

import { useState } from "react";
import Banner from "@/components/layouts/Banner";
import LoginForm from "@/components/features/auth/LoginForm";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);

  return (
    <main className="relative min-h-screen">
      {loading && (
        <div
          className="
            fixed
            inset-0
            z-[9999]
            flex
            items-center
            justify-center
            bg-gray-500/40
            backdrop-blur-sm
          "
        >
          <div className="flex flex-col items-center gap-4">
            <div
              className="
                h-14
                w-14
                animate-spin
                rounded-full
                border-4
                border-white
                border-t-transparent
              "
            />

            <p className="text-base font-medium text-white">กำลังโหลด...</p>
          </div>
        </div>
      )}

      <Banner>
        <LoginForm onLoading={() => setLoading(true)} />
      </Banner>
    </main>
  );
}

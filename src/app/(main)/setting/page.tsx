"use client";

import { useEffect, useState } from "react";
import AppearanceSection from "@/components/setting/AppearanceSection";
import ProfileSection from "@/components/setting/ProfileSection";
import Footer from "@/components/layouts/Footer";
import { authApi } from "@/services/api/auth";
import type { UserProfile } from "@/types/auth";

export default function SettingPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();

    async function loadProfile() {
      try {
        const response = await authApi.getProfile({ signal: controller.signal });
        const data = await response.json();
        if (!response.ok || !data?.success || !data.data) {
          throw new Error(data?.message || "โหลดข้อมูลการตั้งค่าไม่สำเร็จ");
        }
        if (active) setProfile(data.data);
      } catch (cause) {
        if (active) {
          setError(cause instanceof Error ? cause.message : "โหลดข้อมูลการตั้งค่าไม่สำเร็จ");
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadProfile();
    return () => {
      active = false;
      controller.abort();
    };
  }, [attempt]);

  function retry() {
    setError("");
    setLoading(true);
    setAttempt((current) => current + 1);
  }

  return (
    <div className="flex h-screen overflow-hidden bg-blue-50 font-noto">
      <main aria-busy={loading} aria-label="ตั้งค่า" className="relative min-w-0 flex-1 overflow-y-auto p-4 pt-[80px] sm:p-6 sm:pt-[80px] lg:pt-6">
        {loading ? (
          <div role="status" className="absolute inset-0 z-10 flex items-center justify-center bg-gray-300">
            <div className="flex flex-col items-center gap-4">
              <div aria-hidden="true" className="h-14 w-14 animate-spin rounded-full border-4 border-white border-t-transparent motion-reduce:animate-none" />
              <p className="text-base text-white">กำลังโหลด...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex min-h-full flex-col items-center justify-center gap-4 text-center">
            <p role="alert" className="text-sm text-red-600">{error}</p>
            <button type="button" onClick={retry} className="cursor-pointer rounded-lg bg-[var(--primary)] px-5 py-2.5 text-sm text-white hover:bg-[var(--primary-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2">
              ลองอีกครั้ง
            </button>
          </div>
        ) : profile && (
          <div className="flex min-h-full flex-col gap-5 sm:gap-6">
            <header className="rounded-2xl border border-gray-200 bg-white px-5 py-4 sm:px-6 sm:py-5">
              <h1 className="text-[26px] font-semibold text-gray-800">ตั้งค่า</h1>
              <p className="mt-1 text-sm text-gray-500">จัดการข้อมูลส่วนตัวและรูปแบบการแสดงผล</p>
            </header>
            <ProfileSection initialProfile={profile} />
            <AppearanceSection />
            <div className="mt-auto">
              <Footer />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

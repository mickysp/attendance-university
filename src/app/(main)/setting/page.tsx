"use client";

import { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import ProfileSection from "@/components/setting/ProfileSection";
import { CheckIcon, ComputerDesktopIcon, MoonIcon, SunIcon } from "@heroicons/react/24/outline";

const themeOptions = [
  { value: "light", label: "สว่าง", icon: SunIcon },
  { value: "dark", label: "มืด", icon: MoonIcon },
  { value: "system", label: "ตามอุปกรณ์", icon: ComputerDesktopIcon },
] as const;

const subscribe = () => () => {};

export default function SettingPage() {
  const { theme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(subscribe, () => true, () => false);

  return (
    <div className="flex h-screen overflow-hidden bg-blue-50 font-noto">
      <main className="min-w-0 flex-1 overflow-y-auto p-4 pt-[80px] sm:p-6 sm:pt-[80px] lg:pt-6">
        <div className="min-h-full rounded-2xl bg-white p-5 sm:p-6">
          <div className="max-w-3xl">
            <h1 className="text-[26px] font-semibold text-gray-800">ตั้งค่า</h1>
            <p className="mt-1 text-sm text-gray-500">จัดการข้อมูลส่วนตัวและรูปแบบการแสดงผล</p>

            <ProfileSection />

            <section className="mt-8 border-t border-gray-100 pt-7" aria-labelledby="appearance-heading">
              <div className="mb-4">
                <h2 id="appearance-heading" className="text-lg font-semibold text-gray-800">การแสดงผล</h2>
                <p className="mt-1 text-sm text-gray-500">เลือกธีมที่ต้องการใช้บนอุปกรณ์นี้</p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3" role="group" aria-label="เลือกธีม">
                {themeOptions.map((option) => {
                  const Icon = option.icon;
                  const selected = mounted && theme === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      aria-pressed={selected}
                      disabled={!mounted}
                      onClick={() => setTheme(option.value)}
                      className={`flex min-h-16 cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 disabled:cursor-wait ${selected ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-200 bg-white text-gray-700 hover:border-blue-300 hover:bg-gray-50"}`}
                    >
                      <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                      <span className="flex-1 text-sm font-medium">{option.label}</span>
                      {selected && <CheckIcon className="h-5 w-5 shrink-0" aria-hidden="true" />}
                    </button>
                  );
                })}
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}

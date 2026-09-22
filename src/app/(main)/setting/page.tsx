"use client";

import { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import {
  CheckIcon,
  ComputerDesktopIcon,
  MoonIcon,
  SunIcon,
} from "@heroicons/react/24/outline";

const themeOptions = [
  { value: "light", label: "โหมดสว่าง", description: "พื้นหลังสว่าง อ่านง่ายในที่มีแสง", icon: SunIcon },
  { value: "dark", label: "โหมดมืด", description: "ลดความสว่างเมื่อใช้งานในที่มืด", icon: MoonIcon },
  { value: "system", label: "ตามอุปกรณ์", description: "เปลี่ยนตามการตั้งค่าของอุปกรณ์", icon: ComputerDesktopIcon },
] as const;

const subscribe = () => () => {};

export default function SettingPage() {
  const { theme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(subscribe, () => true, () => false);

  return (
    <div className="flex h-screen overflow-hidden bg-blue-50 font-noto">
      <main className="min-w-0 flex-1 overflow-y-auto p-4 pt-[80px] sm:p-6 sm:pt-[80px] lg:pt-6">
        <div className="rounded-2xl bg-white p-5 sm:p-6">
          <h1 className="text-[26px] font-semibold text-gray-800">Setting</h1>
          <p className="mt-1 text-sm text-gray-500">ปรับรูปแบบการแสดงผลของระบบตามที่คุณต้องการ</p>

          <section className="mt-8 max-w-3xl" aria-labelledby="appearance-heading">
            <div className="mb-4">
              <h2 id="appearance-heading" className="text-lg font-semibold text-gray-800">การแสดงผล</h2>
              <p className="mt-1 text-sm text-gray-500">เลือกธีมที่เหมาะกับการใช้งานของคุณ การตั้งค่านี้จะจดจำไว้ในอุปกรณ์นี้</p>
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
                    className={`relative flex min-h-36 cursor-pointer flex-col rounded-xl border p-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 disabled:cursor-wait ${selected ? "border-blue-500 bg-blue-50" : "border-gray-200 bg-white hover:border-blue-300 hover:bg-gray-50"}`}
                  >
                    <span className={`mb-4 flex h-10 w-10 items-center justify-center rounded-lg ${selected ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-600"}`}>
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <span className="font-medium text-gray-800">{option.label}</span>
                    <span className="mt-1 text-xs leading-5 text-gray-500">{option.description}</span>
                    {selected && <CheckIcon className="absolute right-4 top-4 h-5 w-5 text-blue-600" aria-hidden="true" />}
                  </button>
                );
              })}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

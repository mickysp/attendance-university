"use client";

import { useState } from "react";
import { BellIcon } from "@heroicons/react/24/outline";
import { notificationsApi } from "@/services/api/notifications";
import type {
  NotificationCategory,
  NotificationPreferences,
} from "@/types/notifications";

const options: { key: NotificationCategory; label: string; description: string }[] = [
  { key: "accounts", label: "บัญชีผู้ใช้", description: "การเพิ่ม ลบ หรือเปลี่ยนสิทธิ์ผู้ดูแลระบบ" },
  { key: "classes", label: "ชั้นเรียน", description: "การสร้าง แก้ไข หรือลบชั้นเรียน" },
  { key: "students", label: "นักศึกษา", description: "การเพิ่ม แก้ไข หรือนำเข้าข้อมูลนักศึกษา" },
  { key: "attendance", label: "การเช็กชื่อ", description: "การแก้ไขข้อมูลการเข้าเรียนที่สำคัญ" },
];

export default function NotificationSettingsSection({ initialSettings }: { initialSettings: NotificationPreferences }) {
  const [settings, setSettings] = useState(initialSettings);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function update(next: NotificationPreferences) {
    const previous = settings;
    setSettings(next);
    setSaving(true);
    setMessage("");
    try {
      const response = await notificationsApi.updateSettings(next);
      if (!response.ok) throw new Error();
      setMessage("บันทึกแล้ว");
    } catch {
      setSettings(previous);
      setMessage("บันทึกไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white" aria-labelledby="notification-settings-heading">
      <div className="flex items-start gap-3 border-b border-gray-100 px-5 py-5 sm:px-6">
        <span className="mt-0.5 rounded-lg bg-blue-50 p-2 text-blue-600"><BellIcon className="h-5 w-5" /></span>
        <div className="min-w-0 flex-1">
          <h2 id="notification-settings-heading" className="text-lg font-semibold text-gray-800">การแจ้งเตือน</h2>
          <p className="mt-1 text-sm text-gray-500">เลือกกิจกรรมที่ต้องการติดตามในระบบ</p>
        </div>
        <span aria-live="polite" className={`mt-1 text-xs ${message === "บันทึกไม่สำเร็จ" ? "text-red-600" : "text-gray-400"}`}>{saving ? "กำลังบันทึก..." : message}</span>
      </div>

      <div className="divide-y divide-gray-100 px-5 sm:px-6">
        {options.map((option) => (
          <SettingToggle key={option.key} label={option.label} description={option.description} checked={settings[option.key]} disabled={saving} onChange={() => void update({ ...settings, [option.key]: !settings[option.key] })} />
        ))}
        <SettingToggle label="แสดงเฉพาะกิจกรรมของผู้อื่น" description="ซ่อนกิจกรรมที่คุณเป็นผู้ดำเนินการเอง" checked={settings.othersOnly} disabled={saving} onChange={() => void update({ ...settings, othersOnly: !settings.othersOnly })} />
      </div>
    </section>
  );
}

function SettingToggle({ label, description, checked, disabled, onChange }: { label: string; description: string; checked: boolean; disabled: boolean; onChange: () => void }) {
  return (
    <div className="flex items-center justify-between gap-5 py-4">
      <div><p className="text-sm font-medium text-gray-800">{label}</p><p className="mt-0.5 text-xs leading-5 text-gray-500">{description}</p></div>
      <button type="button" role="switch" aria-checked={checked} aria-label={label} disabled={disabled} onClick={onChange} className={`relative h-6 w-11 shrink-0 cursor-pointer rounded-full transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-60 ${checked ? "bg-blue-600" : "bg-gray-300"}`}>
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition ${checked ? "left-[22px]" : "left-0.5"}`} />
      </button>
    </div>
  );
}

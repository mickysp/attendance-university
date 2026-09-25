"use client";

import { useCallback, useSyncExternalStore } from "react";
import { translateText } from "./i18n/translate";

export type Language = "th" | "en";
const storageKey = "classora-language";
const changeEvent = "classora-language-change";
let currentLanguage: Language = "th";

const messages = {
  th: {
    language: "ภาษา",
    changeLanguage: "เปลี่ยนภาษา",
    menu: "เมนู",
    management: "การจัดการ",
    dashboard: "แดชบอร์ด",
    classes: "ชั้นเรียน",
    students: "นักศึกษา",
    teachers: "อาจารย์",
    attendance: "เวลาเข้าเรียน",
    checkInSettings: "ตั้งค่าแบบฟอร์มเช็คชื่อ",
    administrators: "ผู้ดูแลระบบ",
    settings: "ตั้งค่า",
    notifications: "การแจ้งเตือน",
    loading: "กำลังโหลด...",
    unnamed: "ไม่ระบุชื่อ",
    noRole: "ไม่ระบุ Role",
    logout: "ออกจากระบบ",
    loggingOut: "กำลังออกจากระบบ...",
    profileImage: "รูปโปรไฟล์",
    openMenu: "เปิดเมนู",
    closeMenu: "ปิดเมนู",
    toggleSidebar: "ย่อหรือขยายเมนู",
  },
  en: {
    language: "Language",
    changeLanguage: "Change language",
    menu: "Menu",
    management: "Management",
    dashboard: "Dashboard",
    classes: "Classes",
    students: "Students",
    teachers: "Teachers",
    attendance: "Attendance",
    checkInSettings: "Check-in form settings",
    administrators: "Administrators",
    settings: "Settings",
    notifications: "Notifications",
    loading: "Loading...",
    unnamed: "Unnamed user",
    noRole: "No role",
    logout: "Sign out",
    loggingOut: "Signing out...",
    profileImage: "Profile photo",
    openMenu: "Open menu",
    closeMenu: "Close menu",
    toggleSidebar: "Toggle sidebar",
  },
};

function getSnapshot(): Language {
  if (typeof window === "undefined") return "th";
  try {
    const stored = window.localStorage.getItem(storageKey);
    if (stored === "th" || stored === "en") currentLanguage = stored;
  } catch {
    // Keep language switching available when browser storage is disabled.
  }
  return currentLanguage;
}

export function translate(text: string | null | undefined, parameters?: Record<string, string | number>) {
  return translateText(text, getSnapshot(), parameters);
}

export function getLocale() {
  return getSnapshot() === "en" ? "en-GB" : "th-TH";
}

function subscribe(callback: () => void) {
  const onStorage = (event: StorageEvent) => {
    if (event.key === storageKey || event.key === null) {
      currentLanguage = event.newValue === "en" ? "en" : "th";
      callback();
    }
  };
  window.addEventListener(changeEvent, callback);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(changeEvent, callback);
    window.removeEventListener("storage", onStorage);
  };
}

export function useLanguage() {
  const language = useSyncExternalStore(
    subscribe,
    getSnapshot,
    () => "th" as Language,
  );
  const setLanguage = (next: Language) => {
    currentLanguage = next;
    try {
      window.localStorage.setItem(storageKey, next);
    } catch {}
    window.dispatchEvent(new Event(changeEvent));
  };
  const tr = useCallback((text: string | null | undefined, parameters?: Record<string, string | number>) => translateText(text, language, parameters), [language]);
  return { language, setLanguage, t: messages[language], tr, locale: language === "en" ? "en-GB" : "th-TH" };
}

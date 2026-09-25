"use client";

import { useLanguage } from "@/lib/language";

export default function LanguageSwitcher({
  compact = false,
}: {
  compact?: boolean;
}) {
  const { language, setLanguage, t } = useLanguage();

  if (compact) {
    const nextLanguage = language === "th" ? "en" : "th";
    const label =
      nextLanguage === "en" ? "Switch to English" : "เปลี่ยนเป็นภาษาไทย";
    return (
      <button
        type="button"
        aria-label={label}
        title={label}
        onClick={() => setLanguage(nextLanguage)}
        className="flex h-10 w-full min-w-9 cursor-pointer items-center justify-center rounded-lg text-xs font-semibold text-gray-600 transition hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
      >
        {language === "th" ? "TH" : "EN"}
      </button>
    );
  }

  return (
    <div
      role="group"
      aria-label={t.changeLanguage}
      lang={language}
      className="inline-flex shrink-0 items-center gap-0.5 rounded-lg bg-gray-100 p-1"
    >
      {(
        [
          { value: "th", label: "ไทย", name: "ภาษาไทย" },
          { value: "en", label: "EN", name: "English" },
        ] as const
      ).map((option) => (
        <button
          key={option.value}
          type="button"
          lang={option.value}
          aria-label={option.name}
          aria-pressed={language === option.value}
          onClick={() => setLanguage(option.value)}
          className={`min-h-8 min-w-11 cursor-pointer rounded-md px-2.5 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 ${language === option.value ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-800"}`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

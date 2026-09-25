"use client";
import { useLanguage } from "@/lib/language";


import { MagnifyingGlassIcon, XMarkIcon } from "@heroicons/react/24/outline";

interface TeacherSelectProps {
  keyword: string;
  onKeywordChange: (value: string) => void;
  placeholder?: string;
}

export default function TeacherSelect({
  keyword,
  onKeywordChange,
  placeholder = "ค้นหาชื่ออาจารย์",
}: TeacherSelectProps) {
  const { tr } = useLanguage();

  return (
    <div className="flex w-full max-w-md flex-wrap items-center gap-3">
      <div className="relative w-full min-w-0 sm:flex-1">
        <MagnifyingGlassIcon className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          aria-label={tr("ค้นหาอาจารย์")}
          value={keyword}
          onChange={(event) => onKeywordChange(event.target.value)}
          placeholder={tr(placeholder)}
          className="w-full rounded-md border border-gray-200 py-[9px] pl-9 pr-9 text-[14px] text-gray-700 outline-none focus:ring-1 focus:ring-gray-200"
        />

        {keyword && (
          <button
            type="button"
            aria-label={tr("ล้างคำค้นหา")}
            onClick={() => onKeywordChange("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-blue-500"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        )}
      </div>
      <button
        type="button"
        onClick={() => onKeywordChange("")}
        className="cursor-pointer whitespace-nowrap text-[13px] text-blue-500 hover:underline"
      >{tr("ล้างค่า")}</button>
    </div>
  );
}

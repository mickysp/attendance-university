"use client";

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
  return (
    <div className="flex w-full flex-col gap-3 md:max-w-md md:flex-row md:items-center">
      <div className="relative w-full">
        <MagnifyingGlassIcon className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          aria-label="ค้นหาอาจารย์"
          value={keyword}
          onChange={(event) => onKeywordChange(event.target.value)}
          placeholder={placeholder}
          className="w-full rounded-md border border-gray-200 py-[9px] pl-9 pr-9 text-[14px] text-gray-700 outline-none focus:ring-1 focus:ring-gray-200"
        />

        {keyword && (
          <button
            type="button"
            aria-label="ล้างคำค้นหา"
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
        className="cursor-pointer self-center whitespace-nowrap text-[13px] text-blue-500 hover:underline md:self-auto"
      >
        ล้างค่า
      </button>
    </div>
  );
}

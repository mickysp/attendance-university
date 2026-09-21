"use client";

import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";

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
    <div className="relative max-w-md">
      <MagnifyingGlassIcon className="pointer-events-none absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-gray-400" />
      <input
        aria-label="ค้นหาอาจารย์"
        value={keyword}
        onChange={(event) => onKeywordChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-md border border-gray-200 py-2.5 pr-3 pl-10 text-sm outline-none focus:border-blue-400"
      />
    </div>
  );
}

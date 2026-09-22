"use client";

import { useState } from "react";
import { MagnifyingGlassIcon, XMarkIcon } from "@heroicons/react/24/outline";

type Props = {
  data?: unknown[];
  onChange: (value: { keyword: string; branch: string }) => void;
};

export default function ClassFilter({ onChange }: Props) {
  const [keyword, setKeyword] = useState("");

  const update = (value: string) => {
    setKeyword(value);
    onChange({ keyword: value, branch: "" });
  };

  return (
    <div className="flex w-full max-w-md flex-wrap items-center gap-3">
      <div className="relative w-full min-w-0 sm:flex-1">
        <MagnifyingGlassIcon className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          aria-label="ค้นหารายวิชา"
          placeholder="ค้นหาได้จากรายวิชา และรหัสวิชา"
          value={keyword}
          onChange={(event) => update(event.target.value)}
          className="w-full rounded-md border border-gray-200 py-[9px] pl-9 pr-9 text-[14px] text-gray-700 outline-none focus:ring-1 focus:ring-gray-200"
        />
        {keyword && <button type="button" aria-label="ล้างคำค้นหา" onClick={() => update("")} className="absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer text-blue-500"><XMarkIcon className="h-5 w-5" /></button>}
      </div>
      <button type="button" onClick={() => update("")} className="cursor-pointer whitespace-nowrap text-[13px] text-blue-500 hover:underline">ล้างค่า</button>
    </div>
  );
}

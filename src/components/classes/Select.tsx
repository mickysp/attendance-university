"use client";

import { useState } from "react";
import { MagnifyingGlassIcon, XMarkIcon } from "@heroicons/react/24/outline";

type ClassItem = {
  _id: string;
  className: string;
  classCode?: string;
};

type Props = {
  data: ClassItem[];
  onChange: (value: { keyword: string; branch: string }) => void;
};

export default function ClassFilter({ onChange }: Props) {
  const [keyword, setKeyword] = useState("");

  const handleChange = (value: string) => {
    onChange({
      keyword: value,
      branch: "",
    });
  };

  const handleClear = () => {
    setKeyword("");
    handleChange("");
  };

  return (
    <div className="flex w-full flex-col gap-3">
      <div className="hidden items-center gap-3 md:flex">
        <div className="relative w-[380px]">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

          <input
            type="text"
            placeholder="ค้นหาได้จากรายวิชา และรหัสวิชา"
            value={keyword}
            onChange={(e) => {
              const value = e.target.value;

              setKeyword(value);
              handleChange(value);
            }}
            className="
              w-full
              rounded-md
              border
              border-gray-200
              py-[9px]
              pl-9
              pr-9
              text-[14px]
              text-gray-700
              outline-none
              focus:ring-1
              focus:ring-gray-200
            "
          />

          {keyword && (
            <button
              type="button"
              onClick={handleClear}
              className="
                absolute
                right-3
                top-1/2
                -translate-y-1/2
                cursor-pointer
                text-gray-400
                hover:text-gray-600
              "
            >
              <XMarkIcon className="h-5 w-5 text-blue-500" />
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={handleClear}
          className="
            cursor-pointer
            whitespace-nowrap
            text-[13px]
            text-blue-500
            hover:underline
          "
        >
          ล้างค่า
        </button>
      </div>

      <div className="flex w-full flex-col items-center gap-3 md:hidden">
        <div className="relative w-full">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

          <input
            type="text"
            placeholder="ค้นหาได้จากรายวิชา และรหัสวิชา"
            value={keyword}
            onChange={(e) => {
              const value = e.target.value;

              setKeyword(value);
              handleChange(value);
            }}
            className="
              w-full
              rounded-md
              border
              border-gray-200
              py-[9px]
              pl-9
              pr-9
              text-[14px]
              text-gray-700
              outline-none
              focus:ring-1
              focus:ring-gray-200
            "
          />

          {keyword && (
            <button
              type="button"
              onClick={handleClear}
              className="
                absolute
                right-3
                top-1/2
                -translate-y-1/2
                cursor-pointer
              "
            >
              <XMarkIcon className="h-5 w-5 text-blue-500" />
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={handleClear}
          className="
            cursor-pointer
            whitespace-nowrap
            text-[13px]
            text-blue-500
            hover:underline
          "
        >
          ล้างค่า
        </button>
      </div>
    </div>
  );
}

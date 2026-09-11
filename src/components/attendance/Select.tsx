"use client";

import { useState, useRef, useEffect } from "react";
import {
  ChevronDownIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

type Subject = {
  id: string;
  name: string;
};

type Props = {
  subjects: Subject[];
  value: string | null;
  onChange: (id: string | null) => void;

  keyword?: string;
  onKeywordChange?: (value: string) => void;

  showSearch?: boolean;

  showClear?: boolean;
  onClearAll?: () => void;

  placeholder?: string;
};

export default function SubjectSelect({
  subjects,
  value,
  onChange,
  keyword = "",
  onKeywordChange,
  showSearch = false,
  showClear = false,
  onClearAll,
  placeholder = "เลือกวิชา",
}: Props) {
  const [open, setOpen] = useState(false);

  const ref = useRef<HTMLDivElement | null>(null);

  const selected = subjects.find((s) => s.id === value);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
      {showSearch && (
        <div className="relative w-full flex-shrink-0 sm:w-[380px]">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

          <input
            type="text"
            placeholder="ค้นหาชื่อ หรือรหัสนักศึกษา"
            value={keyword}
            onChange={(e) => onKeywordChange?.(e.target.value)}
            className="
              w-full
              rounded-md
              border
              border-gray-200
              bg-white
              py-[10px]
              pl-9
              pr-9
              text-sm
              focus:border-blue-300
              focus:outline-none
              focus:ring-1
              focus:ring-blue-200
            "
          />

          {keyword && (
            <button
              type="button"
              onClick={() => onKeywordChange?.("")}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <XMarkIcon className="h-4 w-4 cursor-pointer text-gray-400 hover:text-blue-500" />
            </button>
          )}
        </div>
      )}

      <div className="relative w-full flex-shrink-0 sm:w-[260px]" ref={ref}>
        <div
          className="
            flex
            w-full
            cursor-pointer
            items-center
            justify-between
            overflow-hidden
            rounded-md
            border
            border-gray-200
            bg-white
            px-3
            py-[10px]
            text-sm
            transition
            hover:bg-gray-50
          "
          onClick={() => setOpen(!open)}
        >
          <span
            className={`block flex-1 truncate ${
              selected ? "text-gray-800" : "text-gray-400"
            }`}
          >
            {selected ? selected.name : placeholder}
          </span>

          <ChevronDownIcon
            className={`h-4 w-4 flex-shrink-0 text-blue-500 transition ${
              open ? "rotate-180" : ""
            }`}
          />
        </div>

        {open && (
          <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-md border border-gray-200 bg-white shadow-lg">
            <div className="max-h-60 overflow-y-auto">
              {subjects.length === 0 ? (
                <div className="px-4 py-3 text-sm text-gray-400">
                  ไม่พบข้อมูล
                </div>
              ) : (
                subjects.map((sub) => {
                  const isSelected = sub.id === value;

                  return (
                    <button
                      key={sub.id}
                      type="button"
                      onClick={() => {
                        onChange(sub.id);
                        setOpen(false);
                      }}
                      className={`w-full cursor-pointer px-4 py-2.5 text-left text-sm transition ${
                        isSelected
                          ? "bg-blue-50 font-medium text-blue-600"
                          : "text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      {sub.name}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {showClear && (
        <button
          type="button"
          onClick={() => {
            if (onClearAll) {
              onClearAll();
            } else {
              onChange(null);
            }
          }}
          className="
            flex-shrink-0
            cursor-pointer
            self-start
            whitespace-nowrap
            text-sm
            text-blue-500
            hover:underline
            sm:self-auto
          "
        >
          ล้างค่า
        </button>
      )}
    </div>
  );
}

"use client";
import { useLanguage } from "@/lib/language";


import { useEffect, useId, useRef, useState } from "react";
import {
  ChevronDownIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import type { ClassResponse } from "@/types/classes";

type FilterValue = { keyword: string; teacherId: string };

type Props = {
  data: ClassResponse[];
  value: FilterValue;
  onChange: (value: FilterValue) => void;
};

export default function ClassFilter({ data, value, onChange }: Props) {
  const { tr } = useLanguage();

  const { keyword, teacherId } = value;
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownId = useId();
  const teachers = Array.from(
    new Map(
      data
        .flatMap((item) => item.teachers)
        .map((teacher) => [teacher._id, teacher]),
    ).values(),
  ).sort((left, right) => left.name.localeCompare(right.name, "th"));

  useEffect(() => {
    const closeOutside = (event: MouseEvent) => {
      if (!dropdownRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", closeOutside);
    return () => document.removeEventListener("mousedown", closeOutside);
  }, []);

  const update = (value: string) => {
    onChange({ keyword: value, teacherId });
  };

  return (
    <div className="flex w-full max-w-[760px] flex-wrap items-center gap-3">
      <div className="relative w-full min-w-0 sm:flex-[2_1_260px]">
        <MagnifyingGlassIcon className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          aria-label={tr("ค้นหารายวิชา")}
          placeholder={tr("ค้นหาได้จากรายวิชา และรหัสวิชา")}
          value={keyword}
          onChange={(event) => update(event.target.value)}
          className="w-full rounded-md border border-gray-200 py-[9px] pl-9 pr-9 text-[14px] text-gray-700 outline-none focus:ring-1 focus:ring-gray-200"
        />
        {keyword && (
          <button
            type="button"
            aria-label={tr("ล้างคำค้นหา")}
            onClick={() => update("")}
            className="absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer text-blue-500"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        )}
      </div>
      <div
        ref={dropdownRef}
        className="relative w-full min-w-0 sm:flex-[1_1_200px]"
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget))
            setOpen(false);
        }}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            setOpen(false);
            triggerRef.current?.focus();
          }
        }}
      >
        <button
          ref={triggerRef}
          type="button"
          aria-label={tr("กรองตามอาจารย์")}
          aria-expanded={open}
          aria-controls={dropdownId}
          onClick={() => setOpen(!open)}
          className="flex w-full cursor-pointer items-center justify-between gap-2 rounded-md border border-gray-200 bg-white px-3 py-[9px] text-sm outline-none focus:ring-1 focus:ring-gray-200"
        >
          <span
            className={`truncate ${teacherId ? "text-gray-800" : "text-gray-400"}`}
          >
            {teacherId
              ? teachers.find((teacher) => teacher._id === teacherId)?.name ||
                tr("อาจารย์ที่เลือก")
              : tr("ทั้งหมด")}
          </span>
          <ChevronDownIcon className="h-4 w-4 shrink-0 text-gray-400" />
        </button>
        
        {open && (
          <div
            id={dropdownId}
            className="absolute z-30 mt-1 max-h-60 w-full overflow-y-auto rounded-md border border-gray-200 bg-white shadow-lg"
          >
            {[{ _id: "", name: "ทั้งหมด" }, ...teachers].map(
              (teacher) => (
                <button
                  key={teacher._id}
                  type="button"
                  aria-pressed={teacherId === teacher._id}
                  onClick={() => {
                    onChange({ keyword, teacherId: teacher._id });
                    setOpen(false);
                    triggerRef.current?.focus();
                  }}
                  className={`flex w-full cursor-pointer items-center justify-between gap-2 px-4 py-2 text-left text-sm ${teacherId === teacher._id ? "bg-blue-50 font-medium text-blue-600" : "text-gray-700 hover:bg-gray-100"}`}
                >
                  <span>{teacher.name}</span>
                </button>
              ),
            )}
          </div>
        )}
      </div>
      <button
        type="button"
        onClick={() => {
          onChange({ keyword: "", teacherId: "" });
          setOpen(false);
        }}
        className="cursor-pointer whitespace-nowrap text-[13px] text-blue-500 hover:underline"
      >{tr("ล้างค่า")}</button>
    </div>
  );
}

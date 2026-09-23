"use client";

import { useEffect, useRef, useState } from "react";
import {
  ChevronDownIcon,
  CheckIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

interface Props {
  keyword: string;
  role: string;
  onKeywordChange: (value: string) => void;
  onRoleChange: (value: string) => void;
}

export default function AdministratorSelect({
  keyword,
  role,
  onKeywordChange,
  onRoleChange,
}: Props) {
  const [openRole, setOpenRole] = useState(false);
  const roleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (roleRef.current && !roleRef.current.contains(event.target as Node))
        setOpenRole(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpenRole(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", escape);
    };
  }, []);

  const roles = [
    { value: "all", label: "ทั้งหมด" },
    { value: "Teacher", label: "Teacher" },
    { value: "Teaching Assistant", label: "Teaching Assistant" },
  ];

  return (
    <div className="flex w-full flex-col gap-3 md:flex-row md:items-center">
      <div className="relative w-full md:w-[380px] md:shrink-0">
        <MagnifyingGlassIcon className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          aria-label="ค้นหาผู้ใช้"
          value={keyword}
          onChange={(event) => onKeywordChange(event.target.value)}
          placeholder="ค้นหาชื่อ ชื่อผู้ใช้ หรืออีเมล"
          className="w-full rounded-md border border-gray-200 py-[9px] pl-9 pr-9 text-[14px] text-gray-700 outline-none focus:ring-1 focus:ring-gray-200"
        />
        {keyword && (
          <button
            type="button"
            aria-label="ล้างคำค้นหา"
            onClick={() => onKeywordChange("")}
            className="absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer text-blue-500"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        )}
      </div>

      <div ref={roleRef} className="relative w-full md:w-[200px] md:shrink-0">
        <button
          type="button"
          aria-label="กรองสิทธิ์"
          aria-expanded={openRole}
          onClick={() => setOpenRole(!openRole)}
          className="form-input-card flex min-h-[42px] cursor-pointer items-center justify-between gap-2 text-left text-sm text-gray-700"
        >
          <span className="truncate">
            {roles.find((item) => item.value === role)?.label}
          </span>
          <ChevronDownIcon className="h-4 w-4 shrink-0 text-gray-400" />
        </button>

        {openRole && (
          <div className="absolute top-full left-0 z-30 mt-1 w-full overflow-hidden rounded-md border border-gray-200 bg-white shadow-lg">
            {roles.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => {
                  onRoleChange(item.value);
                  setOpenRole(false);
                }}
                className={`flex w-full cursor-pointer items-center justify-between px-4 py-2 text-left text-sm ${role === item.value ? "bg-blue-50 font-medium text-blue-600" : "text-gray-700 hover:bg-gray-100"}`}
              >
                {item.label}
                {role === item.value && <CheckIcon className="h-4 w-4" />}
              </button>
            ))}
          </div>
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

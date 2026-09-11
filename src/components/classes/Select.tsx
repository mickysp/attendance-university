"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import {
  ChevronDownIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

type Branch = {
  _id: string;
  name: string;
};

type ClassItem = {
  _id: string;
  className: string;
  classCode?: string;
  branches?: Branch[];
};

type Props = {
  data: ClassItem[];
  onChange: (value: { keyword: string; branch: string }) => void;
};

export default function ClassFilter({ data, onChange }: Props) {
  const [keyword, setKeyword] = useState("");
  const [branch, setBranch] = useState("");
  const [open, setOpen] = useState(false);

  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const branchOptions = useMemo(() => {
    const all = data.flatMap((c) => (c.branches || []).map((b) => b.name));

    return [...new Set(all)];
  }, [data]);

  const handleChange = (k: string, b: string) => {
    onChange({
      keyword: k,
      branch: b,
    });
  };

  return (
    <div className="flex w-full flex-col gap-3">
      {/* ================= DESKTOP / IPAD ================= */}
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
              handleChange(value, branch);
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
              onClick={() => {
                setKeyword("");
                handleChange("", branch);
              }}
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

        <div ref={ref} className="relative w-[280px]">
          <button
            type="button"
            onClick={() => setOpen(!open)}
            className="
              flex
              w-full
              cursor-pointer
              items-center
              justify-between
              rounded-md
              border
              border-gray-200
              bg-white
              px-3
              py-[9px]
              text-[14px]
              outline-none
              focus:ring-1
              focus:ring-gray-200
            "
          >
            <span className={branch ? "text-gray-800" : "text-gray-400"}>
              {branch || "เลือกสาขา"}
            </span>

            <ChevronDownIcon className="h-4 w-4 text-blue-500" />
          </button>

          {open && (
            <div
              className="
                absolute
                z-20
                mt-1
                max-h-48
                w-full
                overflow-y-auto
                rounded-md
                border
                border-gray-200
                bg-white
                shadow
              "
            >
              <button
                type="button"
                onClick={() => {
                  setBranch("");
                  handleChange(keyword, "");
                  setOpen(false);
                }}
                className="
                  block
                  w-full
                  cursor-pointer
                  px-3
                  py-2
                  text-left
                  text-sm
                  hover:bg-gray-100
                "
              >
                ทั้งหมด
              </button>

              {branchOptions.map((b) => {
                const isSelected = branch === b;

                return (
                  <button
                    type="button"
                    key={b}
                    onClick={() => {
                      setBranch(b);
                      handleChange(keyword, b);
                      setOpen(false);
                    }}
                    className={`
                      flex
                      w-full
                      cursor-pointer
                      items-center
                      justify-between
                      px-3
                      py-2
                      text-left
                      text-sm
                      ${
                        isSelected
                          ? "bg-blue-50 font-medium text-blue-600"
                          : "hover:bg-gray-100"
                      }
                    `}
                  >
                    <span>{b}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => {
            setKeyword("");
            setBranch("");
            handleChange("", "");
          }}
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

      {/* ================= MOBILE ================= */}
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
              handleChange(value, branch);
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
              onClick={() => {
                setKeyword("");
                handleChange("", branch);
              }}
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

        <div ref={ref} className="relative w-full">
          <button
            type="button"
            onClick={() => setOpen(!open)}
            className="
              flex
              w-full
              cursor-pointer
              items-center
              justify-between
              rounded-md
              border
              border-gray-200
              bg-white
              px-3
              py-[9px]
              text-[14px]
              outline-none
              focus:ring-1
              focus:ring-gray-200
            "
          >
            <span className={branch ? "text-gray-800" : "text-gray-400"}>
              {branch || "เลือกสาขา"}
            </span>

            <ChevronDownIcon className="h-4 w-4 text-blue-500" />
          </button>

          {open && (
            <div
              className="
                absolute
                z-20
                mt-1
                max-h-48
                w-full
                overflow-y-auto
                rounded-md
                border
                border-gray-200
                bg-white
                shadow
              "
            >
              <button
                type="button"
                onClick={() => {
                  setBranch("");
                  handleChange(keyword, "");
                  setOpen(false);
                }}
                className="
                  block
                  w-full
                  cursor-pointer
                  px-3
                  py-2
                  text-left
                  text-sm
                  hover:bg-gray-100
                "
              >
                ทั้งหมด
              </button>

              {branchOptions.map((b) => {
                const isSelected = branch === b;

                return (
                  <button
                    type="button"
                    key={b}
                    onClick={() => {
                      setBranch(b);
                      handleChange(keyword, b);
                      setOpen(false);
                    }}
                    className={`
                      flex
                      w-full
                      cursor-pointer
                      items-center
                      justify-between
                      px-3
                      py-2
                      text-left
                      text-sm
                      ${
                        isSelected
                          ? "bg-blue-50 font-medium text-blue-600"
                          : "hover:bg-gray-100"
                      }
                    `}
                  >
                    <span>{b}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => {
            setKeyword("");
            setBranch("");
            handleChange("", "");
          }}
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

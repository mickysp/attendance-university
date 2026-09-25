"use client";
import { useLanguage } from "@/lib/language";


import { useState, useRef, useEffect } from "react";
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
  branches?: Branch[];
};

type Props = {
  data: ClassItem[];
  selectedClassId: string;
  selectedBranch: string;
  keyword: string;
  onChange: (value: {
    keyword: string;
    classId: string;
    branch: string;
    section: string;
  }) => void;
};

export default function StudentFilter({
  data,
  selectedClassId,
  selectedBranch,
  keyword,
  onChange,
}: Props) {
  const { tr } = useLanguage();

  const section = "";

  const [openClass, setOpenClass] = useState(false);
  const [openBranch, setOpenBranch] = useState(false);

  const classRef = useRef<HTMLDivElement>(null);
  const branchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (classRef.current && !classRef.current.contains(e.target as Node))
        setOpenClass(false);
      if (branchRef.current && !branchRef.current.contains(e.target as Node))
        setOpenBranch(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const classOptions = data;
  const branchOptions = [
    ...new Set(
      (selectedClassId
        ? data.find((course) => course._id === selectedClassId)?.branches || []
        : data.flatMap((course) => course.branches || [])
      ).map((item) => item.name),
    ),
  ];
  const branchLocked = Boolean(selectedClassId) && branchOptions.length <= 1;

  const handleChange = (k: string, c: string, b: string, s: string) => {
    onChange({ keyword: k, classId: c, branch: b, section: s });
  };

  const truncate = (text: string, max = 18) => {
    if (!text) return "";
    return text.length > max ? text.slice(0, max) + "..." : text;
  };

  return (
    <div className="relative z-30 flex w-full max-w-[760px] flex-wrap items-center gap-3">
      <div className="relative w-full min-w-0 sm:flex-[2_1_260px]">
        <MagnifyingGlassIcon className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />

        <input
          type="text"
          placeholder={tr("ค้นหาจากชื่อ หรือรหัสนักศึกษา")}
          value={keyword}
          onChange={(e) => {
            handleChange(
              e.target.value,
              selectedClassId,
              selectedBranch,
              section,
            );
          }}
          className="w-full pl-9 pr-9 py-[9px] text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-200"
        />

        {keyword && (
          <button
            onClick={() => {
              handleChange("", selectedClassId, selectedBranch, section);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
          >
            <XMarkIcon className="w-5 h-5 text-blue-500" />
          </button>
        )}
      </div>

      <div
        ref={classRef}
        className="relative w-full min-w-0 sm:flex-[1_1_200px]"
      >
        <button
          onClick={() => setOpenClass(!openClass)}
          className="w-full px-3 py-[9px] text-sm border border-gray-200 rounded-md bg-white flex items-center justify-between focus:outline-none focus:ring-1 focus:ring-gray-200 cursor-pointer"
        >
          <span
            className={`truncate block max-w-[200px] ${
              selectedClassId ? "text-gray-800" : "text-gray-400"
            }`}
          >
            {selectedClassId
              ? truncate(
                  data.find((item) => item._id === selectedClassId)
                    ?.className || "",
                )
              : tr("ทุกวิชา")}
          </span>
          <ChevronDownIcon className="w-4 h-4 text-blue-500" />
        </button>

        {openClass && (
          <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-md shadow max-h-48 overflow-y-auto">
            <button
              onClick={() => {
                handleChange(keyword, "", "", section);
                setOpenClass(false);
                setOpenBranch(false);
              }}
              className="block w-full px-3 py-2 text-left text-sm hover:bg-gray-100 cursor-pointer"
            >{tr("ทั้งหมด")}</button>

            {classOptions.map((c) => {
              const isSelected = selectedClassId === c._id;

              return (
                <button
                  key={c._id}
                  onClick={() => {
                    handleChange(keyword, c._id, "", section);
                    setOpenClass(false);
                    setOpenBranch(false);
                  }}
                  className={`block w-full px-3 py-2 text-left text-sm flex items-center justify-between
                  ${
                    isSelected
                      ? "bg-blue-50 text-blue-600 font-medium"
                      : "hover:bg-gray-100"
                  } cursor-pointer`}
                >
                  <span>{c.className}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div
        ref={branchRef}
        className="relative w-full min-w-0 sm:flex-[1_1_200px]"
      >
        <button
          type="button"
          disabled={branchLocked}
          onClick={() => setOpenBranch(!openBranch)}
          className="w-full px-3 py-[9px] text-sm border border-gray-200 rounded-md bg-white flex items-center justify-between focus:outline-none focus:ring-1 focus:ring-gray-200 cursor-pointer disabled:cursor-default"
        >
          <span
            className={`truncate block max-w-[200px] ${
              selectedBranch ? "text-gray-800" : "text-gray-400"
            }`}
          >
            {selectedBranch
              ? truncate(selectedBranch)
              : branchLocked
                ? tr("ยังไม่มีสาขา")
                : tr("ทุกสาขา")}
          </span>
          {!branchLocked && (
            <ChevronDownIcon className="w-4 h-4 text-blue-500" />
          )}
        </button>

        {openBranch && (
          <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-md shadow max-h-48 overflow-y-auto">
            <button
              onClick={() => {
                handleChange(keyword, selectedClassId, "", section);
                setOpenBranch(false);
              }}
              className="block w-full px-3 py-2 text-left text-sm hover:bg-gray-100 cursor-pointer"
            >{tr("ทุกสาขา")}</button>

            {branchOptions.map((b) => {
              const isSelected = selectedBranch === b;

              return (
                <button
                  key={b}
                  onClick={() => {
                    handleChange(keyword, selectedClassId, b, section);
                    setOpenBranch(false);
                  }}
                  className={`block w-full px-3 py-2 text-left text-sm flex items-center justify-between
                  ${
                    isSelected
                      ? "bg-blue-50 text-blue-600 font-medium"
                      : "hover:bg-gray-100"
                  } cursor-pointer`}
                >
                  <span>{b}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <button
        onClick={() => {
          handleChange("", "", "", "");
        }}
        className="self-center whitespace-nowrap text-sm text-blue-500 hover:underline cursor-pointer"
      >{tr("ล้างค่า")}</button>
    </div>
  );
}

"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDownIcon } from "@heroicons/react/24/outline";

type StudentAttendance = {
  id: string;
  name: string;
  present: number;
  absent: number;
  percent: number;
  score: number;
};

type Props = {
  data: StudentAttendance[];
};

export default function AttendanceTable({ data }: Props) {
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const totalPages = Math.ceil(data.length / itemsPerPage);

  const paginatedData = data.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage,
  );

  const pageSizeRef = useRef<HTMLDivElement>(null);
  const [openPageSize, setOpenPageSize] = useState(false);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        pageSizeRef.current &&
        !pageSizeRef.current.contains(e.target as Node)
      ) {
        setOpenPageSize(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getStatus = (percent: number, score: number) => {
    if (percent < 60 || score < 50) return "danger";
    if (percent < 80 || score < 70) return "warning";
    return "good";
  };

  const statusMap = {
    good: {
      text: "ปกติ",
      class: "bg-green-50 text-green-600 border-green-200",
    },
    warning: {
      text: "เฝ้าระวัง",
      class: "bg-yellow-50 text-yellow-600 border-yellow-200",
    },
    danger: {
      text: "เสี่ยง",
      class: "bg-red-50 text-red-600 border-red-200",
    },
  };

  const getScoreColor = (score: number) => {
    if (score < 50) return "text-red-500";
    if (score < 70) return "text-yellow-600";
    return "text-blue-600";
  };

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <div className="mb-4 flex items-center justify-center w-28 h-28 rounded-full bg-gray-100">
          <img src="/not-exist.png" className="w-28 h-28" />
        </div>
        <p className="text-sm text-gray-400">
          ไม่พบข้อมูลที่ค้นหา กรุณาลองใหม่อีกครั้ง
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="rounded-xl border border-gray-200 overflow-hidden max-h-[510px] flex flex-col">
        <div className="overflow-x-auto overflow-y-visible">
          <table className="w-full text-base table-fixed">
            <thead className="bg-gray-50 text-gray-600 sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3 text-left font-semibold w-[150px]">
                  รหัสนักศึกษา
                </th>
                <th className="px-4 py-3 text-left font-semibold w-[150px]">
                  ชื่อ-นามสกุล
                </th>
                <th className="px-4 py-3 text-center font-semibold w-[150px]">
                  ขาด
                </th>
                <th className="px-4 py-3 text-center font-semibold w-[200px]">
                  เข้าเรียน
                </th>
                <th className="px-4 py-3 text-center font-semibold w-[150px]">
                  คะแนน
                </th>
                <th className="px-4 py-3 text-center font-semibold w-[150px]">
                  สถานะ
                </th>
              </tr>
            </thead>

            <tbody>
              {paginatedData.map((s) => {
                const status = getStatus(s.percent, s.score);

                return (
                  <tr
                    key={s.id}
                    className="border-t border-gray-200 hover:bg-gray-50"
                  >
                    <td className="px-4 py-2 text-sm truncate">{s.name}</td>

                    <td className="px-4 py-2 text-sm text-center">
                      {s.present}
                    </td>

                    <td className="px-4 py-2 text-sm text-center text-red-500">
                      {s.absent}
                    </td>

                    <td className="px-4 py-2 text-sm"></td>

                    <td
                      className={`px-4 py-2 text-sm text-center font-medium ${getScoreColor(
                        s.score,
                      )}`}
                    >
                      {s.score}
                    </td>

                    <td className="px-4 py-2 text-sm text-center"></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {data.length > 0 && (
        <div className="flex items-center justify-between mt-4 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <span>แสดง</span>

            <div ref={pageSizeRef} className="relative">
              <button
                onClick={() => setOpenPageSize(!openPageSize)}
                className="form-input-card flex items-center justify-between gap-2 px-3 py-1 text-xs min-w-[60px] cursor-pointer"
              >
                {itemsPerPage}
                <ChevronDownIcon className="w-3 h-3 text-gray-400" />
              </button>

              {openPageSize && (
                <div className="absolute z-10 mt-1 w-full rounded-md bg-white shadow-lg border border-gray-200">
                  {[10, 15, 20].map((size) => (
                    <button
                      key={size}
                      onClick={() => {
                        setItemsPerPage(size);
                        setPage(1);
                        setOpenPageSize(false);
                      }}
                      className="block w-full px-3 py-2 text-left text-sm hover:bg-gray-100 cursor-pointer"
                    >
                      {size}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <span>จากทั้งหมด {data.length} รายการ</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={page === 1}
              className="px-3 py-2 text-[13px] rounded-md border border-gray-200 hover:bg-gray-100 disabled:opacity-40 cursor-pointer"
            >
              ก่อนหน้า
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .slice(Math.max(0, page - 2), page + 1)
              .map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`px-3.5 py-2 rounded-md border text-[13px] ${
                    page === p
                      ? "bg-[var(--primary)] text-white border-[var(--primary)]"
                      : "border-gray-200 hover:bg-gray-100"
                  }`}
                >
                  {p}
                </button>
              ))}

            <button
              onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
              disabled={page === totalPages}
              className="px-4 py-2 text-[13px] rounded-md border border-gray-200 hover:bg-gray-100 disabled:opacity-40"
            >
              ถัดไป
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

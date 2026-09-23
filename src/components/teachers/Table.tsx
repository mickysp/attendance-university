"use client";

import { useEffect, useRef, useState } from "react";
import {
  ChevronDownIcon,
  PencilSquareIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import EmptyStateIcon from "@/components/common/EmptyStateIcon";
import type { Teacher } from "@/types/teachers";

interface TeacherTableProps {
  teachers: Teacher[];
  deletingId: string | null;
  loading: boolean;
  error: string;
  filterKey: string;
  onDeleteTeacher: (teacher: Teacher) => void;
  onEditTeacher: (teacher: Teacher) => void;
  onRetry: () => void;
}

export default function TeacherTable({
  teachers,
  deletingId,
  loading,
  error,
  filterKey,
  onDeleteTeacher,
  onEditTeacher,
  onRetry,
}: TeacherTableProps) {
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [openPageSize, setOpenPageSize] = useState(false);
  const [requestedPage, setPage] = useState(1);
  const [previousFilter, setPreviousFilter] = useState(filterKey);
  const pageSizeRef = useRef<HTMLDivElement>(null);
  const totalPages = Math.max(1, Math.ceil(teachers.length / itemsPerPage));
  const page = Math.min(requestedPage, totalPages);
  if (previousFilter !== filterKey) {
    setPreviousFilter(filterKey);
    setPage(1);
  } else if (requestedPage !== page) {
    setPage(page);
  }
  const start = (page - 1) * itemsPerPage;
  const pageTeachers = teachers.slice(start, start + itemsPerPage);

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (
        pageSizeRef.current &&
        !pageSizeRef.current.contains(event.target as Node)
      )
        setOpenPageSize(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpenPageSize(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", escape);
    };
  }, []);

  const getVisiblePages = () => {
    const start = Math.max(1, Math.min(page - 1, totalPages - 2));
    return Array.from(
      { length: Math.min(3, totalPages) },
      (_, index) => start + index,
    );
  };

  if (loading)
    return (
      <div role="status" className="py-16 text-center text-sm text-gray-500">
        กำลังโหลดรายชื่ออาจารย์...
      </div>
    );
  if (error)
    return (
      <div
        role="alert"
        className="rounded-xl border border-red-100 bg-red-50 p-6 text-center text-sm text-red-600"
      >
        <p>{error}</p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-3 cursor-pointer underline"
        >
          ลองอีกครั้ง
        </button>
      </div>
    );
  if (!teachers.length)
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center px-4 text-center">
        <EmptyStateIcon kind={filterKey.trim() ? "search" : "teachers"} />
        <p className="whitespace-nowrap text-sm text-gray-500">
          {filterKey.trim()
            ? "ไม่พบข้อมูลที่ค้นหา กรุณาลองใหม่อีกครั้ง"
            : "ยังไม่มีข้อมูลอาจารย์ในระบบ"}
        </p>
      </div>
    );

  return (
    <div className="w-full min-w-0">
      <div className="space-y-3 md:hidden">
        {pageTeachers.map((teacher) => (
          <div key={teacher._id} className="rounded-xl border border-gray-200 bg-white p-4">
            <div className="flex items-start justify-between gap-4">
              <span className="shrink-0 text-sm text-gray-500">ชื่อ-นามสกุล</span>
              <span className="min-w-0 max-w-[65%] break-words text-right text-sm text-gray-700">{teacher.name}</span>
            </div>
            <div className="my-4 border-t border-gray-100" />
            <div className="flex items-center justify-between gap-2">
              <span className="shrink-0 text-sm text-gray-500">จัดการ</span>
              <div className="@container/actions flex min-w-0 flex-1 justify-end gap-2 [&>button]:min-h-11 [&>button]:min-w-11 [&>button]:shrink-0">
                <button
                  type="button"
                  aria-label={`แก้ไขอาจารย์ ${teacher.name}`}
                  title="แก้ไขอาจารย์"
                  disabled={deletingId !== null}
                  onClick={() => onEditTeacher(teacher)}
                  className="flex cursor-pointer items-center justify-center gap-1 rounded-md border border-gray-200 px-2.5 py-1.5 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                >
                  <PencilSquareIcon className="h-4 w-4 shrink-0" />
                  <span className="hidden @[260px]/actions:inline">แก้ไข</span>
                </button>
                <button
                  type="button"
                  aria-label={`ลบอาจารย์ ${teacher.name}`}
                  title="ลบอาจารย์"
                  disabled={deletingId !== null}
                  onClick={() => onDeleteTeacher(teacher)}
                  className="flex cursor-pointer items-center justify-center gap-1 rounded-md border border-red-200 px-2.5 py-1.5 text-sm text-red-500 hover:bg-red-50 disabled:opacity-50"
                >
                  <TrashIcon className="h-4 w-4 shrink-0" />
                  <span className="hidden @[260px]/actions:inline">ลบ</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="hidden overflow-hidden rounded-xl border border-gray-200 md:block">
        <div className="max-h-[510px] overflow-auto">
        <table className="app-data-table w-full table-fixed text-sm">
          <thead className="text-gray-600">
            <tr>
              <th className="sticky top-0 z-10 bg-gray-50 px-3 py-3 text-left font-semibold">
                ชื่อ-นามสกุล
              </th>
              <th className="sticky top-0 z-10 w-[120px] bg-gray-50 px-3 py-3 text-left font-semibold sm:w-[190px]">
                จัดการ
              </th>
            </tr>
          </thead>
          <tbody>
            {pageTeachers.map((teacher) => (
              <tr
                key={teacher._id}
                className="border-t border-gray-200 hover:bg-gray-50"
              >
                <td className="break-words px-3 py-3 text-gray-700">
                  {teacher.name}
                </td>
                <td className="px-3 py-3">
                  <div className="flex flex-nowrap items-center gap-2 whitespace-nowrap">
                    <button
                      type="button"
                      aria-label={`แก้ไขอาจารย์ ${teacher.name}`}
                      title="แก้ไขอาจารย์"
                      disabled={deletingId !== null}
                      onClick={() => onEditTeacher(teacher)}
                      className="flex min-h-11 min-w-11 shrink-0 cursor-pointer items-center justify-center gap-1 rounded-md border border-gray-200 px-2.5 py-1.5 text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                    >
                      <PencilSquareIcon className="h-4 w-4 shrink-0" />
                      <span className="hidden sm:inline">แก้ไข</span>
                    </button>
                    <button
                      type="button"
                      aria-label={`ลบอาจารย์ ${teacher.name}`}
                      title="ลบอาจารย์"
                      disabled={deletingId !== null}
                      onClick={() => onDeleteTeacher(teacher)}
                      className="flex min-h-11 min-w-11 shrink-0 cursor-pointer items-center justify-center gap-1 rounded-md border border-red-200 px-2.5 py-1.5 text-red-500 hover:bg-red-50 disabled:opacity-50"
                    >
                      <TrashIcon className="h-4 w-4 shrink-0" />
                      <span className="hidden sm:inline">ลบ</span>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>
      {teachers.length > 10 && (
        <div className="mt-4 flex flex-col gap-3 text-sm text-gray-600 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-sm">
            <span>แสดง</span>

            <div ref={pageSizeRef} className="relative">
              <button
                type="button"
                onClick={() => setOpenPageSize(!openPageSize)}
                aria-label="จำนวนรายการต่อหน้า"
                aria-expanded={openPageSize}
                className="form-input-card flex min-w-[60px] cursor-pointer items-center justify-between gap-2 px-3 py-1 text-sm"
              >
                <span>{itemsPerPage}</span>

                <ChevronDownIcon className="h-3.5 w-3.5 text-gray-400" />
              </button>

              {openPageSize && (
                <div className="absolute bottom-full left-0 z-20 mb-1 w-full overflow-hidden rounded-md border border-gray-200 bg-white shadow-lg">
                  {[10, 15, 20].map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => {
                        setItemsPerPage(size);
                        setPage(1);
                        setOpenPageSize(false);
                      }}
                      className={`block w-full cursor-pointer px-3 py-2 text-left text-sm hover:bg-gray-100 ${
                        itemsPerPage === size
                          ? "bg-blue-50 font-medium text-blue-600"
                          : ""
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <span>จากทั้งหมด {teachers.length} รายการ</span>
          </div>

          <div className="flex items-center justify-center gap-1.5">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={page === 1}
              className="cursor-pointer rounded-md border border-gray-200 px-3 py-2 text-sm hover:bg-gray-100 disabled:opacity-40"
            >
              ก่อนหน้า
            </button>

            {getVisiblePages().map((p) => (
              <button
                type="button"
                key={p}
                onClick={() => setPage(p)}
                aria-current={page === p ? "page" : undefined}
                className={`cursor-pointer rounded-md border px-3 py-2 text-sm ${
                  page === p
                    ? "border-[var(--primary)] bg-[var(--primary)] text-white"
                    : "border-gray-200 hover:bg-gray-100"
                }`}
              >
                {p}
              </button>
            ))}

            <button
              type="button"
              onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
              disabled={page === totalPages}
              className="cursor-pointer rounded-md border border-gray-200 px-3 py-2 text-sm hover:bg-gray-100 disabled:opacity-40"
            >
              ถัดไป
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

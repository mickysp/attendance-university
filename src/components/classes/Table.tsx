"use client";

import { useRouter } from "next/navigation";
import { useAlert } from "@/context/AlertContext";
import {
  PencilSquareIcon,
  TrashIcon,
  ChevronDownIcon,
  ClipboardDocumentCheckIcon,
} from "@heroicons/react/24/outline";
import { useState, useRef, useEffect } from "react";
import { useConfirm } from "@/context/swal";

import type { ClassResponse } from "@/types/classes";

export default function Table({
  data,
  onDeleteSuccess,
}: {
  data: ClassResponse[];
  onDeleteSuccess: (id: string) => void;
}) {
  const router = useRouter();

  const { showAlert } = useAlert();
  const { showConfirm } = useConfirm();

  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [openPageSize, setOpenPageSize] = useState(false);
  const [page, setPage] = useState(1);

  const pageSizeRef = useRef<HTMLDivElement>(null);

  const totalPages = Math.max(1, Math.ceil(data.length / itemsPerPage));

  const paginatedData = data.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage,
  );

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  useEffect(() => {
    setPage(1);
  }, [data]);

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

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const getVisiblePages = () => {
    const pages: number[] = [];

    let start = Math.max(1, page - 1);
    let end = Math.min(totalPages, page + 1);

    if (page === 1) {
      end = Math.min(3, totalPages);
    }

    if (page === totalPages) {
      start = Math.max(1, totalPages - 2);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return pages;
  };

  const handleEdit = (id: string) => {
    router.push(`/classes/update/${id}`);
  };

  const handleDelete = (id: string) => {
    showConfirm(
      "ลบข้อมูลรายวิชา?",
      async () => {
        try {
          const res = await fetch(`/api/classes/delete?id=${id}`, {
            method: "DELETE",
          });

          const result = await res.json();

          if (!res.ok) {
            throw new Error(result.message || "ไม่สามารถลบรายวิชาได้");
          }

          showAlert(result.message || "ลบรายวิชาสำเร็จ", "success");

          onDeleteSuccess(id);
        } catch (error: unknown) {
          const message =
            error instanceof Error ? error.message : "เกิดข้อผิดพลาด";

          showAlert(message, "error");
        }
      },
      "delete",
      "คุณต้องการลบข้อมูลใช่หรือไม่",
    );
  };

  const handleCheckIn = (id: string) => {
    router.push(`/classes/form?classId=${id}`);
  };

  const renderClassCodes = (classCodes: string[]) => {
    if (!classCodes?.length) {
      return "-";
    }

    return (
      <div className="flex flex-wrap items-center gap-1">
        {classCodes.map((code, index) => (
          <span
            key={`${code}-${index}`}
            className="rounded-full border border-gray-200 bg-gray-100 px-2.5 py-1 text-sm text-gray-600"
          >
            {code || "-"}
          </span>
        ))}
      </div>
    );
  };

  const renderTeachers = (teachers: ClassResponse["teachers"]) => {
    if (!teachers?.length) {
      return "-";
    }

    return (
      <div className="flex flex-col gap-1">
        {teachers.map((teacher) => (
          <span key={teacher._id} className="break-words text-sm text-gray-700">
            {teacher.name || "-"}
          </span>
        ))}
      </div>
    );
  };

  const renderStatus = (isOpened: boolean) => {
    if (isOpened) {
      return (
        <span className="inline-flex items-center rounded-full border border-green-200 bg-green-50 px-2.5 py-1 text-xs font-medium text-green-600">
          เปิดใช้งานแล้ว
        </span>
      );
    }

    return (
      <span className="inline-flex items-center rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-500">
        ยังไม่เปิดใช้งาน
      </span>
    );
  };

  if (data.length === 0) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center px-4 text-center">
        <div className="mb-4 flex h-28 w-28 items-center justify-center rounded-full bg-gray-100">
          <img
            src="/not_exist_search.svg"
            alt="ไม่พบข้อมูล"
            className="h-28 w-28"
          />
        </div>

        <p className="text-sm text-gray-400">
          ไม่พบข้อมูลที่ค้นหา
          <br />
          กรุณาลองใหม่อีกครั้ง
        </p>
      </div>
    );
  }

  return (
    <div className="w-full min-w-0">
      {/* ==================== MOBILE ==================== */}
      <div className="block space-y-3 md:hidden">
        {paginatedData.map((item) => (
          <div
            key={item._id}
            className="w-full rounded-xl border border-gray-200 bg-white p-4"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-4">
                <span className="shrink-0 text-sm text-gray-500">
                  รหัสวิชา / Section
                </span>

                <div className="min-w-0 max-w-[65%] text-right text-sm">
                  {renderClassCodes(item.classCodes)}
                </div>
              </div>

              <div className="flex items-start justify-between gap-4">
                <span className="shrink-0 text-sm text-gray-500">ชื่อวิชา</span>

                <div className="min-w-0 max-w-[65%] text-right text-sm text-gray-700">
                  <div className="break-words">{item.className || "-"}</div>
                </div>
              </div>

              <div className="flex items-start justify-between gap-4">
                <span className="shrink-0 text-sm text-gray-500">
                  อาจารย์ผู้สอน
                </span>

                <div className="min-w-0 max-w-[65%] text-right text-sm">
                  {renderTeachers(item.teachers)}
                </div>
              </div>

              <div className="flex items-start justify-between gap-4">
                <span className="shrink-0 text-sm text-gray-500">สถานะ</span>

                <div className="text-right">{renderStatus(item.isOpened)}</div>
              </div>
            </div>

            <div className="my-4 border-t border-gray-100" />

            <div className="flex items-center justify-between gap-2">
              <span className="shrink-0 text-sm text-gray-500">จัดการ</span>

              <div className="@container/actions flex min-w-0 flex-1 flex-nowrap justify-end gap-2 whitespace-nowrap [&>button]:min-h-11 [&>button]:min-w-11 [&>button]:shrink-0 [&>button]:justify-center">
                <button
                  type="button"
                  aria-label="เช็คชื่อ"
                  title="เช็คชื่อ"
                  onClick={() => handleCheckIn(item._id)}
                  className="flex cursor-pointer items-center gap-1 rounded-md border border-blue-200 px-2.5 py-1.5 text-sm text-blue-600 hover:bg-blue-50"
                >
                  <ClipboardDocumentCheckIcon className="h-4 w-4 shrink-0" />

                  <span className="hidden @[260px]/actions:inline">เช็คชื่อ</span>
                </button>

                <button
                  type="button"
                  aria-label="แก้ไข"
                  title="แก้ไข"
                  onClick={() => handleEdit(item._id)}
                  className="flex cursor-pointer items-center gap-1 rounded-md border border-gray-200 px-2.5 py-1.5 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <PencilSquareIcon className="h-4 w-4 shrink-0" />

                  <span className="hidden @[260px]/actions:inline">แก้ไข</span>
                </button>

                <button
                  type="button"
                  aria-label="ลบ"
                  title="ลบ"
                  onClick={() => handleDelete(item._id)}
                  className="flex cursor-pointer items-center gap-1 rounded-md border border-red-200 px-2.5 py-1.5 text-sm text-red-500 hover:bg-red-50"
                >
                  <TrashIcon className="h-4 w-4 shrink-0" />

                  <span className="hidden @[260px]/actions:inline">ลบ</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ==================== DESKTOP ==================== */}
      <div className="hidden w-full overflow-hidden rounded-xl border border-gray-200 md:block">
        <div className="w-full overflow-x-auto">
          <table className="app-data-table min-w-[900px] w-full table-fixed text-sm">
            <colgroup>
              <col className="w-[calc((100%-280px)*0.25)]" />
              <col className="w-[calc((100%-280px)*0.3125)]" />
              <col className="w-[calc((100%-280px)*0.25)]" />
              <col className="w-[calc((100%-280px)*0.1875)]" />
              <col className="w-[280px]" />
            </colgroup>

            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="px-3 py-3 text-left font-semibold">
                  รหัสวิชา / Section
                </th>

                <th className="px-3 py-3 text-left font-semibold">ชื่อวิชา</th>

                <th className="px-3 py-3 text-left font-semibold">
                  อาจารย์ผู้สอน
                </th>

                <th className="px-3 py-3 text-left font-semibold">สถานะ</th>

                <th
                  className="
                    sticky right-0 z-20
                    bg-gray-50
                    px-3 py-3
                    text-left
                    font-semibold
                    shadow-[-4px_0_8px_rgba(0,0,0,0.06)]
                  "
                >
                  จัดการ
                </th>
              </tr>
            </thead>

            <tbody>
              {paginatedData.map((item) => (
                <tr
                  key={item._id}
                  className="border-t border-gray-200 hover:bg-gray-50"
                >
                  <td className="px-3 py-3 align-top text-left text-sm">
                    {renderClassCodes(item.classCodes)}
                  </td>

                  <td className="px-3 py-3 align-top text-left text-sm">
                    <div className="break-words text-sm text-gray-700">
                      {item.className || "-"}
                    </div>
                  </td>

                  <td className="px-3 py-3 align-top text-left text-sm">
                    {renderTeachers(item.teachers)}
                  </td>

                  <td className="px-3 py-3 align-top text-left text-sm">
                    {renderStatus(item.isOpened)}
                  </td>

                  <td
                    className="
                      sticky right-0 z-10
                      bg-white
                      px-3 py-3
                      align-top
                      text-left
                      text-sm
                      shadow-[-4px_0_8px_rgba(0,0,0,0.06)]
                    "
                  >
                    <div className="flex flex-nowrap items-center gap-2 whitespace-nowrap [&>button]:shrink-0">
                      <button
                        type="button"
                        onClick={() => handleCheckIn(item._id)}
                        className="
                          flex cursor-pointer items-center gap-1
                          rounded-md
                          border border-blue-200
                          px-2.5 py-1.5
                          text-sm text-blue-600
                          hover:bg-blue-50
                        "
                      >
                        <ClipboardDocumentCheckIcon className="h-4 w-4 shrink-0" />

                        <span>เช็คชื่อ</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleEdit(item._id)}
                        className="
                          flex cursor-pointer items-center gap-1
                          rounded-md
                          border border-gray-200
                          px-2.5 py-1.5
                          text-sm text-gray-700
                          hover:bg-gray-100
                        "
                      >
                        <PencilSquareIcon className="h-4 w-4 shrink-0" />

                        <span>แก้ไข</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(item._id)}
                        className="
                          flex cursor-pointer items-center gap-1
                          rounded-md
                          border border-red-200
                          px-2.5 py-1.5
                          text-sm text-red-500
                          hover:bg-red-50
                        "
                      >
                        <TrashIcon className="h-4 w-4 shrink-0" />

                        <span>ลบ</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {data.length > 10 && (
        <div className="mt-4 flex flex-col gap-3 text-sm text-gray-600 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-sm">
            <span>แสดง</span>

            <div ref={pageSizeRef} className="relative">
              <button
                type="button"
                onClick={() => setOpenPageSize(!openPageSize)}
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

            <span>จากทั้งหมด {data.length} รายการ</span>
          </div>

          <div className="flex items-center justify-center gap-1.5">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={page === 1}
              className="cursor-pointer rounded-md border border-gray-200 px-3 py-2 text-sm hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
            >
              ก่อนหน้า
            </button>

            {getVisiblePages().map((p) => (
              <button
                type="button"
                key={p}
                onClick={() => setPage(p)}
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
              className="cursor-pointer rounded-md border border-gray-200 px-3 py-2 text-sm hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
            >
              ถัดไป
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

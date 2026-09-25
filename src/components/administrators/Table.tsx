"use client";
import { useLanguage } from "@/lib/language";


import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  CheckIcon,
  ChevronDownIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import type { Administrator, AdministratorRole } from "@/types/administrators";
import EmptyStateIcon from "@/components/common/EmptyStateIcon";

interface Props {
  users: Administrator[];
  totalCount: number;
  canManage: boolean;
  canCreate: boolean;
  currentUserId: string;
  busy: boolean;
  loading: boolean;
  error: string;
  filterKey: string;
  onChangeRole: (user: Administrator, role: AdministratorRole) => void;
  onDelete: (user: Administrator) => void;
  onRetry: () => void;
  onAdd: () => void;
}

export default function AdministratorTable({
  users,
  totalCount,
  canManage,
  canCreate,
  currentUserId,
  busy,
  loading,
  error,
  filterKey,
  onChangeRole,
  onDelete,
  onRetry,
  onAdd,
}: Props) {
  const { tr } = useLanguage();

  const [pageSize, setPageSize] = useState(10);
  const [openPageSize, setOpenPageSize] = useState(false);
  const [openRoleId, setOpenRoleId] = useState<string | null>(null);
  const [roleMenuPosition, setRoleMenuPosition] = useState({
    top: 0,
    left: 0,
    width: 0,
  });
  const pageSizeRef = useRef<HTMLDivElement>(null);
  const roleMenuRef = useRef<HTMLDivElement>(null);
  const [requestedPage, setPage] = useState(1);
  const [previousFilter, setPreviousFilter] = useState(filterKey);
  const totalPages = Math.max(1, Math.ceil(users.length / pageSize));
  const currentPage = Math.min(requestedPage, totalPages);
  if (previousFilter !== filterKey) {
    setPreviousFilter(filterKey);
    setPage(1);
  } else if (requestedPage !== currentPage) {
    setPage(currentPage);
  }
  const visible = users.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );
  const visiblePages = Array.from(
    { length: Math.min(3, totalPages) },
    (_, index) =>
      Math.max(1, Math.min(currentPage - 1, totalPages - 2)) + index,
  );

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

  useEffect(() => {
    if (!openRoleId) return;
    const close = (event: MouseEvent) => {
      const target = event.target as Element;
      if (
        !roleMenuRef.current?.contains(target) &&
        !target.closest("[data-admin-role-trigger]")
      )
        setOpenRoleId(null);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpenRoleId(null);
    };
    const scroll = () => setOpenRoleId(null);
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", escape);
    window.addEventListener("scroll", scroll, true);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", escape);
      window.removeEventListener("scroll", scroll, true);
    };
  }, [openRoleId]);

  function toggleRole(
    user: Administrator,
    event: React.MouseEvent<HTMLButtonElement>,
  ) {
    if (openRoleId === user._id) {
      setOpenRoleId(null);
      return;
    }
    const rect = event.currentTarget.getBoundingClientRect();
    const menuHeight = 82;
    const above =
      window.innerHeight - rect.bottom < menuHeight + 8 &&
      rect.top > menuHeight + 8;
    setRoleMenuPosition({
      top: above ? rect.top - menuHeight - 4 : rect.bottom + 4,
      left: rect.left,
      width: rect.width,
    });
    setOpenRoleId(user._id);
  }

  if (loading) return null;
  if (error)
    return (
      <div
        role="alert"
        className="rounded-xl border border-red-100 bg-red-50 p-6 text-center text-sm text-red-600"
      >
        <p>{tr(error)}</p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-3 cursor-pointer underline"
        >{tr("ลองอีกครั้ง")}</button>
      </div>
    );
  if (!users.length) {
    const noData = totalCount === 0;
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center px-4 text-center">
        <EmptyStateIcon kind={noData ? "students" : "search"} />
        {noData ? (
          <>
            <p className="mb-4 text-sm text-gray-400">{tr("ยังไม่มีข้อมูลผู้ใช้ในระบบ")}</p>
            {canCreate && (
              <button
                type="button"
                onClick={onAdd}
                className="flex cursor-pointer items-center gap-2 rounded-md bg-[var(--primary)] px-5 py-2.5 text-sm text-white shadow-sm transition hover:bg-[var(--primary-hover)]"
              >{tr("+ เพิ่มผู้ใช้")}</button>
            )}
          </>
        ) : (
          <p className="whitespace-nowrap text-sm text-gray-500">{tr("ไม่พบข้อมูลที่ค้นหา กรุณาลองใหม่อีกครั้ง")}</p>
        )}
      </div>
    );
  }

  const roleSelect = (user: Administrator) =>
    canManage ? (
      <button
        type="button"
        data-admin-role-trigger
        aria-label={tr("สิทธิ์ของ {0}", {0: user.fullname})}
        aria-expanded={openRoleId === user._id}
        disabled={busy || user._id === currentUserId}
        onClick={(event) => toggleRole(user, event)}
        className="form-input-card flex min-w-0 cursor-pointer items-center justify-between gap-2 text-left text-sm text-gray-700 disabled:cursor-default disabled:opacity-50"
      >
        <span className="truncate">{user.role}</span>
        <ChevronDownIcon className="h-4 w-4 shrink-0 text-gray-400" />
      </button>
    ) : (
      <span className="inline-flex rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">
        {user.role}
      </span>
    );

  const deleteButton = (user: Administrator) => (
    <button
      type="button"
      aria-label={tr("ลบ {0}", {0: user.fullname})}
      disabled={busy || user._id === currentUserId}
      onClick={() => onDelete(user)}
      className="flex min-h-11 min-w-11 shrink-0 cursor-pointer items-center justify-center gap-1 rounded-md border border-red-200 px-2.5 py-1.5 text-sm text-red-500 hover:bg-red-50 disabled:opacity-40"
    >
      <TrashIcon className="h-4 w-4" />
      <span className="hidden lg:inline">{tr("ลบ")}</span>
    </button>
  );

  return (
    <div className="w-full min-w-0">
      <div className="space-y-3 md:hidden">
        {visible.map((user) => (
          <div
            key={user._id}
            className="rounded-xl border border-gray-200 bg-white p-4 text-sm"
          >
            <p className="font-medium text-gray-800">
              {user.prefix} {user.fullname}
            </p>
            <p className="mt-1 break-all text-gray-500">
              {user.username} · {user.email}
            </p>
            <div className="mt-4 flex items-center gap-2 border-t border-gray-100 pt-4">
              <div className="min-w-0 flex-1">{roleSelect(user)}</div>
              {canManage && deleteButton(user)}
            </div>
          </div>
        ))}
      </div>
      <div className="hidden overflow-hidden rounded-xl border border-gray-200 md:block">
        <div className="max-h-[510px] overflow-auto">
          <table className="app-data-table w-full min-w-[760px] table-fixed text-sm">
            <thead className="text-gray-600">
              <tr>
                <th className="sticky top-0 z-10 w-[22%] bg-gray-50 px-3 text-left font-semibold">{tr("ชื่อ-นามสกุล")}</th>
                <th className="sticky top-0 z-10 w-[17%] bg-gray-50 px-3 text-left font-semibold">{tr("ชื่อผู้ใช้")}</th>
                <th className="sticky top-0 z-10 w-[25%] bg-gray-50 px-3 text-left font-semibold">{tr("อีเมล")}</th>
                <th
                  className={`sticky top-0 z-10 bg-gray-50 px-3 text-left font-semibold ${canManage ? "w-[25%]" : "w-[36%]"}`}
                >{tr("สิทธิ์ปัจจุบัน")}</th>
                {canManage && (
                  <th className="sticky top-0 z-10 w-[11%] bg-gray-50 px-3 text-left font-semibold">{tr("จัดการ")}</th>
                )}
              </tr>
            </thead>
            <tbody>
              {visible.map((user) => (
                <tr
                  key={user._id}
                  className="border-t border-gray-200 hover:bg-gray-50"
                >
                  <td className="break-words px-3 py-3 text-gray-700">
                    {user.prefix} {user.fullname}
                  </td>
                  <td className="break-words px-3 py-3 text-gray-700">
                    {user.username}
                  </td>
                  <td className="break-all px-3 py-3 text-gray-700">
                    {user.email}
                  </td>
                  <td className="px-3 py-3">{roleSelect(user)}</td>
                  {canManage && (
                    <td className="px-3 py-3">{deleteButton(user)}</td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {users.length > 10 && (
        <div className="mt-4 flex flex-col gap-3 text-sm text-gray-600 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <span>{tr("แสดง")}</span>
            <div ref={pageSizeRef} className="relative">
              <button
                type="button"
                aria-label={tr("จำนวนรายการต่อหน้า")}
                aria-expanded={openPageSize}
                onClick={() => setOpenPageSize(!openPageSize)}
                className="form-input-card flex min-w-[60px] cursor-pointer items-center justify-between gap-2 px-3 py-1 text-sm"
              >
                <span>{pageSize}</span>
                <ChevronDownIcon className="h-3.5 w-3.5 text-gray-400" />
              </button>

              {openPageSize && (
                <div className="absolute bottom-full left-0 z-20 mb-1 w-full overflow-hidden rounded-md border border-gray-200 bg-white shadow-lg">
                  {[10, 15, 20].map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => {
                        setPageSize(size);
                        setPage(1);
                        setOpenPageSize(false);
                      }}
                      className={`block w-full cursor-pointer px-3 py-2 text-left text-sm hover:bg-gray-100 ${pageSize === size ? "bg-blue-50 font-medium text-blue-600" : ""}`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <span>{tr("จากทั้งหมด")}{" "}{users.length}{" "}{tr("รายการ")}</span>
          </div>

          <div className="flex items-center justify-center gap-1.5">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setPage(currentPage - 1)}
              className="cursor-pointer rounded-md border border-gray-200 px-3 py-2 hover:bg-gray-100 disabled:opacity-40"
            >{tr("ก่อนหน้า")}</button>
            {visiblePages.map((number) => (
              <button
                key={number}
                type="button"
                aria-current={currentPage === number ? "page" : undefined}
                onClick={() => setPage(number)}
                className={`cursor-pointer rounded-md border px-3 py-2 ${currentPage === number ? "border-[var(--primary)] bg-[var(--primary)] text-white" : "border-gray-200 hover:bg-gray-100"}`}
              >
                {number}
              </button>
            ))}
            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={() => setPage(currentPage + 1)}
              className="cursor-pointer rounded-md border border-gray-200 px-3 py-2 hover:bg-gray-100 disabled:opacity-40"
            >{tr("ถัดไป")}</button>
          </div>
        </div>
      )}

      {openRoleId &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={roleMenuRef}
            style={{
              position: "fixed",
              top: roleMenuPosition.top,
              left: roleMenuPosition.left,
              width: roleMenuPosition.width,
            }}
            className="z-[100] overflow-hidden rounded-md border border-gray-200 bg-white shadow-lg"
          >
            {(["Teacher", "Teaching Assistant"] as AdministratorRole[]).map(
              (role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => {
                    const user = users.find((item) => item._id === openRoleId);
                    if (user) onChangeRole(user, role);
                    setOpenRoleId(null);
                  }}
                  className={`flex w-full cursor-pointer items-center justify-between px-4 py-2 text-left text-sm ${users.find((item) => item._id === openRoleId)?.role === role ? "bg-blue-50 font-medium text-blue-600" : "text-gray-700 hover:bg-gray-100"}`}
                >
                  {role}
                  {users.find((item) => item._id === openRoleId)?.role ===
                    role && <CheckIcon className="h-4 w-4" />}
                </button>
              ),
            )}
          </div>,
          document.body,
        )}
    </div>
  );
}

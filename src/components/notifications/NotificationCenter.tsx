"use client";

import {
  BellIcon,
  BookOpenIcon,
  CheckIcon,
  ClipboardDocumentCheckIcon,
  UserCircleIcon,
  UserGroupIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { useCallback, useEffect, useRef, useState } from "react";
import { notificationsApi } from "@/services/api/notifications";
import type {
  ActivityNotification,
  NotificationsResponse,
} from "@/types/notifications";

const categoryIcons = {
  accounts: UserCircleIcon,
  classes: BookOpenIcon,
  students: UserGroupIcon,
  attendance: ClipboardDocumentCheckIcon,
};

const formatter = new Intl.DateTimeFormat("th-TH", {
  dateStyle: "medium",
  timeStyle: "short",
});

export default function NotificationCenter({ collapsed }: { collapsed: boolean }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [items, setItems] = useState<ActivityNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setError("");
      const response = await notificationsApi.list({ cache: "no-store" });
      const data = (await response.json()) as NotificationsResponse & {
        message?: string;
      };
      if (!response.ok || !data.success) {
        throw new Error(data.message || "โหลดการแจ้งเตือนไม่สำเร็จ");
      }
      setItems(data.data);
      setUnreadCount(data.unreadCount);
      return true;
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "โหลดการแจ้งเตือนไม่สำเร็จ",
      );
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const timer = window.setInterval(() => void load(), 60_000);
    return () => window.clearInterval(timer);
  }, [load]);

  async function openDialog() {
    dialogRef.current?.showModal();
    const loaded = await load();
    if (loaded) {
      const response = await notificationsApi.markAllRead();
      if (response.ok) setUnreadCount(0);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => void openDialog()}
        title={collapsed ? "การแจ้งเตือน" : undefined}
        className={`relative flex w-full cursor-pointer items-center rounded-lg py-2.5 text-left text-gray-600 transition hover:bg-gray-100 hover:text-gray-800 ${collapsed ? "justify-center px-2" : "gap-3 px-3"}`}
      >
        <span className={`relative shrink-0 ${collapsed ? "h-6 w-6" : "h-5 w-5"}`}>
          <BellIcon aria-hidden="true" />
          {collapsed && unreadCount > 0 && (
            <span className="absolute -right-2 -top-2 flex min-h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold leading-none text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </span>
        {!collapsed && (
          <>
            <span className="text-sm font-medium">การแจ้งเตือน</span>
            {unreadCount > 0 && (
              <span className="flex min-h-6 min-w-6 items-center justify-center rounded-md bg-red-50 px-1.5 text-xs font-semibold text-red-500">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </>
        )}
      </button>

      <dialog
        ref={dialogRef}
        onMouseDown={(event) => {
          if (event.target !== event.currentTarget) return;
          const dialog = event.currentTarget;
          const rect = dialog.getBoundingClientRect();
          if (
            event.clientX >= rect.left &&
            event.clientX <= rect.right &&
            event.clientY >= rect.top &&
            event.clientY <= rect.bottom
          )
            return;
          dialog.classList.remove("app-dialog-attention");
          void dialog.offsetWidth;
          dialog.classList.add("app-dialog-attention");
        }}
        onAnimationEnd={(event) => {
          if (event.animationName === "app-dialog-attention")
            event.currentTarget.classList.remove("app-dialog-attention");
        }}
        className="app-dialog-panel fixed inset-0 m-auto h-[82dvh] max-h-[780px] min-h-[min(520px,calc(100dvh-1.5rem))] w-[calc(100%-1.5rem)] max-w-4xl overflow-hidden rounded-2xl border-0 bg-white p-0 font-noto text-left shadow-sm backdrop:bg-black/40 sm:w-[calc(100%-3rem)]"
        aria-labelledby="notification-title"
      >
        <div className="flex h-full min-h-0 flex-col p-5 sm:p-6">
          <div className="mb-5 flex items-center justify-between gap-3 border-b border-gray-100 pb-4">
            <div className="flex min-w-0 items-center gap-3">
              <div className="shrink-0 rounded-xl bg-blue-50 p-2.5">
                <BellIcon className="h-5 w-5 text-blue-600" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <h2 id="notification-title" className="text-lg font-semibold text-gray-800">
                  การแจ้งเตือน
                </h2>
                <p className="mt-0.5 text-sm text-gray-500">กิจกรรมสำคัญที่เกิดขึ้นในระบบ</p>
              </div>
            </div>
            <button type="button" autoFocus onClick={() => dialogRef.current?.close()} className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full text-gray-500 transition hover:bg-gray-100 hover:text-gray-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400" aria-label="ปิดการแจ้งเตือน">
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto pr-1 sm:pr-2">
            {loading ? (
              <div role="status" className="flex h-full min-h-52 items-center justify-center">
                <span className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
              </div>
            ) : error ? (
              <div className="flex h-full min-h-52 flex-col items-center justify-center gap-3 text-center">
                <p className="text-sm text-red-600">{error}</p>
                <button type="button" onClick={() => void load()} className="cursor-pointer rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">ลองอีกครั้ง</button>
              </div>
            ) : items.length === 0 ? (
              <div className="flex h-full min-h-52 flex-col items-center justify-center text-center">
                <div className="mb-3 rounded-full bg-blue-50 p-4 text-blue-500"><CheckIcon className="h-7 w-7" /></div>
                <p className="font-medium text-gray-800">ยังไม่มีกิจกรรมใหม่</p>
                <p className="mt-1 text-sm text-gray-500">กิจกรรมสำคัญจะแสดงที่นี่</p>
              </div>
            ) : (
              <ul className="space-y-1">
                {items.map((item) => {
                  const Icon = categoryIcons[item.category];
                  return (
                    <li key={item.id} className={`flex gap-3 rounded-xl p-3 ${item.unread ? "bg-blue-50/80" : "hover:bg-gray-50"}`}>
                      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-blue-600 shadow-sm ring-1 ring-gray-100"><Icon className="h-5 w-5" /></span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm leading-6 text-gray-800"><span className="font-semibold">{item.actorName}</span> {item.message}</p>
                        <time dateTime={item.createdAt} className="mt-1 block text-xs text-gray-500">{formatter.format(new Date(item.createdAt))}</time>
                      </div>
                      {item.unread && <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-blue-500" aria-label="ยังไม่อ่าน" />}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </dialog>
    </>
  );
}

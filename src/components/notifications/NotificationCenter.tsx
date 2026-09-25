"use client";


import {
  BellIcon,
  BookOpenIcon,
  CheckIcon,
  ChevronRightIcon,
  ClipboardDocumentCheckIcon,
  UserCircleIcon,
  UserGroupIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { notificationsApi } from "@/services/api/notifications";
import { subscribeNotifications } from "@/services/api/notifications/subscribe";
import { useLanguage } from "@/lib/language";
import type {
  ActivityNotification,
  NotificationsResponse,
  NotificationFilter,
} from "@/types/notifications";

const categoryIcons = {
  accounts: UserCircleIcon,
  classes: BookOpenIcon,
  students: UserGroupIcon,
  attendance: ClipboardDocumentCheckIcon,
};

export default function NotificationCenter({
  collapsed,
}: {
  collapsed: boolean;
}) {
  const { t, tr, locale } = useLanguage();
  const formatter = new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Bangkok",
  });
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [items, setItems] = useState<ActivityNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [readCount, setReadCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [filter, setFilter] = useState<NotificationFilter>("all");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [openingId, setOpeningId] = useState<string | null>(null);
  const [actionError, setActionError] = useState("");
  const opening = useRef(false);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [markingAllRead, setMarkingAllRead] = useState(false);
  const requestSequence = useRef(0);
  const activeRequest = useRef<AbortController | null>(null);

  const load = useCallback(async () => {
    const sequence = ++requestSequence.current;
    activeRequest.current?.abort();
    const controller = new AbortController();
    activeRequest.current = controller;
    try {
      setError("");
      const response = await notificationsApi.list(
        {
          cache: "no-store",
          signal: controller.signal,
        },
        { status: filter, page },
      );
      const data = (await response.json()) as NotificationsResponse & {
        message?: string;
      };
      if (!response.ok || !data.success) {
        throw new Error(data.message || "โหลดการแจ้งเตือนไม่สำเร็จ");
      }
      if (controller.signal.aborted || sequence !== requestSequence.current)
        return null;
      setItems(data.data);
      setUnreadCount(data.unreadCount);
      setReadCount(data.readCount);
      setTotalCount(data.totalCount);
      setHasMore(data.hasMore);
      return data;
    } catch (cause) {
      if (controller.signal.aborted || sequence !== requestSequence.current)
        return null;
      setError(
        cause instanceof Error ? cause.message : "โหลดการแจ้งเตือนไม่สำเร็จ",
      );
      return null;
    } finally {
      if (!controller.signal.aborted && sequence === requestSequence.current)
        setLoading(false);
    }
  }, [filter, page]);

  useEffect(() => {
    void load();
    let refreshTimer: ReturnType<typeof setTimeout> | undefined;
    const unsubscribe = subscribeNotifications(() => {
      if (refreshTimer) return;
      refreshTimer = setTimeout(() => {
        refreshTimer = undefined;
        void load();
      }, 100);
    });
    return () => {
      unsubscribe();
      clearTimeout(refreshTimer);
      activeRequest.current?.abort();
    };
  }, [load]);

  async function openDialog() {
    dialogRef.current?.showModal();
    setActionError("");
    await load();
  }

  async function openActivity(item: ActivityNotification) {
    if (opening.current) return;
    opening.current = true;
    setOpeningId(item.id);
    setActionError("");
    try {
      const response = await notificationsApi.markRead(item.id);
      const data = await response.json();
      if (!response.ok || !data.success)
        throw new Error(data.message || "เปิดกิจกรรมไม่สำเร็จ");
      dialogRef.current?.close();
      router.push(data.href || item.href);
      void load();
    } catch (cause) {
      setActionError(
        cause instanceof Error
          ? cause.message
          : "เปิดกิจกรรมไม่สำเร็จ กรุณาลองอีกครั้ง",
      );
    } finally {
      opening.current = false;
      setOpeningId(null);
    }
  }

  function changeFilter(next: NotificationFilter) {
    if (next === filter) return;
    setFilter(next);
    setPage(1);
    setLoading(true);
    setActionError("");
  }

  async function markAllAsRead() {
    if (unreadCount === 0 || markingAllRead) return;
    setMarkingAllRead(true);
    setActionError("");
    try {
      const response = await notificationsApi.markAllRead(
        new Date().toISOString(),
      );
      const data = await response.json();
      if (!response.ok || !data.success)
        throw new Error(data.message || "ทำเครื่องหมายว่าอ่านทั้งหมดไม่สำเร็จ");
      await load();
    } catch (cause) {
      setActionError(
        cause instanceof Error
          ? cause.message
          : "ทำเครื่องหมายว่าอ่านทั้งหมดไม่สำเร็จ",
      );
    } finally {
      setMarkingAllRead(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => void openDialog()}
        title={collapsed ? t.notifications : undefined}
        aria-label={t.notifications}
        className={`relative flex w-full cursor-pointer items-center rounded-lg py-2.5 text-left text-gray-600 transition hover:bg-gray-100 hover:text-gray-800 ${collapsed ? "justify-center px-2" : "gap-3 px-3"}`}
      >
        <span
          className={`relative shrink-0 ${collapsed ? "h-6 w-6" : "h-5 w-5"}`}
        >
          <BellIcon aria-hidden="true" />
          {collapsed && unreadCount > 0 && (
            <span className="absolute -right-2 -top-2 flex min-h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold leading-none text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </span>
        {!collapsed && (
          <>
            <span className="text-sm font-medium">{t.notifications}</span>
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
        className="app-dialog-panel fixed inset-0 m-auto h-[82dvh] max-h-195 min-h-[min(520px,calc(100dvh-1.5rem))] w-[calc(100%-1.5rem)] max-w-3xl overflow-hidden rounded-2xl border border-slate-200 bg-white p-0 font-noto text-left shadow-[0_24px_64px_-24px_rgba(15,23,42,0.3)] backdrop:bg-slate-900/35 backdrop:backdrop-blur-[3px] sm:w-[calc(100%-3rem)]"
        aria-labelledby="notification-title"
      >
        <div className="flex h-full min-h-0 flex-col p-5 sm:p-6">
          <div className="mb-5 flex shrink-0 items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="shrink-0 rounded-xl bg-gray-100 p-2.5">
                <BellIcon
                  className="h-5 w-5 text-slate-600"
                  aria-hidden="true"
                />
              </div>
              <div className="min-w-0">
                <h2
                  id="notification-title"
                  className="text-lg font-semibold text-slate-800"
                >{tr("การแจ้งเตือน")}</h2>
                <p className="mt-0.5 text-xs leading-5 text-slate-500">{tr("กิจกรรมสำคัญที่เกิดขึ้นในระบบ")}</p>
              </div>
            </div>
            <button
              type="button"
              autoFocus
              onClick={() => dialogRef.current?.close()}
              className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
              aria-label={tr("ปิดการแจ้งเตือน")}
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          <div className="mb-3 flex shrink-0 flex-wrap items-center justify-between gap-2">
            {unreadCount > 0 ? (
              <button
                type="button"
                onClick={() => void markAllAsRead()}
                disabled={markingAllRead}
                className="cursor-pointer rounded-md py-1 text-xs font-medium text-blue-600 transition hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {markingAllRead ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-sky-200 border-t-sky-500" />
                    <span>{tr("อ่านทั้งหมด")}</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5">
                    <CheckIcon className="h-4 w-4" aria-hidden="true" />{tr("อ่านทั้งหมด")}</span>
                )}
              </button>
            ) : (
              <span className="text-sm text-slate-500">{tr("อ่านทั้งหมดแล้ว")}</span>
            )}
            <span className="text-xs text-slate-500">
              {unreadCount > 0
                ? tr("{0} รายการที่ยังไม่ได้อ่าน", {0: unreadCount})
                : tr("ไม่มีข้อความใหม่")}
            </span>
          </div>

          <div
            className="mb-2 flex shrink-0 gap-1 border-b border-slate-200"
            aria-label={tr("กรองการแจ้งเตือน")}
          >
            {(
              [
                { value: "all", label: "ทั้งหมด", count: totalCount },
                { value: "unread", label: "ยังไม่อ่าน", count: unreadCount },
                { value: "read", label: "อ่านแล้ว", count: readCount },
              ] as const
            ).map((tab) => (
              <button
                key={tab.value}
                type="button"
                aria-pressed={filter === tab.value}
                onClick={() => changeFilter(tab.value)}
                className={`-mb-px flex flex-1 cursor-pointer items-center justify-center gap-1.5 border-b-2 px-2 py-3 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-400 sm:flex-none sm:px-4 sm:text-sm ${filter === tab.value ? "border-blue-500 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-700"}`}
              >
                {tr(tab.label)}
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] tabular-nums ${filter === tab.value ? "bg-blue-50 text-blue-600" : "bg-slate-100 text-slate-500"}`}
                >
                  {tab.count > 99 ? "99+" : tab.count}
                </span>
              </button>
            ))}
          </div>
          {actionError && (
            <p
              role="alert"
              className="mb-3 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700"
            >
              {tr(actionError)}
            </p>
          )}
          <div
            className="min-h-0 flex-1 overflow-y-auto overscroll-contain [scrollbar-width:thin] [scrollbar-color:var(--input-border)_transparent]"
            aria-busy={loading}
          >
            {loading ? (
              <div
                role="status"
                className="flex h-full min-h-52 items-center justify-center"
              >
                <span className="h-8 w-8 animate-spin rounded-full border-2 border-sky-500 border-t-transparent" />
              </div>
            ) : error ? (
              <div className="flex h-full min-h-52 flex-col items-center justify-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 text-center">
                <p className="text-sm font-medium text-red-700">{tr(error)}</p>
                <button
                  type="button"
                  onClick={() => void load()}
                  className="cursor-pointer rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600"
                >{tr("ลองอีกครั้ง")}</button>
              </div>
            ) : items.length === 0 ? (
              <div className="flex h-full min-h-52 flex-col items-center justify-center text-center">
                <div className="mb-3 rounded-2xl bg-slate-100 p-3 text-slate-400">
                  <CheckIcon className="h-7 w-7" />
                </div>
                <p className="font-medium text-slate-800">
                  {filter === "unread"
                    ? tr("ไม่มีการแจ้งเตือนที่ยังไม่อ่าน")
                    : filter === "read"
                      ? tr("ยังไม่มีการแจ้งเตือนที่อ่านแล้ว")
                      : tr("ยังไม่มีกิจกรรมใหม่")}
                </p>
                <p className="mt-1 text-sm text-slate-500">{tr("คลิกกิจกรรมเพื่อเปิดหน้าที่เกี่ยวข้องและบันทึกว่าอ่านแล้ว")}</p>
              </div>
            ) : (
              <ul>
                {items.map((item) => {
                  const Icon = categoryIcons[item.category];
                  const isDeleteAction = item.action === "delete";
                  return (
                    <li
                      key={item.id}
                      className="border-b border-slate-200/60 last:border-0"
                    >
                      <button
                        type="button"
                        onClick={() => void openActivity(item)}
                        disabled={openingId !== null}
                        className={`group flex w-full cursor-pointer gap-3 rounded-lg px-3 py-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-400 disabled:cursor-wait ${item.unread ? "bg-blue-50/40 hover:bg-blue-50 dark:bg-blue-950/20" : "hover:bg-slate-50"}`}
                      >
                        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                          <Icon
                            className="h-[18px] w-[18px]"
                            aria-hidden="true"
                          />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm leading-6 text-slate-700">
                            <span
                              className={`${item.unread ? "font-semibold text-slate-900" : "font-medium text-slate-700"}`}
                            >
                              {item.actorName}
                            </span>{" "}
                            {tr(item.message)}
                          </span>
                          <span className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                            <time
                              dateTime={item.createdAt}
                              className="text-xs text-slate-500"
                            >
                              {formatter.format(new Date(item.createdAt))}
                            </time>
                            <span
                              className={`inline-flex items-center gap-1.5 text-[11px] ${item.unread ? "text-blue-600" : "text-slate-400"}`}
                            >
                              {item.unread ? (
                                <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                              ) : (
                                <CheckIcon className="h-3.5 w-3.5" />
                              )}
                              {item.unread ? tr("ยังไม่อ่าน") : tr("อ่านแล้ว")}
                            </span>
                            {isDeleteAction && (
                              <span className="text-[11px] text-red-500">{tr("ลบข้อมูล")}</span>
                            )}
                          </span>
                        </span>
                        {openingId === item.id ? (
                          <span
                            aria-label={tr("กำลังเปิดกิจกรรม")}
                            className="mt-2 h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-sky-200 border-t-sky-500"
                          />
                        ) : (
                          <ChevronRightIcon
                            aria-hidden="true"
                            className="mt-2 h-4 w-4 shrink-0 text-slate-300 transition group-hover:text-slate-500"
                          />
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
          {(page > 1 || hasMore) && (
            <div className="mt-2 flex shrink-0 items-center justify-between border-t border-slate-200 pt-3 text-xs">
              <button
                type="button"
                disabled={page === 1 || loading}
                onClick={() => {
                  setPage(page - 1);
                  setLoading(true);
                }}
                className="cursor-pointer rounded-lg px-3 py-2 text-slate-600 hover:bg-slate-100 disabled:cursor-default disabled:opacity-40"
              >{tr("ก่อนหน้า")}</button>
              <span className="text-slate-400 tabular-nums">{tr("หน้า")}{" "}{page}</span>
              <button
                type="button"
                disabled={!hasMore || loading}
                onClick={() => {
                  setPage(page + 1);
                  setLoading(true);
                }}
                className="cursor-pointer rounded-lg px-3 py-2 text-slate-600 hover:bg-slate-100 disabled:cursor-default disabled:opacity-40"
              >{tr("ถัดไป")}</button>
            </div>
          )}
        </div>
      </dialog>
    </>
  );
}

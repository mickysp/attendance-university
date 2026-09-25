"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import {
  isSessionReason,
  sessionMessages,
  type SessionReason,
} from "@/lib/session-policy";

export default function SessionGuard() {
  const [reason, setReason] = useState<SessionReason | null>(null);

  useEffect(() => {
    let stopped = false;
    let exiting = false;
    let checking = false;
    let redirectTimer: ReturnType<typeof setTimeout> | undefined;
    const channel =
      typeof BroadcastChannel !== "undefined"
        ? new BroadcastChannel("account-session")
        : null;

    const endSession = (value: unknown, broadcast = true) => {
      if (stopped || exiting || !isSessionReason(value)) return;
      exiting = true;
      setReason(value);
      if (broadcast) channel?.postMessage(value);
      // Revocation is enforced by the server before this popup is shown.
      void fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
        signal: AbortSignal.timeout(2500),
      }).catch(() => {});
      redirectTimer = setTimeout(() => {
        window.location.replace(`/login?reason=${encodeURIComponent(value)}`);
      }, 3000);
    };

    const check = async () => {
      if (
        stopped ||
        exiting ||
        checking ||
        document.visibilityState === "hidden"
      )
        return;
      checking = true;
      try {
        const response = await fetch("/api/auth/user", {
          cache: "no-store",
          credentials: "include",
          signal: AbortSignal.timeout(10000),
        });
        if (response.status === 401) {
          const data = await response.json();
          endSession(data.reason);
        }
      } catch {
        // Network/server failures are retried, never treated as a logout.
      } finally {
        checking = false;
      }
    };
    const onInvalid = (event: Event) =>
      endSession((event as CustomEvent).detail);
    if (channel) channel.onmessage = (event) => endSession(event.data, false);
    window.addEventListener("session-invalid", onInvalid);
    window.addEventListener("focus", check);
    window.addEventListener("profile-updated", check);
    document.addEventListener("visibilitychange", check);
    const interval = setInterval(check, 15000);
    void check();
    return () => {
      stopped = true;
      clearInterval(interval);
      clearTimeout(redirectTimer);
      channel?.close();
      window.removeEventListener("session-invalid", onInvalid);
      window.removeEventListener("focus", check);
      window.removeEventListener("profile-updated", check);
      document.removeEventListener("visibilitychange", check);
    };
  }, []);

  useEffect(() => {
    if (!reason) return;
    const content = document.getElementById("authenticated-content");
    content?.setAttribute("inert", "");
    document.getElementById("session-dialog")?.focus();
    return () => content?.removeAttribute("inert");
  }, [reason]);

  if (!reason) return null;
  return createPortal(
    <div className="app-session-backdrop fixed inset-0 z-[10000] flex items-center justify-center p-4">
      <div
        id="session-dialog"
        tabIndex={-1}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="session-title"
        aria-describedby="session-description"
        className="app-swal-popup app-swal-popup-warning app-session-popup bg-white text-center"
      >
        <div aria-hidden="true" className="app-swal-icon text-amber-500">
          <ExclamationTriangleIcon
            className="swal-icon-svg"
            strokeWidth={1.8}
          />
        </div>
        <h2 id="session-title" className="app-swal-title">
          {sessionMessages[reason]}
        </h2>
        <p
          id="session-description"
          className="app-swal-text app-session-description"
        >
          กรุณาเข้าสู่ระบบอีกครั้งเพื่อดำเนินการต่อ
        </p>
        <div className="app-session-status">
          <span
            aria-hidden="true"
            className="h-4 w-4 animate-spin rounded-full border-2 border-blue-200 border-t-blue-500 motion-reduce:animate-none"
          />
          <span>กำลังออกจากระบบ</span>
        </div>
        <div aria-hidden="true" className="app-session-progress">
          <div className="app-session-progress-fill" />
        </div>
      </div>
    </div>,
    document.body,
  );
}

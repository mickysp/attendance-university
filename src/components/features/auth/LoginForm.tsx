"use client";

import { authApi } from "@/services/api/auth";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/solid";
import { useAuthStore } from "@/stores/auth";

export default function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [usernameError, setUsernameError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const [status, setStatus] = useState<"idle" | "checking" | "redirecting">(
    "idle",
  );
  const [loginError, setLoginError] = useState("");
  const [slow, setSlow] = useState(false);
  const [destination, setDestination] = useState("");
  const submitting = useRef(false);
  const activeRequest = useRef<AbortController | null>(null);
  const busy = status !== "idle";

  const {
    username,
    password,
    remember,
    setUsername,
    setPassword,
    setRemember,
    clearPassword,
    loadRememberUser,
    saveRememberUser,
    clearRememberUser,
  } = useAuthStore();

  const router = useRouter();

  useEffect(() => {
    loadRememberUser();
  }, [loadRememberUser]);

  useEffect(() => {
    return () => activeRequest.current?.abort("unmounted");
  }, []);

  useEffect(() => {
    if (status === "idle") return;
    const timer = setTimeout(() => setSlow(true), 5000);
    return () => clearTimeout(timer);
  }, [status]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting.current) return;

    setLoginError("");
    setUsernameError("");
    setPasswordError("");

    if (!username.trim() || !password.trim()) {
      if (!username.trim()) setUsernameError("กรุณากรอกชื่อผู้ใช้");
      if (!password.trim()) setPasswordError("กรุณากรอกรหัสผ่าน");
      return;
    }

    submitting.current = true;
    setSlow(false);
    setStatus("checking");
    const controller = new AbortController();
    activeRequest.current = controller;
    const timeout = setTimeout(() => controller.abort("timeout"), 20000);

    try {
      const res = await authApi
        .login({ username, password, remember }, { signal: controller.signal })
        .catch(() => {
          throw new Error(
            "เชื่อมต่อระบบไม่ได้ กรุณาตรวจสอบอินเทอร์เน็ตแล้วลองอีกครั้ง",
          );
        });

      if (res.status === 404) {
        throw new Error(
          "ระบบยังไม่ได้ตรวจสอบชื่อผู้ใช้และรหัสผ่าน กรุณาติดต่อผู้ดูแลระบบ",
        );
      }
      if (res.status >= 500) {
        throw new Error(
          "ระบบเข้าสู่ระบบขัดข้อง กรุณาลองใหม่ภายหลัง ยังไม่สามารถยืนยันได้ว่าชื่อผู้ใช้หรือรหัสผ่านถูกต้อง",
        );
      }

      const data = await res.json().catch(() => {
        throw new Error(
          "ระบบตอบกลับไม่ถูกต้อง กรุณาลองใหม่หรือติดต่อผู้ดูแลระบบ",
        );
      });
      if (!data || typeof data.success !== "boolean") {
        throw new Error(
          "ระบบตอบกลับไม่ถูกต้อง กรุณาลองใหม่หรือติดต่อผู้ดูแลระบบ",
        );
      }
      if (!res.ok || !data.success) {
        throw new Error(
          typeof data.message === "string" && data.message
            ? data.message
            : "เข้าสู่ระบบไม่สำเร็จ กรุณาลองอีกครั้ง",
        );
      }

      const role = typeof data.role === "string" ? data.role.toLowerCase() : "";
      const nextPage =
        role === "teacher"
          ? "/dashboard"
          : role === "teaching assistant"
            ? "/attendance"
            : "";
      if (!nextPage) {
        throw new Error(
          "ไม่พบสิทธิ์เข้าใช้งานที่รองรับ กรุณาติดต่อผู้ดูแลระบบ",
        );
      }

      if (remember) {
        saveRememberUser();
      } else {
        clearRememberUser();
      }
      clearPassword();
      setSlow(false);
      setDestination(nextPage);
      setStatus("redirecting");
      router.replace(nextPage);
    } catch (error) {
      if (controller.signal.reason === "unmounted") return;
      setLoginError(
        controller.signal.reason === "timeout"
          ? "ระบบใช้เวลาตอบกลับนานเกินไป ยังยืนยันชื่อผู้ใช้และรหัสผ่านไม่ได้ กรุณาลองอีกครั้ง"
          : error instanceof Error
            ? error.message
            : "เข้าสู่ระบบไม่สำเร็จ กรุณาลองอีกครั้ง",
      );
      setStatus("idle");
      submitting.current = false;
    } finally {
      clearTimeout(timeout);
      if (activeRequest.current === controller) activeRequest.current = null;
    }
  };

  return (
    <div
      className="
        box-border
        w-[calc(100vw-32px)]
        max-w-[448px]
        min-w-0
        shrink-0
        mx-auto
        rounded-xl
        bg-white
        shadow-xl
        p-5
        sm:w-[380px]
        sm:p-6
        md:w-[420px]
        md:p-8
        lg:w-[448px]
      "
    >
      <form
        onSubmit={handleLogin}
        aria-busy={busy}
        className="
          flex
          w-full
          flex-col
          gap-4
          font-noto
          mt-2
          sm:mt-3
          md:mt-4
        "
      >
        <h1 className="text-lg font-medium leading-relaxed">
          เข้าสู่ระบบ Attendance
        </h1>

        <div className="w-full">
          <input
            type="text"
            autoComplete="username"
            aria-label="ชื่อผู้ใช้"
            disabled={busy}
            className={`
              form-input
              mt-1
              block
              w-full
              min-w-0
              text-sm
              ${usernameError ? "border-red-500" : ""}
            `}
            placeholder="ชื่อผู้ใช้"
            value={username}
            onChange={(e) => {
              setUsername(e.target.value);
              setUsernameError("");
              setLoginError("");
            }}
          />

          {usernameError && (
            <p className="mt-1 text-xs text-red-500">{usernameError}</p>
          )}
        </div>

        <div className="relative w-full">
          <input
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            aria-label="รหัสผ่าน"
            disabled={busy}
            placeholder="รหัสผ่าน"
            className={`
              form-input
              block
              w-full
              min-w-0
              pr-10
              text-sm
              ${passwordError ? "border-red-500" : ""}
            `}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setPasswordError("");
              setLoginError("");
            }}
          />

          <button
            type="button"
            disabled={busy}
            aria-label={showPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
            onClick={() => setShowPassword((prev) => !prev)}
            className="
              absolute
              right-3
              top-1/2
              flex
              h-5
              w-5
              -translate-y-1/2
              items-center
              justify-center
              text-gray-400
              hover:text-gray-600
            "
          >
            {showPassword ? (
              <EyeSlashIcon className="h-5 w-5" />
            ) : (
              <EyeIcon className="h-5 w-5" />
            )}
          </button>

          {passwordError && (
            <p className="mt-1 text-xs text-red-500">{passwordError}</p>
          )}
        </div>

        <label
          className="
            flex
            w-full
            cursor-pointer
            items-center
            gap-2
            text-sm
          "
        >
          <input
            type="checkbox"
            disabled={busy}
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
            className="h-4 w-4 shrink-0"
          />

          <span>จดจำฉันไว้ในระบบ</span>
        </label>

        <button
          type="submit"
          disabled={busy}
          className="
            form-button
            flex
            min-h-11
            items-center
            justify-center
            gap-2
            w-full
            tracking-wide
          "
        >
          {busy && (
            <span
              aria-hidden="true"
              className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white motion-reduce:animate-none"
            />
          )}
          {status === "checking"
            ? "กำลังตรวจสอบบัญชี..."
            : status === "redirecting"
              ? "กำลังเปิดหน้าระบบ..."
              : "เข้าสู่ระบบ"}
        </button>

        <div
          role="status"
          aria-live="polite"
          aria-atomic="true"
          className={busy ? "" : "sr-only"}
        >
          {status === "checking" && (
            <p className="text-sm text-gray-500">
              {slow
                ? "ระบบกำลังตอบกลับ กรุณารอสักครู่ ยังไม่ทราบผลการตรวจสอบบัญชี"
                : "กำลังตรวจสอบชื่อผู้ใช้และรหัสผ่าน"}
            </p>
          )}
          {status === "redirecting" && (
            <p className="text-sm text-blue-600">
              เข้าสู่ระบบสำเร็จ กำลังเปิดหน้าระบบ...
            </p>
          )}
        </div>
        {status === "redirecting" && slow && (
          <a href={destination} className="text-sm text-blue-600 underline">
            หากหน้ายังไม่เปลี่ยน คลิกเพื่อเปิดหน้าระบบ
          </a>
        )}
        {loginError && (
          <p
            role="alert"
            className="rounded-lg border border-red-200 px-3 py-2 text-sm text-red-600"
          >
            {loginError}
          </p>
        )}

        <Link
          href="/forgot-password"
          className="
            text-sm
            text-zinc-500
            hover:underline
          "
        >
          ลืมรหัสผ่าน?
        </Link>

        <p className="text-sm leading-relaxed text-zinc-500">
          หากยังไม่มีบัญชี กรุณาติดต่ออาจารย์เพื่อเพิ่มผู้ใช้ในระบบ
        </p>
      </form>
    </div>
  );
}

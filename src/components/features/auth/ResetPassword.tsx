"use client";

import { authApi } from "@/services/api/auth";
import { useState } from "react";
import Link from "next/link";
import { CheckCircleIcon } from "@heroicons/react/24/outline";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/solid";

type Props = {
  email: string;
  otp: string;
  onRestart: () => void;
};

export default function ResetPassword({ email, otp, onRestart }: Props) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const mismatch = confirm.length > 0 && password !== confirm;
  const isValid = password.length >= 8 && password === confirm;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isValid || loading) return;
    setLoading(true);
    setError("");
    try {
      const response = await authApi.resetPassword({
        identifier: email,
        otp,
        newPassword: password,
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        setError(data.message || "เปลี่ยนรหัสผ่านไม่สำเร็จ กรุณาลองอีกครั้ง");
        return;
      }
      setPassword("");
      setConfirm("");
      setSuccess(true);
    } catch {
      setError("เชื่อมต่อระบบไม่ได้ กรุณาลองอีกครั้ง");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="space-y-5 text-center" role="status">
        <CheckCircleIcon
          className="mx-auto h-12 w-12 text-blue-600"
          aria-hidden="true"
        />
        <div>
          <h1 className="text-xl font-semibold text-gray-800">
            ตั้งรหัสผ่านใหม่สำเร็จ
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            คุณสามารถเข้าสู่ระบบด้วยรหัสผ่านใหม่ได้แล้ว
          </p>
        </div>
        <Link
          href="/login"
          className="form-button flex min-h-11 items-center justify-center text-sm font-medium"
        >
          กลับเข้าสู่ระบบ
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" aria-busy={loading}>
      <div>
        <h1 className="text-xl font-semibold text-gray-800">
          ตั้งรหัสผ่านใหม่
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-gray-500">
          เลือกรหัสผ่านใหม่สำหรับบัญชีของคุณ
        </p>
      </div>
      <div>
        <label
          htmlFor="recovery-password"
          className="mb-2 block text-sm font-medium text-gray-700"
        >
          รหัสผ่านใหม่
        </label>
        <div className="relative">
          <input
            id="recovery-password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            autoFocus
            required
            minLength={8}
            disabled={loading}
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
              setError("");
            }}
            aria-describedby="recovery-password-hint"
            className="form-input text-sm"
            style={{ paddingRight: "3rem" }}
            placeholder="อย่างน้อย 8 ตัวอักษร"
          />
          <button
            type="button"
            aria-label={showPassword ? "ซ่อนรหัสผ่านใหม่" : "แสดงรหัสผ่านใหม่"}
            aria-pressed={showPassword}
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 flex w-11 cursor-pointer items-center justify-center rounded-r-lg text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
          >
            {showPassword ? (
              <EyeSlashIcon className="h-5 w-5" />
            ) : (
              <EyeIcon className="h-5 w-5" />
            )}
          </button>
        </div>
        <p id="recovery-password-hint" className="mt-2 text-xs text-gray-500">
          ใช้รหัสผ่านอย่างน้อย 8 ตัวอักษร
        </p>
      </div>
      <div>
        <label
          htmlFor="recovery-confirm"
          className="mb-2 block text-sm font-medium text-gray-700"
        >
          ยืนยันรหัสผ่านใหม่
        </label>
        <div className="relative">
          <input
            id="recovery-confirm"
            type={showConfirm ? "text" : "password"}
            autoComplete="new-password"
            required
            minLength={8}
            disabled={loading}
            value={confirm}
            onChange={(event) => {
              setConfirm(event.target.value);
              setError("");
            }}
            aria-invalid={mismatch}
            aria-describedby={mismatch ? "recovery-confirm-error" : undefined}
            className="form-input text-sm"
            style={{ paddingRight: "3rem" }}
            placeholder="กรอกรหัสผ่านใหม่อีกครั้ง"
          />
          <button
            type="button"
            aria-label={
              showConfirm ? "ซ่อนการยืนยันรหัสผ่าน" : "แสดงการยืนยันรหัสผ่าน"
            }
            aria-pressed={showConfirm}
            onClick={() => setShowConfirm(!showConfirm)}
            className="absolute inset-y-0 right-0 flex w-11 cursor-pointer items-center justify-center rounded-r-lg text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
          >
            {showConfirm ? (
              <EyeSlashIcon className="h-5 w-5" />
            ) : (
              <EyeIcon className="h-5 w-5" />
            )}
          </button>
        </div>
        {mismatch && (
          <p id="recovery-confirm-error" className="mt-2 text-xs text-red-500">
            รหัสผ่านทั้งสองช่องไม่ตรงกัน
          </p>
        )}
      </div>
      {error && (
        <div className="space-y-2">
          <p role="alert" className="text-sm text-red-500">
            {error}
          </p>
          <button
            type="button"
            onClick={onRestart}
            disabled={loading}
            className="cursor-pointer rounded text-sm text-blue-600 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 disabled:opacity-50"
          >
            เริ่มใหม่เพื่อขอรหัส OTP
          </button>
        </div>
      )}
      <button
        type="submit"
        disabled={!isValid || loading}
        className="form-button min-h-11 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2"
      >
        {loading ? "กำลังบันทึก..." : "บันทึกรหัสผ่านใหม่"}
      </button>
    </form>
  );
}

"use client";

import { authApi } from "@/services/api/auth";
import { useState } from "react";

type Props = {
  initialEmail: string;
  onNext: (email: string) => void;
};

export default function ForgotPassword({ initialEmail, onNext }: Props) {
  const [email, setEmail] = useState(initialEmail);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const normalizedEmail = email.trim().toLowerCase();
  const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail);
  const alreadySent = normalizedEmail !== "" && normalizedEmail === initialEmail;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isValid || loading) return;
    if (alreadySent) {
      onNext(normalizedEmail);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const response = await authApi.sendOtp({ identifier: normalizedEmail });
      const data = await response.json();
      if (!response.ok || !data.success) {
        setError(data.message || "ส่งรหัส OTP ไม่สำเร็จ กรุณาลองอีกครั้ง");
        return;
      }
      onNext(normalizedEmail);
    } catch {
      setError("เชื่อมต่อระบบไม่ได้ กรุณาลองอีกครั้ง");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" aria-busy={loading}>
      <div>
        <h1 className="text-xl font-semibold text-gray-800">ลืมรหัสผ่าน?</h1>
        <p className="mt-2 text-sm leading-relaxed text-gray-500">กรอกอีเมลที่ใช้ในระบบ เพื่อรับรหัส OTP สำหรับตั้งรหัสผ่านใหม่</p>
      </div>
      <div>
        <label htmlFor="recovery-email" className="mb-2 block text-sm font-medium text-gray-700">อีเมล</label>
        <input
          id="recovery-email"
          type="email"
          autoComplete="email"
          autoFocus
          required
          disabled={loading}
          value={email}
          onChange={(event) => { setEmail(event.target.value); setError(""); }}
          aria-invalid={!!error}
          aria-describedby={error ? "recovery-email-error" : undefined}
          className="form-input text-sm"
          placeholder="name@example.com"
        />
        {error && <p id="recovery-email-error" role="alert" className="mt-2 text-xs text-red-500">{error}</p>}
      </div>
      <button type="submit" disabled={!isValid || loading} className="form-button min-h-11 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2">
        {loading ? "กำลังส่งรหัส OTP..." : alreadySent ? "กลับไปกรอกรหัส OTP" : "ส่งรหัส OTP"}
      </button>
      <p className="text-center text-xs leading-relaxed text-gray-500">หากจำอีเมลไม่ได้ กรุณาติดต่อผู้ดูแลระบบ</p>
    </form>
  );
}

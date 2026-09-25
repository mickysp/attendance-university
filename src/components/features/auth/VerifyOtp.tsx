"use client";
import { useLanguage } from "@/lib/language";


import { authApi } from "@/services/api/auth";
import { useState } from "react";

type Props = {
  email: string;
  onNext: (otp: string) => void;
  onBack: () => void;
};

export default function VerifyOtp({ email, onNext, onBack }: Props) {
  const { tr } = useLanguage();

  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [notice, setNotice] = useState("");
  const busy = loading || resending;
  const isValid = /^\d{6}$/.test(otp);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isValid || busy) return;
    setLoading(true);
    setError("");
    try {
      const response = await authApi.verifyOtp({ identifier: email, otp });
      const data = await response.json();
      if (!response.ok || !data.success) {
        setError(data.message || "ยืนยันรหัส OTP ไม่สำเร็จ กรุณาลองอีกครั้ง");
        return;
      }
      onNext(otp);
    } catch {
      setError("เชื่อมต่อระบบไม่ได้ กรุณาลองอีกครั้ง");
    } finally {
      setLoading(false);
    }
  }

  async function resendOtp() {
    if (busy) return;
    setResending(true);
    setError("");
    setNotice("");
    try {
      const response = await authApi.sendOtp({ identifier: email });
      const data = await response.json();
      if (!response.ok || !data.success) {
        setError(data.message || "ส่งรหัส OTP ไม่สำเร็จ กรุณาลองอีกครั้ง");
        return;
      }
      setOtp("");
      setNotice("หากอีเมลนี้มีบัญชีในระบบ คุณจะได้รับรหัส OTP ใหม่");
    } catch {
      setError("เชื่อมต่อระบบไม่ได้ กรุณาลองอีกครั้ง");
    } finally {
      setResending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" aria-busy={busy}>
      <div>
        <h1 className="text-xl font-semibold text-gray-800">{tr("ตรวจสอบอีเมลของคุณ")}</h1>
        <p className="mt-2 text-sm leading-relaxed text-gray-500">{tr("หากอีเมลนี้มีบัญชีในระบบ คุณจะได้รับรหัส OTP ที่")}<span className="mt-1 block break-all font-medium text-gray-700">
            {email}
          </span>
        </p>
      </div>
      <div>
        <label
          htmlFor="recovery-otp"
          className="mb-2 block text-sm font-medium text-gray-700"
        >{tr("รหัส OTP 6 หลัก")}</label>
        <input
          id="recovery-otp"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          autoFocus
          required
          pattern="[0-9]{6}"
          maxLength={6}
          disabled={busy}
          value={otp}
          onChange={(event) => {
            setOtp(event.target.value.replace(/\D/g, ""));
            setError("");
          }}
          aria-invalid={!!error}
          aria-describedby={
            error ? "recovery-otp-hint recovery-otp-error" : "recovery-otp-hint"
          }
          className="form-input text-center text-xl tracking-[0.35em]"
          placeholder="000000"
        />
        <p id="recovery-otp-hint" className="mt-2 text-xs text-gray-500">{tr("รหัสมีอายุ 10 นาที กรุณาตรวจสอบในอีเมลขยะด้วย")}</p>
        {error && (
          <p
            id="recovery-otp-error"
            role="alert"
            className="mt-2 text-xs text-red-500"
          >
            {tr(error)}
          </p>
        )}
      </div>
      {notice && (
        <p role="status" className="text-xs text-blue-600">
          {tr(notice)}
        </p>
      )}
      <button
        type="submit"
        disabled={!isValid || busy}
        className="form-button min-h-11 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2"
      >
        {loading ? tr("กำลังตรวจสอบ...") : tr("ยืนยันรหัส OTP")}
      </button>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          disabled={busy}
          className="cursor-pointer rounded text-sm text-gray-500 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 disabled:cursor-not-allowed disabled:opacity-50"
        >{tr("เปลี่ยนอีเมล")}</button>
        <button
          type="button"
          onClick={() => void resendOtp()}
          disabled={busy}
          className="cursor-pointer rounded text-sm text-blue-600 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {resending ? tr("กำลังส่ง...") : tr("ขอรหัสใหม่หลังครบ 10 นาที")}
        </button>
      </div>
    </form>
  );
}

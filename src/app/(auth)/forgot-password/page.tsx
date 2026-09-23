"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeftIcon, CheckIcon } from "@heroicons/react/24/outline";
import ForgotPassword from "@/components/features/auth/ForgotPassword";
import VerifyOtp from "@/components/features/auth/VerifyOtp";
import ResetPassword from "@/components/features/auth/ResetPassword";

const steps = ["อีเมล", "ยืนยัน OTP", "รหัสผ่านใหม่"];

export default function ForgotPasswordPage() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");

  return (
    <div className="mx-auto w-full max-w-[448px] rounded-xl bg-white p-5 shadow-xl sm:p-6 md:p-8">
      <Link
        href="/login"
        className="inline-flex items-center gap-2 rounded text-sm text-gray-500 transition hover:text-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
      >
        <ArrowLeftIcon className="h-4 w-4" aria-hidden="true" />
        กลับเข้าสู่ระบบ
      </Link>

      <ol
        aria-label="ขั้นตอนการตั้งรหัสผ่านใหม่"
        className="my-7 grid grid-cols-3"
      >
        {steps.map((label, index) => {
          const current = step === index + 1;
          const complete = step > index + 1;
          return (
            <li
              key={label}
              aria-current={current ? "step" : undefined}
              className="relative flex flex-col items-center gap-2 text-center"
            >
              {index < steps.length - 1 && (
                <span
                  aria-hidden="true"
                  className={`pointer-events-none absolute left-[calc(50%+1.5rem)] top-4 w-[calc(100%-3rem)] border-t transition-colors motion-reduce:transition-none ${complete ? "border-blue-500" : "border-gray-200"}`}
                />
              )}
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${current ? "bg-[var(--primary)] text-white" : complete ? "bg-blue-50 text-blue-600" : "bg-gray-100 text-gray-500"}`}
              >
                {complete ? (
                  <CheckIcon className="h-4 w-4" aria-hidden="true" />
                ) : (
                  index + 1
                )}
                {complete && <span className="sr-only">เสร็จแล้ว</span>}
              </span>
              <span
                className={`text-xs ${current ? "font-medium text-blue-600" : "text-gray-500"}`}
              >
                {label}
              </span>
            </li>
          );
        })}
      </ol>

      {step === 1 && (
        <ForgotPassword
          initialEmail={email}
          onNext={(emailValue) => {
            setEmail(emailValue);
            setOtp("");
            setStep(2);
          }}
        />
      )}
      {step === 2 && (
        <VerifyOtp
          email={email}
          onNext={(otpValue) => {
            setOtp(otpValue);
            setStep(3);
          }}
          onBack={() => setStep(1)}
        />
      )}
      {step === 3 && (
        <ResetPassword
          email={email}
          otp={otp}
          onRestart={() => {
            setEmail("");
            setOtp("");
            setStep(1);
          }}
        />
      )}
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const hasData = false;

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-blue-50">
      <div
        className="
          relative
          flex-1
          min-h-0
          overflow-y-auto
          p-6
          pt-[80px]
          font-noto
          lg:overflow-hidden
          lg:pt-6
        "
      >
        {loading && (
          <div
            className="
              absolute
              inset-0
              z-10
              flex
              items-center
              justify-center
              bg-gray-300
            "
          >
            <div className="flex flex-col items-center gap-4">
              <div
                className="
                  h-14
                  w-14
                  animate-spin
                  rounded-full
                  border-4
                  border-white
                  border-t-transparent
                "
              />

              <p className="text-base text-white">กำลังโหลด...</p>
            </div>
          </div>
        )}

        {!loading && !hasData && (
          <div
            className="
              flex
              min-h-[calc(100vh-104px)]
              flex-col
              rounded-2xl
              bg-white
              overflow-hidden

              lg:h-full
              lg:min-h-0
            "
          >
            <div
              className="
                shrink-0
                px-6
                pt-6
                pb-4
              "
            >
              <h1 className="text-[26px] font-semibold text-gray-800">
                Dashboard
              </h1>

              <p className="mt-1 text-sm text-gray-400">
                แสดงรายชื่อการเข้าเรียนของนักศึกษาในแต่ละวิชา
              </p>
            </div>

            <div
              className="
                min-h-[500px]
                flex-1
                px-6
                pb-6

                lg:min-h-0
                lg:overflow-y-auto
              "
            >
              <div className="flex min-h-[500px] flex-col items-center justify-center text-center">
                <div
                  className="
                    mb-4
                    flex
                    h-28
                    w-28
                    items-center
                    justify-center
                    rounded-full
                    bg-gray-100
                  "
                >
                  <img
                    src="/not-exist.png"
                    alt="ไม่มีข้อมูล"
                    className="h-28 w-28"
                  />
                </div>

                <p className="text-sm text-gray-400">ยังไม่มีข้อมูลนักศึกษา</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

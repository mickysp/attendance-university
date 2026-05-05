"use client";

import { useSearchParams, useRouter } from "next/navigation";
import QRCode from "react-qr-code";
import {
  ClipboardIcon,
  ArrowLeftIcon,
  ArrowsPointingOutIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { useAlert } from "@/context/AlertContext";
import { useEffect, useState } from "react";
import Sidebar from "@/components/layouts/Sidebar";
import { useConfirm } from "@/context/ConfirmContext";

type Teacher = {
  _id: string;
  name: string;
};

type ClassInfo = {
  className: string;
  classCode?: string;
  teacher?: Teacher;
};

export default function QRPage() {
  const searchParams = useSearchParams();
  const classId = searchParams.get("classId");
  const [classInfo, setClassInfo] = useState<ClassInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [openQR, setOpenQR] = useState(false);
  const [saving, setSaving] = useState(false);

  const { showConfirm } = useConfirm();
  const { showAlert } = useAlert();
  const router = useRouter();

  const [formConfig, setFormConfig] = useState({
    name: true,
    studentId: true,
    section: false,
    email: false,
    photo: false,
    location: false,
  });

  const [schedule, setSchedule] = useState({
    startTime: "",
    lateAfter: 15,
    allowCheckIn: true,
    isOpen: true,
  });

  useEffect(() => {
    const fetchSchedule = async () => {
      if (!classId) return;

      const res = await fetch(`/api/schedule?classId=${classId}`);
      const data = await res.json();

      if (data.success && data.schedule) {
        setSchedule({
          startTime: data.schedule.startTime || "",
          lateAfter: data.schedule.lateAfter ?? 15,
          allowCheckIn: data.schedule.allowCheckIn ?? true,
          isOpen: data.schedule.isOpen ?? true,
        });
      }
    };

    fetchSchedule();
  }, [classId]);

  const link =
    typeof window !== "undefined" && classId
      ? `${window.location.origin}/check-in?classId=${classId}`
      : "";

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const fetchClass = async () => {
      if (!classId) return;

      try {
        const res = await fetch(`/api/classes/${classId}`);
        const data = await res.json();

        if (data.success) {
          setClassInfo(data.data);
        }
      } catch {
        showAlert("โหลดข้อมูลวิชาไม่สำเร็จ", "error");
      }
    };

    fetchClass();
  }, [classId]);

  useEffect(() => {
    const fetchConfig = async () => {
      if (!classId) return;

      try {
        const res = await fetch(`/api/check-in?classId=${classId}`);
        const data = await res.json();

        if (data.success && data.config) {
          setFormConfig(data.config);
        }
      } catch {
        showAlert("โหลด config ไม่สำเร็จ", "error");
      }
    };

    fetchConfig();
  }, [classId]);

  const handleCopy = async () => {
    if (!link) return;
    await navigator.clipboard.writeText(link);
    showAlert("คัดลอกลิงก์แล้ว", "success");
  };

  const handleSaveSchedule = async () => {
    if (!classId) return;

    if (!schedule.startTime) {
      showAlert("กรุณาเลือกเวลาเริ่มเรียน", "error");
      return;
    }

    try {
      setSaving(true);

      const res = await fetch("/api/schedule", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          classId,
          startTime: schedule.startTime,
          lateAfter: schedule.lateAfter,
          allowCheckIn: schedule.allowCheckIn,
          isOpen: schedule.isOpen,
        }),
      });

      const data = await res.json();

      if (data.success) {
        showAlert("บันทึกเวลาเรียบร้อย", "success");
      } else {
        showAlert("บันทึกไม่สำเร็จ", "error");
      }
    } catch {
      showAlert("เกิดข้อผิดพลาด", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadQR = () => {
    const svg = document.querySelector(".qr-code svg");
    if (!svg) return;

    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svg);

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();

    const svgBlob = new Blob([svgString], {
      type: "image/svg+xml;charset=utf-8",
    });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      const size = 500;
      const padding = 30;
      canvas.width = size;
      canvas.height = size;

      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, size, size);

      ctx.drawImage(
        img,
        padding,
        padding,
        size - padding * 2,
        size - padding * 2,
      );

      URL.revokeObjectURL(url);

      const link = document.createElement("a");
      link.download = `เช็คชื่อวิชา ${classInfo?.className || "ไม่ทราบชื่อวิชา"}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    };

    img.src = url;
  };

  return (
    <div className="flex h-screen overflow-hidden bg-blue-50">
      <Sidebar />

      <div className="flex-1 overflow-y-auto p-6 font-noto relative">
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/80">
            <div className="flex flex-col items-center gap-4">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-500 border-t-transparent"></div>
              <p className="text-gray-600 text-sm">กำลังโหลด...</p>
            </div>
          </div>
        )}

        {!loading && (
          <div className="flex flex-col bg-white rounded-2xl px-6 pt-6 pb-8">
            <div className="mb-6 flex items-center gap-3">
              <button
                onClick={() => router.back()}
                className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-300 hover:bg-gray-100 transition cursor-pointer"
              >
                <ArrowLeftIcon className="w-4 h-4 text-gray-700" />
              </button>

              <h1 className="text-[26px] font-semibold text-gray-800">
                ข้อมูลแบบฟอร์มเช็คชื่อ
              </h1>

              <p className="text-sm text-gray-500">
                สำหรับให้นักศึกษาสแกนเข้าเรียน
              </p>
            </div>

            {!classId ? (
              <p className="text-gray-500 text-sm">ไม่พบรายวิชา</p>
            ) : (
              <>
                <div className="bg-blue-50 border border-gray-200 rounded-xl p-4 mb-4">
                  <p className="text-sm text-gray-500 mb-1">วิชา</p>
                  <h2 className="text-base font-semibold text-gray-800">
                    {classInfo?.className || "-"}
                  </h2>

                  <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-600">
                    <span>รหัสวิชา: {classInfo?.classCode || "-"}</span>
                    <span>
                      อาจารย์ประจำวิชา: {classInfo?.teacher?.name || "-"}
                    </span>
                  </div>
                </div>

                <div className="mt-6 bg-white border border-gray-200 rounded-2xl p-5 mb-8">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm text-gray-800">
                      ตั้งเวลาเช็คชื่อ
                    </h3>

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">เปิดใช้งาน</span>
                      <button
                        onClick={() =>
                          setSchedule((prev) => ({
                            ...prev,
                            allowCheckIn: !prev.allowCheckIn,
                          }))
                        }
                        className={`w-11 h-6 flex items-center rounded-full px-1 transition ${
                          schedule.allowCheckIn ? "bg-green-500" : "bg-gray-300"
                        }`}
                      >
                        <div
                          className={`w-4 h-4 bg-white rounded-full shadow transform transition ${
                            schedule.allowCheckIn
                              ? "translate-x-5"
                              : "translate-x-0"
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-end gap-4 flex-wrap">
                    <div className="flex flex-col">
                      <label className="text-xs text-gray-500 mb-1">
                        เวลาเริ่มเรียน
                      </label>
                      <input
                        type="time"
                        value={schedule.startTime}
                        onChange={(e) =>
                          setSchedule({
                            ...schedule,
                            startTime: e.target.value,
                          })
                        }
                        className="border border-gray-200 rounded-lg px-3 py-2 w-[250px] focus:outline-none focus:ring-2 focus:ring-blue-400"
                      />
                    </div>

                    <div className="flex flex-col">
                      <label className="text-xs text-gray-500 mb-1">
                        มาสายได้ภายใน
                      </label>

                      <div className="relative">
                        <input
                          type="number"
                          min={0}
                          max={120}
                          value={schedule.lateAfter}
                          onChange={(e) =>
                            setSchedule({
                              ...schedule,
                              lateAfter: Math.max(
                                0,
                                Math.min(120, Number(e.target.value)),
                              ),
                            })
                          }
                          className="border border-gray-200 rounded-lg px-3 py-2 pr-10 w-[250px] focus:outline-none focus:ring-2 focus:ring-blue-400"
                        />

                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                          นาที
                        </span>
                      </div>
                    </div>

                    <div className="flex items-end">
                      <button
                        disabled={saving}
                        onClick={handleSaveSchedule}
                        className="px-6 py-2.5 bg-blue-500 text-white rounded-lg text-sm shadow hover:bg-blue-600 transition disabled:opacity-50 cursor-pointer"
                      >
                        {saving ? "กำลังบันทึก..." : "บันทึก"}
                      </button>
                    </div>
                  </div>

                  {schedule.startTime && (
                    <div className="mt-4 text-xs text-gray-500">
                      เริ่ม: <b>{schedule.startTime}</b> | มาสายถึง:{" "}
                      <b className="text-yellow-600">
                        {(() => {
                          const [h, m] = schedule.startTime
                            .split(":")
                            .map(Number);
                          const date = new Date();
                          date.setHours(h);
                          date.setMinutes(m + schedule.lateAfter);
                          return date.toTimeString().slice(0, 5);
                        })()}
                      </b>
                    </div>
                  )}
                </div>

                <div className="flex flex-col h-full">
                  <div className="mb-6">
                    <label className="text-sm text-gray-700">
                      ลิงก์เช็คชื่อ
                    </label>

                    <div className="flex gap-2 mt-1">
                      <input
                        value={link}
                        readOnly
                        className="form-input-card flex-1 text-sm"
                      />

                      <button
                        onClick={handleCopy}
                        className="px-3 border rounded-md hover:bg-gray-100 cursor-pointer"
                      >
                        <ClipboardIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="flex-1 flex flex-col items-center justify-center gap-3">
                    <div
                      onClick={() => setOpenQR(true)}
                      className="qr-code relative p-5 border border-gray-300 rounded-2xl bg-white cursor-pointer"
                    >
                      <QRCode value={link || "loading"} size={350} />

                      <button
                        onClick={() => setOpenQR(true)}
                        className="absolute top-2 right-2 bg-white border border-gray-300 rounded-md p-1 hover:bg-gray-100 cursor-pointer"
                      >
                        <ArrowsPointingOutIcon className="w-4 h-4 text-gray-600" />
                      </button>
                    </div>

                    <p className="text-sm text-gray-500 text-center">
                      QR Code เช็คชื่อ
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {openQR && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 font-noto"
          onClick={() => setOpenQR(false)}
        >
          <div
            className="bg-white rounded-3xl shadow-xl w-full max-w-[800px] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 pt-4">
              <h2 className="text-lg font-semibold text-gray-800">
                QR Code เช็คชื่อ
              </h2>
              <button
                onClick={() => setOpenQR(false)}
                className="p-1 rounded-md hover:bg-gray-100 transition cursor-pointer"
              >
                <XMarkIcon className="w-6 h-6 text-gray-600" />
              </button>
            </div>

            <div className="p-8 flex flex-col items-center gap-6">
              <div className="border border-gray-300 p-4 rounded-xl">
                <QRCode value={link || "loading"} size={480} />
              </div>
              <button
                onClick={handleDownloadQR}
                className="px-6 py-2 rounded-xl border border-blue-400 text-blue-400 font-semibold hover:bg-blue-50 transition cursor-pointer"
              >
                บันทึก QR Code
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

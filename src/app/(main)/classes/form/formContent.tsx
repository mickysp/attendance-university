"use client";

import { useSearchParams, useRouter } from "next/navigation";
import QRCode from "react-qr-code";
import {
  ClipboardIcon,
  ArrowLeftIcon,
  ArrowsPointingOutIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";
import "react-datepicker/dist/react-datepicker.css";
import DatePicker from "react-datepicker";

import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";


const MySwal = withReactContent(Swal);

type Teacher = {
  _id: string;
  name: string;
};

type ClassInfo = {
  _id: string;
  className: string;
  classCodes: string[];
  teachers: Teacher[];
  description?: string;
  isOpened: boolean;
};

type Schedule = {
  date: Date;
  startTime: string;
  endTime: string;
  lateAfter: number;
  allowCheckIn: boolean;
  isOpen: boolean;
};

export default function QRPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const classId = searchParams.get("classId");

  const [classInfo, setClassInfo] = useState<ClassInfo | null>(null);

  const [loading, setLoading] = useState(true);
  const [openQR, setOpenQR] = useState(false);
  const [saving, setSaving] = useState(false);

  const [schedule, setSchedule] = useState<Schedule>({
    date: new Date(),
    startTime: "",
    endTime: "",
    lateAfter: 15,
    allowCheckIn: true,
    isOpen: true,
  });

  const link =
    typeof window !== "undefined" && classId
      ? `${window.location.origin}/check-in?classId=${classId}`
      : "";

  const formatThaiDate = (date: Date) => {
    const months = [
      "มกราคม",
      "กุมภาพันธ์",
      "มีนาคม",
      "เมษายน",
      "พฤษภาคม",
      "มิถุนายน",
      "กรกฎาคม",
      "สิงหาคม",
      "กันยายน",
      "ตุลาคม",
      "พฤศจิกายน",
      "ธันวาคม",
    ];

    return `${date.getDate()} ${months[date.getMonth()]} ${
      date.getFullYear() + 543
    }`;
  };

  // =========================================================
  // SWEETALERT
  // =========================================================

  const showSuccess = (message: string) => {
    MySwal.fire({
      icon: "success",
      title: message,
      confirmButtonText: "ตกลง",
      customClass: {
        popup: "app-swal-popup app-swal-popup-success",
        title: "app-swal-title-success",
        confirmButton: "app-swal-ok-btn",
      },
    });
  };

  const showError = (message: string) => {
    MySwal.fire({
      icon: "error",
      title: "เกิดข้อผิดพลาด",
      text: message,
      confirmButtonText: "ตกลง",
      customClass: {
        popup: "app-swal-popup",
        title: "app-swal-title",
        htmlContainer: "app-swal-text",
        confirmButton: "app-swal-ok-btn",
      },
    });
  };

  // =========================================================
  // FETCH CLASS
  // =========================================================

  useEffect(() => {
    const fetchClass = async () => {
      if (!classId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        const res = await fetch(`/api/classes/${classId}`, {
          method: "GET",
          cache: "no-store",
        });

        const data = await res.json();

        if (!res.ok || !data.success) {
          throw new Error(data.message || "โหลดข้อมูลวิชาไม่สำเร็จ");
        }

        const rawClass =
          data?.data?.class && typeof data.data.class === "object"
            ? data.data.class
            : data?.data;

        if (!rawClass || typeof rawClass !== "object") {
          throw new Error("รูปแบบข้อมูลรายวิชาไม่ถูกต้อง");
        }

        const classData = rawClass as Record<string, unknown>;

        const className =
          typeof classData.className === "string" ? classData.className : "";

        let classCodes: string[] = [];

        if (Array.isArray(classData.classCodes)) {
          classCodes = classData.classCodes
            .map((item: unknown): string => {
              if (typeof item === "string") {
                return item;
              }

              if (typeof item === "object" && item !== null) {
                const codeItem = item as Record<string, unknown>;

                if (typeof codeItem.code === "string") {
                  return codeItem.code;
                }
              }

              return "";
            })
            .filter((code: string) => code.trim() !== "");
        }

        if (classCodes.length === 0 && Array.isArray(classData.classCode)) {
          classCodes = classData.classCode
            .map((item: unknown): string => {
              if (typeof item === "string") {
                return item;
              }

              if (typeof item === "object" && item !== null) {
                const codeItem = item as Record<string, unknown>;

                return typeof codeItem.code === "string" ? codeItem.code : "";
              }

              return "";
            })
            .filter((code: string) => code.trim() !== "");
        }

        let teachers: Teacher[] = [];

        if (Array.isArray(classData.teachers)) {
          teachers = classData.teachers
            .filter(
              (item: unknown): item is Record<string, unknown> =>
                typeof item === "object" && item !== null,
            )
            .map(
              (teacher: Record<string, unknown>): Teacher => ({
                _id:
                  teacher._id !== undefined && teacher._id !== null
                    ? String(teacher._id)
                    : "",

                name: typeof teacher.name === "string" ? teacher.name : "",
              }),
            )
            .filter((teacher: Teacher) => teacher.name.trim() !== "");
        }

        if (
          teachers.length === 0 &&
          classData.teacher &&
          typeof classData.teacher === "object" &&
          !Array.isArray(classData.teacher)
        ) {
          const teacherData = classData.teacher as Record<string, unknown>;

          const teacherName =
            typeof teacherData.name === "string" ? teacherData.name : "";

          if (teacherName.trim() !== "") {
            teachers = [
              {
                _id:
                  teacherData._id !== undefined && teacherData._id !== null
                    ? String(teacherData._id)
                    : "",

                name: teacherName,
              },
            ];
          }
        }

        if (teachers.length === 0 && Array.isArray(classData.teacher)) {
          teachers = classData.teacher
            .filter(
              (item: unknown): item is Record<string, unknown> =>
                typeof item === "object" && item !== null,
            )
            .map(
              (teacher: Record<string, unknown>): Teacher => ({
                _id:
                  teacher._id !== undefined && teacher._id !== null
                    ? String(teacher._id)
                    : "",

                name: typeof teacher.name === "string" ? teacher.name : "",
              }),
            )
            .filter((teacher: Teacher) => teacher.name.trim() !== "");
        }

        const description =
          typeof classData.description === "string"
            ? classData.description
            : "";

        const isOpened =
          typeof classData.isOpened === "boolean"
            ? classData.isOpened
            : typeof classData.isOpen === "boolean"
              ? classData.isOpen
              : false;

        const id =
          classData._id !== undefined && classData._id !== null
            ? String(classData._id)
            : classId;

        setClassInfo({
          _id: id,
          className,
          classCodes,
          teachers,
          description,
          isOpened,
        });
      } catch (error) {
        showError(
          error instanceof Error
            ? error.message
            : "โหลดข้อมูลวิชาไม่สำเร็จ",
        );

        setClassInfo(null);
      } finally {
        setLoading(false);
      }
    };

    fetchClass();
  }, [classId]);

  // =========================================================
  // FETCH SCHEDULE
  // =========================================================

  useEffect(() => {
    const fetchSchedule = async () => {
      if (!classId) {
        return;
      }

      try {
        const res = await fetch(`/api/schedule?classId=${classId}`, {
          method: "GET",
          cache: "no-store",
        });

        const data = await res.json();

        if (!res.ok || !data.success) {
          return;
        }

        let schedules: unknown[] = [];

        if (Array.isArray(data.data)) {
          schedules = data.data;
        } else if (data.data && typeof data.data === "object") {
          schedules = [data.data];
        }

        if (schedules.length === 0) {
          return;
        }

        const latest = schedules[schedules.length - 1];

        if (!latest || typeof latest !== "object") {
          return;
        }

        const scheduleData = latest as Record<string, unknown>;

        const parsedDate = scheduleData.date
          ? new Date(String(scheduleData.date))
          : new Date();

        const validDate = !Number.isNaN(parsedDate.getTime());

        setSchedule({
          date: validDate ? parsedDate : new Date(),

          startTime:
            typeof scheduleData.startTime === "string"
              ? scheduleData.startTime
              : "",

          endTime:
            typeof scheduleData.endTime === "string"
              ? scheduleData.endTime
              : typeof scheduleData.startTime === "string"
                ? scheduleData.startTime
                : "",

          lateAfter:
            typeof scheduleData.lateAfter === "number"
              ? scheduleData.lateAfter
              : 15,

          allowCheckIn:
            typeof scheduleData.allowCheckIn === "boolean"
              ? scheduleData.allowCheckIn
              : true,

          isOpen:
            typeof scheduleData.isOpen === "boolean"
              ? scheduleData.isOpen
              : true,
        });
      } catch (error) {
        // ไม่ต้องแสดง Alert เพราะ schedule เป็นข้อมูลเสริม
      }
    };

    fetchSchedule();
  }, [classId]);

  // =========================================================
  // SAVE SCHEDULE
  // =========================================================

  const handleSaveSchedule = async () => {
    if (!classId) {
      showError("ไม่พบรายวิชา");
      return;
    }

    if (!schedule.date) {
      showError("กรุณาเลือกวันที่");
      return;
    }

    if (!schedule.startTime) {
      showError("กรุณาเลือกเวลาเริ่มเรียน");
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
          className: classInfo?.className || "",
          date: schedule.date.toISOString().split("T")[0],
          startTime: schedule.startTime,
          endTime: schedule.endTime || schedule.startTime,
          lateAfter: schedule.lateAfter,
          allowCheckIn: schedule.allowCheckIn,
          isOpen: schedule.isOpen,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        showError(data.message || "บันทึกเวลาไม่สำเร็จ");
        return;
      }

      showSuccess("บันทึกเวลาเรียบร้อย");
    } catch (error) {
      showError("เกิดข้อผิดพลาดในการบันทึกเวลา");
    } finally {
      setSaving(false);
    }
  };

  // =========================================================
  // COPY LINK
  // =========================================================

  const handleCopy = async () => {
    if (!link) {
      showError("ไม่พบลิงก์เช็คชื่อ");
      return;
    }

    try {
      await navigator.clipboard.writeText(link);

      showSuccess("คัดลอกลิงก์แล้ว");
    } catch (error) {
      showError("ไม่สามารถคัดลอกลิงก์ได้");
    }
  };

  // =========================================================
  // DOWNLOAD QR
  // =========================================================

  const handleDownloadQR = () => {
    const svg = document.querySelector(".qr-code svg");

    if (!svg) {
      showError("ไม่พบ QR Code");
      return;
    }

    const serializer = new XMLSerializer();

    const svgString = serializer.serializeToString(svg);

    const canvas = document.createElement("canvas");

    const ctx = canvas.getContext("2d");

    if (!ctx) {
      showError("ไม่สามารถสร้างรูป QR Code ได้");
      return;
    }

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

      const downloadLink = document.createElement("a");

      downloadLink.download = `เช็คชื่อวิชา ${
        classInfo?.className || "ไม่ทราบชื่อวิชา"
      }.png`;

      downloadLink.href = canvas.toDataURL("image/png");

      downloadLink.click();
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);

      showError("ไม่สามารถสร้าง QR Code ได้");
    };

    img.src = url;
  };

  // =========================================================
  // LATE TIME
  // =========================================================

  const getLateTime = () => {
    if (!schedule.startTime) {
      return "";
    }

    const [hours, minutes] = schedule.startTime.split(":").map(Number);

    if (Number.isNaN(hours) || Number.isNaN(minutes)) {
      return "";
    }

    const date = new Date();

    date.setHours(hours);
    date.setMinutes(minutes + schedule.lateAfter);

    return date.toTimeString().slice(0, 5);
  };

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="flex h-screen overflow-hidden bg-blue-50">
      <div className="min-h-0 flex-1 overflow-y-auto p-6 pt-[80px] font-noto lg:pt-6">
        {loading && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-gray-300/80 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-4">
              <div className="h-14 w-14 animate-spin rounded-full border-4 border-white border-t-transparent" />

              <p className="text-base font-medium text-white">
                กำลังโหลด...
              </p>
            </div>
          </div>
        )}

        {!loading && (
          <div className="flex flex-col rounded-2xl bg-white px-6 pb-8 pt-6">
            {/* HEADER */}
            <div className="mb-6 flex items-center gap-3">
              <button
                type="button"
                onClick={() => router.back()}
                className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-gray-300 transition hover:bg-gray-100"
              >
                <ArrowLeftIcon className="h-3 w-3 text-gray-700" />
              </button>

              <div>
                <h1 className="text-[26px] font-semibold text-gray-800">
                  ข้อมูลแบบฟอร์มเช็คชื่อ
                </h1>

                <p className="text-sm text-gray-500">
                  สำหรับให้นักศึกษาสแกนเข้าเรียน
                </p>
              </div>
            </div>

            {!classId ? (
              <p className="text-sm text-gray-500">ไม่พบรายวิชา</p>
            ) : !classInfo ? (
              <p className="text-sm text-gray-500">
                ไม่พบข้อมูลรายวิชา
              </p>
            ) : (
              <>
                {/* CLASS INFO */}
                <div className="mb-4 rounded-xl border border-gray-200 bg-blue-50 p-4">
                  <p className="mb-1 text-sm text-gray-500">วิชา</p>

                  <h2 className="text-base font-semibold text-gray-800">
                    {classInfo.className || "-"}
                  </h2>

                  <div className="mt-3 flex flex-col gap-3 text-sm text-gray-600">
                    <div>
                      <span className="text-gray-500">
                        อาจารย์ผู้สอน:
                      </span>{" "}
                      {classInfo.teachers.length > 0 ? (
                        <span className="font-medium text-gray-700">
                          {classInfo.teachers
                            .map((teacher) => teacher.name)
                            .filter(Boolean)
                            .join(", ") || "-"}
                        </span>
                      ) : (
                        <span className="font-medium text-gray-700">
                          -
                        </span>
                      )}
                    </div>

                    <div>
                      <span className="text-gray-500">รหัสวิชา:</span>

                      {classInfo.classCodes.length > 0 ? (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {classInfo.classCodes.map((code, index) => (
                            <span
                              key={`${code}-${index}`}
                              className="rounded-lg border border-blue-100 bg-white px-3 py-2 font-medium text-gray-700"
                            >
                              {code || "-"}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="ml-2">-</span>
                      )}
                    </div>

                    {classInfo.description && (
                      <div>
                        <span className="text-gray-500">
                          รายละเอียด:
                        </span>{" "}
                        <span className="text-gray-700">
                          {classInfo.description}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* SCHEDULE */}
                <div className="mb-8 mt-6 rounded-2xl border border-gray-200 bg-white p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-sm text-gray-800">
                      ตั้งเวลาเช็คชื่อ
                    </h3>
                  </div>

                  <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end">
                    {/* DATE */}
                    <div className="flex w-full flex-col sm:w-auto">
                      <label className="mb-1 text-xs text-gray-500">
                        วันที่
                      </label>

                      <DatePicker
                        selected={schedule.date}
                        onChange={(date: Date | null) =>
                          setSchedule((prev) => ({
                            ...prev,
                            date: date || new Date(),
                          }))
                        }
                        dateFormat="dd/MM/yyyy"
                        value={
                          schedule.date
                            ? formatThaiDate(schedule.date)
                            : ""
                        }
                        className="h-[46px] w-full rounded-xl border border-gray-200 bg-white px-4 text-left text-sm text-gray-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400 sm:w-[250px]"
                        calendarClassName="rounded-2xl border border-gray-200 overflow-hidden"
                        popperClassName="z-50"
                      />
                    </div>

                    {/* START TIME */}
                    <div className="flex w-full flex-col sm:w-auto">
                      <label className="mb-1 text-xs text-gray-500">
                        เวลาเริ่มเรียน
                      </label>

                      <input
                        type="time"
                        value={schedule.startTime}
                        onChange={(e) =>
                          setSchedule((prev) => ({
                            ...prev,
                            startTime: e.target.value,
                          }))
                        }
                        className="h-[46px] w-full rounded-lg border border-gray-200 px-3 py-2 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400 sm:w-[250px]"
                      />
                    </div>

                    {/* END TIME */}
                    <div className="flex w-full flex-col sm:w-auto">
                      <label className="mb-1 text-xs text-gray-500">
                        เวลาเลิกเรียน
                      </label>

                      <input
                        type="time"
                        value={schedule.endTime}
                        onChange={(e) =>
                          setSchedule((prev) => ({
                            ...prev,
                            endTime: e.target.value,
                          }))
                        }
                        className="h-[46px] w-full rounded-lg border border-gray-200 px-3 py-2 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400 sm:w-[250px]"
                      />
                    </div>

                    {/* LATE */}
                    <div className="flex w-full flex-col sm:w-auto">
                      <label className="mb-1 text-xs text-gray-500">
                        มาสายได้ภายใน
                      </label>

                      <div className="relative w-full sm:w-[250px]">
                        <input
                          type="number"
                          min={0}
                          max={120}
                          value={schedule.lateAfter}
                          onChange={(e) => {
                            const value = Number(e.target.value);

                            setSchedule((prev) => ({
                              ...prev,
                              lateAfter: Number.isNaN(value)
                                ? 0
                                : Math.max(
                                    0,
                                    Math.min(120, value),
                                  ),
                            }));
                          }}
                          className="h-[46px] w-full rounded-lg border border-gray-200 px-3 py-2 pr-10 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
                        />

                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                          นาที
                        </span>
                      </div>
                    </div>

                    {/* SAVE */}
                    <div className="flex w-full sm:w-auto">
                      <button
                        type="button"
                        disabled={saving}
                        onClick={handleSaveSchedule}
                        className="h-[46px] w-full cursor-pointer rounded-lg bg-blue-500 px-6 py-2.5 text-sm text-white shadow transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                      >
                        {saving ? "กำลังบันทึก..." : "บันทึก"}
                      </button>
                    </div>
                  </div>

                  {schedule.startTime && (
                    <div className="mt-4 text-xs text-gray-500">
                      เริ่ม: <b>{schedule.startTime}</b>
                      {" | "}
                      มาสายถึง:{" "}
                      <b className="text-yellow-600">
                        {getLateTime()}
                      </b>
                    </div>
                  )}
                </div>

                {/* LINK */}
                <div className="flex h-full flex-col">
                  <div className="mb-6">
                    <label className="text-sm text-gray-700">
                      ลิงก์เช็คชื่อ
                    </label>

                    <div className="mt-1 flex gap-2">
                      <input
                        value={link}
                        readOnly
                        className="form-input-card flex-1 text-sm"
                      />

                      <button
                        type="button"
                        onClick={handleCopy}
                        className="cursor-pointer rounded-md border px-3 hover:bg-gray-100"
                      >
                        <ClipboardIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* QR CODE */}
                  <div className="flex flex-1 flex-col items-center justify-center gap-3">
                    <div className="qr-code relative w-full max-w-[390px] rounded-2xl border border-gray-300 bg-white p-3 sm:p-5">
                      <QRCode
                        value={link || "loading"}
                        size={350}
                        className="h-auto w-full"
                      />

                      <button
                        type="button"
                        aria-label="ขยาย QR Code"
                        onClick={() => setOpenQR(true)}
                        className="absolute right-2 top-2 cursor-pointer rounded-md border border-gray-300 bg-white p-1 hover:bg-gray-100"
                      >
                        <ArrowsPointingOutIcon className="h-4 w-4 text-gray-600" />
                      </button>
                    </div>

                    <p className="text-center text-sm text-gray-500">
                      QR Code เช็คชื่อ
                    </p>

                    <button
                      type="button"
                      onClick={() => setOpenQR(true)}
                      className="cursor-pointer text-sm text-blue-500 hover:underline"
                    >
                      คลิกเพื่อขยาย QR Code
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* =========================================================
          QR MODAL
      ========================================================= */}

      {openQR && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 font-noto sm:p-6">
          <div className="max-h-[95vh] w-full max-w-[800px] overflow-y-auto rounded-2xl bg-white shadow-xl sm:rounded-3xl">
            <div className="flex items-center justify-between px-4 pt-4 sm:px-6 sm:pt-5">
              <h2 className="text-base font-semibold text-gray-800 sm:text-lg">
                QR Code เช็คชื่อ
              </h2>

              <button
                type="button"
                onClick={() => setOpenQR(false)}
                className="cursor-pointer rounded-md p-1 transition hover:bg-gray-100"
              >
                <XMarkIcon className="h-5 w-5 text-gray-600 sm:h-6 sm:w-6" />
              </button>
            </div>

            <div className="flex flex-col items-center gap-5 p-4 sm:gap-6 sm:p-8">
              <div className="w-full max-w-[480px] rounded-xl border border-gray-300 bg-white p-3 sm:p-4">
                <QRCode
                  value={link || "loading"}
                  size={480}
                  className="h-auto w-full"
                />
              </div>

              <button
                type="button"
                onClick={handleDownloadQR}
                className="cursor-pointer rounded-xl border border-blue-400 px-5 py-2 text-sm font-semibold text-blue-400 transition hover:bg-blue-50 sm:px-6 sm:py-2"
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

"use client";

import { classesApi } from "@/services/api/classes";
import { scheduleApi } from "@/services/api/schedule";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeftIcon,
  ArrowsPointingOutIcon,
  ClipboardIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import DatePicker from "react-datepicker";
import QRCode from "react-qr-code";
import { appSwal } from "@/lib/swal";
import {
  formatCalendarDate,
  getBangkokDateKey,
  getScheduleDateError,
  getScheduleFormDate,
  parseCalendarDate,
  selectScheduleForForm,
} from "@/lib/schedule-date";
import type { Teacher } from "@/types/teachers";
import type { ClassDetails } from "@/types/classes";
import type { ScheduleFormState } from "@/types/schedule";

import "react-datepicker/dist/react-datepicker.css";

const THAI_MONTHS = [
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

function getClassCodes(classData: Record<string, unknown>): string[] {
  const source = Array.isArray(classData.classCodes)
    ? classData.classCodes
    : Array.isArray(classData.classCode)
      ? classData.classCode
      : [];

  return source
    .map((item): string => {
      if (typeof item === "string") {
        return item.trim();
      }

      if (typeof item === "object" && item !== null) {
        const code = (item as Record<string, unknown>).code;
        return typeof code === "string" ? code.trim() : "";
      }

      return "";
    })
    .filter(Boolean);
}

function parseTeacher(item: unknown): Teacher | null {
  if (typeof item !== "object" || item === null) {
    return null;
  }

  const teacher = item as Record<string, unknown>;
  const name = typeof teacher.name === "string" ? teacher.name.trim() : "";

  if (!name) {
    return null;
  }

  return {
    _id:
      teacher._id !== undefined && teacher._id !== null
        ? String(teacher._id)
        : "",
    name,
  };
}

function getTeachers(classData: Record<string, unknown>): Teacher[] {
  const source = classData.teachers ?? classData.teacher;

  if (Array.isArray(source)) {
    return source
      .map(parseTeacher)
      .filter((teacher): teacher is Teacher => teacher !== null);
  }

  const teacher = parseTeacher(source);
  return teacher ? [teacher] : [];
}

export default function QRPage({ classId }: { classId: string | null }) {
  const router = useRouter();

  const qrDialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const [classInfo, setClassInfo] = useState<ClassDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [openQR, setOpenQR] = useState(false);
  const [saving, setSaving] = useState(false);
  const [scheduleLoading, setScheduleLoading] = useState(true);
  const [today, setToday] = useState(() => getBangkokDateKey());
  const [dateReset, setDateReset] = useState(false);

  const [schedule, setSchedule] = useState<ScheduleFormState>({
    date: getScheduleFormDate(undefined).date,
    startTime: "",
    endTime: "",
    lateAfter: 15,
    allowCheckIn: true,
    isOpen: true,
  });

  const link =
    typeof window !== "undefined" && classId
      ? `${window.location.origin}/checkin/${encodeURIComponent(classId)}`
      : "";

  const bounceQRDialog = useCallback(() => {
    const dialog = qrDialogRef.current;

    if (!dialog) return;

    dialog.classList.remove("app-dialog-attention");

    void dialog.offsetWidth;

    dialog.classList.add("app-dialog-attention");
  }, []);

  const showSuccess = useCallback((message: string) => {
    void appSwal.success({
      title: message,
    });
  }, []);

  const showError = useCallback((message: string) => {
    void appSwal.error(message);
  }, []);

  const formatThaiDate = (date: Date) => {
    return `${date.getDate()} ${THAI_MONTHS[date.getMonth()]} ${
      date.getFullYear() + 543
    }`;
  };

  useEffect(() => {
    const fetchClass = async () => {
      if (!classId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        const response = await classesApi.get(classId, { cache: "no-store" });

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.message || "โหลดข้อมูลรายวิชาไม่สำเร็จ");
        }

        const rawClass =
          result?.data?.class && typeof result.data.class === "object"
            ? result.data.class
            : result?.data;

        if (!rawClass || typeof rawClass !== "object") {
          throw new Error("รูปแบบข้อมูลรายวิชาไม่ถูกต้อง");
        }

        const classData = rawClass as Record<string, unknown>;

        setClassInfo({
          _id:
            classData._id !== undefined && classData._id !== null
              ? String(classData._id)
              : classId,
          className:
            typeof classData.className === "string" ? classData.className : "",
          classCodes: getClassCodes(classData),
          teachers: getTeachers(classData),
          description:
            typeof classData.description === "string"
              ? classData.description
              : "",
          isOpened:
            typeof classData.isOpened === "boolean"
              ? classData.isOpened
              : typeof classData.isOpen === "boolean"
                ? classData.isOpen
                : false,
        });
      } catch (error) {
        showError(
          error instanceof Error ? error.message : "โหลดข้อมูลรายวิชาไม่สำเร็จ",
        );

        setClassInfo(null);
      } finally {
        setLoading(false);
      }
    };

    void fetchClass();
  }, [classId, showError]);

  useEffect(() => {
    let midnightTimer: ReturnType<typeof setTimeout>;
    const updateToday = () => {
      setToday(getBangkokDateKey());
      clearTimeout(midnightTimer);
      const nextMidnight = Date.parse(`${getBangkokDateKey()}T00:00:00+07:00`) + 86_400_000;
      midnightTimer = setTimeout(updateToday, Math.max(1, nextMidnight - Date.now() + 100));
    };
    updateToday();
    window.addEventListener("focus", updateToday);
    document.addEventListener("visibilitychange", updateToday);
    return () => {
      clearTimeout(midnightTimer);
      window.removeEventListener("focus", updateToday);
      document.removeEventListener("visibilitychange", updateToday);
    };
  }, []);

  useEffect(() => {
    if (formatCalendarDate(schedule.date) < today) {
      setSchedule((previous) => ({
        ...previous,
        date: parseCalendarDate(today)!,
        allowCheckIn: true,
        isOpen: true,
      }));
      setDateReset(true);
    }
  }, [today, schedule.date]);

  useEffect(() => {
    const controller = new AbortController();
    const fetchSchedule = async () => {
      if (!classId) {
        setScheduleLoading(false);
        return;
      }

      try {
        setScheduleLoading(true);
        setDateReset(false);
        const response = await scheduleApi.get(classId, {
          cache: "no-store",
          signal: controller.signal,
        });

        const result = await response.json();

        if (!response.ok || !result.success) return;

        const schedules: unknown[] = Array.isArray(result.data)
          ? result.data
          : result.data && typeof result.data === "object"
            ? [result.data]
            : [];

        if (controller.signal.aborted) return;
        const scheduleData = selectScheduleForForm(schedules);

        if (!scheduleData) return;
        const formDate = getScheduleFormDate(scheduleData.date);
        setDateReset(formDate.reset);

        setSchedule({
          date: formDate.date,
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
            !formDate.reset && typeof scheduleData.allowCheckIn === "boolean"
              ? scheduleData.allowCheckIn
              : true,
          isOpen:
            !formDate.reset && typeof scheduleData.isOpen === "boolean"
              ? scheduleData.isOpen
              : true,
        });
      } catch {
        //
      } finally {
        if (!controller.signal.aborted) setScheduleLoading(false);
      }
    };

    void fetchSchedule();
    return () => controller.abort();
  }, [classId]);

  useEffect(() => {
    if (!openQR) return;

    const previousOverflow = document.body.style.overflow;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        bounceQRDialog();
      }

      if (event.key === "Tab") {
        event.preventDefault();
        closeButtonRef.current?.focus();
      }
    };

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);
    closeButtonRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [openQR, bounceQRDialog]);

  const handleSaveSchedule = async () => {
    if (!classId) {
      showError("ไม่พบรายวิชา");
      return;
    }

    if (!schedule.date) {
      showError("กรุณาเลือกวันที่");
      return;
    }

    const dateError = getScheduleDateError(formatCalendarDate(schedule.date));
    if (dateError) {
      setToday(getBangkokDateKey());
      showError(dateError);
      return;
    }

    if (!schedule.startTime) {
      showError("กรุณาเลือกเวลาเริ่มเรียน");
      return;
    }

    try {
      setSaving(true);

      const response = await scheduleApi.create({
        classId,
        className: classInfo?.className || "",
        date: formatCalendarDate(schedule.date),
        startTime: schedule.startTime,
        endTime: schedule.endTime || schedule.startTime,
        lateAfter: schedule.lateAfter,
        allowCheckIn: schedule.allowCheckIn,
        isOpen: schedule.isOpen,
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        showError(result.message || "บันทึกเวลาไม่สำเร็จ");
        return;
      }

      setDateReset(false);
      showSuccess("บันทึกเวลาเรียบร้อย");
    } catch {
      showError("เกิดข้อผิดพลาดในการบันทึกเวลา");
    } finally {
      setSaving(false);
    }
  };

  const handleCopy = async () => {
    if (!link) {
      showError("ไม่พบลิงก์เช็กชื่อ");
      return;
    }

    try {
      await navigator.clipboard.writeText(link);
      showSuccess("คัดลอกลิงก์แล้ว");
    } catch {
      showError("ไม่สามารถคัดลอกลิงก์ได้");
    }
  };

  const handleDownloadQR = () => {
    const svg = document.querySelector<SVGElement>(".qr-code svg");

    if (!svg) {
      showError("ไม่พบ QR Code");
      return;
    }

    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svg);
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    if (!context) {
      showError("ไม่สามารถสร้างรูป QR Code ได้");
      return;
    }

    const image = new Image();
    const svgBlob = new Blob([svgString], {
      type: "image/svg+xml;charset=utf-8",
    });
    const url = URL.createObjectURL(svgBlob);

    image.onload = () => {
      const size = 500;
      const padding = 30;

      canvas.width = size;
      canvas.height = size;

      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, size, size);
      context.drawImage(
        image,
        padding,
        padding,
        size - padding * 2,
        size - padding * 2,
      );

      URL.revokeObjectURL(url);

      const downloadLink = document.createElement("a");

      downloadLink.download = `เช็กชื่อวิชา-${
        classInfo?.className || "ไม่ทราบชื่อวิชา"
      }.png`;
      downloadLink.href = canvas.toDataURL("image/png");
      downloadLink.click();
    };

    image.onerror = () => {
      URL.revokeObjectURL(url);
      showError("ไม่สามารถสร้างรูป QR Code ได้");
    };

    image.src = url;
  };

  const getLateTime = () => {
    if (!schedule.startTime) return "";

    const [hours, minutes] = schedule.startTime.split(":").map(Number);

    if (Number.isNaN(hours) || Number.isNaN(minutes)) {
      return "";
    }

    const date = new Date();

    date.setHours(hours);
    date.setMinutes(minutes + schedule.lateAfter);

    return date.toTimeString().slice(0, 5);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-blue-50">
      <main className="min-h-0 flex-1 overflow-y-auto p-6 pt-[80px] font-noto lg:pt-6">
        {(loading || scheduleLoading) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-300/80 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-4">
              <div className="h-14 w-14 animate-spin rounded-full border-4 border-white border-t-transparent" />

              <p className="text-base font-medium text-white">กำลังโหลด...</p>
            </div>
          </div>
        )}

        {!loading && !scheduleLoading && (
          <div className="flex flex-col rounded-2xl bg-white px-6 pb-8 pt-6">
            <header className="mb-6 flex items-center gap-3">
              <button
                type="button"
                aria-label="ย้อนกลับ"
                onClick={() => router.back()}
                className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-gray-300 transition hover:bg-gray-100"
              >
                <ArrowLeftIcon className="h-3 w-3 text-gray-700" />
              </button>

              <div>
                <h1 className="text-[26px] font-semibold text-gray-800">
                  ข้อมูลแบบฟอร์มเช็กชื่อ
                </h1>

                <p className="text-sm text-gray-500">
                  สำหรับให้นักศึกษาสแกนเข้าเรียน
                </p>
              </div>
            </header>

            {!classId ? (
              <p className="text-sm text-gray-500">ไม่พบรายวิชา</p>
            ) : !classInfo ? (
              <p className="text-sm text-gray-500">ไม่พบข้อมูลรายวิชา</p>
            ) : (
              <>
                <section className="mb-4 rounded-xl border border-gray-200 bg-blue-50 p-4">
                  <p className="mb-1 text-sm text-gray-500">วิชา</p>

                  <h2 className="text-base font-semibold text-gray-800">
                    {classInfo.className || "-"}
                  </h2>

                  <div className="mt-3 flex flex-col gap-3 text-sm text-gray-600">
                    <div>
                      <span className="text-gray-500">อาจารย์ผู้สอน:</span>
                      <span className="font-medium text-gray-700">
                        {classInfo.teachers.length > 0
                          ? classInfo.teachers
                              .map((teacher) => teacher.name)
                              .filter(Boolean)
                              .join(", ")
                          : "-"}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <span className="shrink-0 text-gray-500">รหัสวิชา:</span>

                      {classInfo.classCodes.length > 0 ? (
                        classInfo.classCodes.map((code, index) => (
                          <span
                            key={`${code}-${index}`}
                            className="rounded-lg border border-blue-100 bg-white px-3 py-1.5 font-medium text-gray-700"
                          >
                            {code || "-"}
                          </span>
                        ))
                      ) : (
                        <span className="font-medium text-gray-700">-</span>
                      )}
                    </div>

                    {classInfo.description && (
                      <div>
                        <span className="text-gray-500">รายละเอียด:</span>{" "}
                        <span className="text-gray-700">
                          {classInfo.description}
                        </span>
                      </div>
                    )}
                  </div>
                </section>

                <section className="mb-8 mt-6 rounded-2xl border border-gray-200 bg-white p-5">
                  <h3 className="mb-4 text-sm text-gray-800">
                    ตั้งเวลาเช็กชื่อ
                  </h3>

                  {dateReset && (
                    <p role="status" className="mb-4 text-sm text-blue-600">
                      ระบบใช้เวลาเดิมเป็นค่าเริ่มต้น
                      กรุณาตรวจสอบวันที่และเวลา แล้วกดบันทึกเพื่อสร้างรอบเช็กชื่อใหม่
                    </p>
                  )}

                  <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end">
                    <div className="flex w-full flex-col sm:w-auto">
                      <label className="mb-1 text-xs text-gray-500">
                        วันที่
                      </label>

                      <DatePicker
                        selected={schedule.date}
                        minDate={parseCalendarDate(today)!}
                        onChange={(date: Date | null) => {
                          const selected = date || getScheduleFormDate(undefined).date;
                          if (getScheduleDateError(formatCalendarDate(selected))) return;
                          setSchedule((previous) => ({
                            ...previous,
                            date: selected,
                          }));
                        }}
                        dateFormat="dd/MM/yyyy"
                        value={formatThaiDate(schedule.date)}
                        className="h-[46px] w-full rounded-xl border border-gray-200 bg-white px-4 text-left text-sm text-gray-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400 sm:w-[250px]"
                        calendarClassName="rounded-2xl border border-gray-200 overflow-hidden"
                        popperClassName="z-50"
                      />
                    </div>

                    <div className="flex w-full flex-col sm:w-auto">
                      <label className="mb-1 text-xs text-gray-500">
                        เวลาเริ่มเรียน
                      </label>

                      <input
                        type="time"
                        value={schedule.startTime}
                        onChange={(event) => {
                          setSchedule((previous) => ({
                            ...previous,
                            startTime: event.target.value,
                          }));
                        }}
                        className="h-[46px] w-full rounded-lg border border-gray-200 px-3 py-2 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400 sm:w-[250px]"
                      />
                    </div>

                    <div className="flex w-full flex-col sm:w-auto">
                      <label className="mb-1 text-xs text-gray-500">
                        เวลาเลิกเรียน
                      </label>

                      <input
                        type="time"
                        value={schedule.endTime}
                        onChange={(event) => {
                          setSchedule((previous) => ({
                            ...previous,
                            endTime: event.target.value,
                          }));
                        }}
                        className="h-[46px] w-full rounded-lg border border-gray-200 px-3 py-2 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400 sm:w-[250px]"
                      />
                    </div>

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
                          onChange={(event) => {
                            const value = Number(event.target.value);

                            setSchedule((previous) => ({
                              ...previous,
                              lateAfter: Number.isNaN(value)
                                ? 0
                                : Math.max(0, Math.min(120, value)),
                            }));
                          }}
                          className="h-[46px] w-full rounded-lg border border-gray-200 px-3 py-2 pr-14 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
                        />

                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                          นาที
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={saving}
                      onClick={handleSaveSchedule}
                      className="h-[46px] w-full cursor-pointer rounded-lg bg-blue-500 px-6 py-2.5 text-sm text-white shadow transition hover:bg-blue-600 disabled:opacity-50 sm:w-auto"
                    >
                      {saving ? "กำลังบันทึก..." : "บันทึก"}
                    </button>
                  </div>

                  {schedule.startTime && (
                    <div className="mt-4 text-xs text-gray-500">
                      เริ่ม: <b>{schedule.startTime}</b>
                      {" | "}
                      มาสายถึง:{" "}
                      <b className="text-yellow-600">{getLateTime()}</b>
                    </div>
                  )}
                </section>

                <section className="flex h-full flex-col">
                  <div className="mb-6">
                    <label className="text-sm text-gray-700">
                      ลิงก์เช็กชื่อ
                    </label>

                    <div className="mt-1 flex gap-2">
                      <input
                        value={link}
                        readOnly
                        className="form-input-card min-w-0 flex-1 text-sm"
                      />

                      <button
                        type="button"
                        aria-label="คัดลอกลิงก์"
                        onClick={handleCopy}
                        className="cursor-pointer rounded-md border border-gray-200 px-3 transition hover:bg-gray-100"
                      >
                        <ClipboardIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

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
                        className="absolute right-2 top-2 cursor-pointer rounded-md border border-gray-300 bg-white p-1 transition hover:bg-gray-100"
                      >
                        <ArrowsPointingOutIcon className="h-4 w-4 text-gray-600" />
                      </button>
                    </div>

                    <p className="text-center text-sm text-gray-500">
                      QR Code เช็กชื่อ
                    </p>

                    <button
                      type="button"
                      onClick={() => setOpenQR(true)}
                      className="cursor-pointer text-sm text-blue-500 hover:underline"
                    >
                      คลิกเพื่อขยาย QR Code
                    </button>
                  </div>
                </section>
              </>
            )}
          </div>
        )}
      </main>

      {openQR && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="qr-dialog-title"
          className="app-dialog-backdrop fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-3 font-noto backdrop-blur-[2px] sm:p-6"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              bounceQRDialog();
            }
          }}
        >
          <div
            ref={qrDialogRef}
            className="app-dialog-panel max-h-[95vh] w-full max-w-[800px] overflow-y-auto rounded-2xl bg-white shadow-2xl sm:rounded-3xl"
            onAnimationEnd={(event) => {
              if (event.animationName === "app-dialog-attention") {
                event.currentTarget.classList.remove("app-dialog-attention");
              }
            }}
          >
            <div className="flex items-center justify-between border-b border-gray-100 px-4 py-4 sm:px-6 sm:py-5">
              <h2
                id="qr-dialog-title"
                className="text-base font-semibold text-gray-800 sm:text-lg"
              >
                QR Code เช็กชื่อ
              </h2>

              <button
                ref={closeButtonRef}
                type="button"
                aria-label="ปิดหน้าต่าง QR Code"
                onClick={() => setOpenQR(false)}
                className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-gray-500 transition hover:bg-gray-100 hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                <XMarkIcon className="h-5 w-5 sm:h-6 sm:w-6" />
              </button>
            </div>

            <div className="flex flex-col items-center gap-5 p-4 sm:gap-6 sm:p-8">
              <div className="w-full max-w-[480px] rounded-2xl border border-gray-200 bg-white p-3 shadow-sm sm:p-4">
                <QRCode
                  value={link || "loading"}
                  size={480}
                  className="h-auto w-full"
                />
              </div>

              <div className="flex flex-col items-center gap-2 text-center">
                <p className="text-sm font-medium text-gray-700">
                  {classInfo?.className || "QR Code เช็กชื่อ"}
                </p>

                <p className="text-xs text-gray-400">
                  สแกน QR Code เพื่อเข้าสู่หน้าเช็กชื่อ
                </p>
              </div>

              <button
                type="button"
                onClick={handleDownloadQR}
                className="cursor-pointer rounded-xl border border-blue-500 px-6 py-2.5 text-sm font-semibold text-blue-500 transition hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
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

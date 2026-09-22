"use client";

import { checkInApi } from "@/services/api/check-in";
import { classesApi } from "@/services/api/classes";
import type { ClassResponse } from "@/types/classes";
import { useState, useEffect, useRef } from "react";
import { Upload } from "lucide-react";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import { useConfirm } from "@/context/swal";
import { useAlert } from "@/context/AlertContext";
import {
  defaultCheckInConfig,
  type CheckInConfigFields,
} from "@/types/check-in";

const fieldLabels: Record<keyof CheckInConfigFields, string> = {
  prefix: "คำนำหน้า / Prefix",
  firstname: "ชื่อ / First name",
  lastname: "นามสกุล / Last name",
  studentId: "รหัสนักศึกษา / Student ID",
  email: "อีเมล / Email",
  section: "เซคชั่น / Section",
  photo: "รูปภาพ / Photo",
  note: "หมายเหตุ / Note",
  location: "สถานที่ / Location",
};

const fieldPlaceholders: Record<keyof CheckInConfigFields, string> = {
  prefix: "นาย / นางสาว",
  firstname: "กรอกชื่อ",
  lastname: "กรอกนามสกุล",
  studentId: "กรอกรหัสนักศึกษา",
  email: "example@email.com",
  section: "เช่น 1",
  photo: "อัปโหลดรูปภาพ",
  note: "กรอกหมายเหตุเพิ่มเติม",
  location: "กรอกสถานที่",
};

export default function CheckInFormPage() {
  const [classes, setClasses] = useState<ClassResponse[]>([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [loadedClassId, setLoadedClassId] = useState("");
  const [classesLoading, setClassesLoading] = useState(true);
  const [classDropdownOpen, setClassDropdownOpen] = useState(false);
  const classDropdownRef = useRef<HTMLDivElement>(null);
  const [configLoading, setConfigLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [retry, setRetry] = useState(0);
  const [usesDefault, setUsesDefault] = useState(true);
  const [config, setConfig] = useState<CheckInConfigFields>({
    ...defaultCheckInConfig,
  });
  const [saving, setSaving] = useState(false);
  const [initialConfig, setInitialConfig] = useState<CheckInConfigFields>({
    ...defaultCheckInConfig,
  });
  const selectedClass = classes.find((subject) => subject._id === selectedClassId);
  const isDirty = JSON.stringify(config) !== JSON.stringify(initialConfig);
  const configReady = Boolean(selectedClassId) && loadedClassId === selectedClassId && !configLoading && !loadError;
  const canSave = configReady && !saving && (isDirty || usesDefault);
  const { showAlert } = useAlert();
  const { showConfirm } = useConfirm();

  useEffect(() => {
    if (!classDropdownOpen) return;
    const handleMouseDown = (event: MouseEvent) => {
      if (!classDropdownRef.current?.contains(event.target as Node)) {
        setClassDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, [classDropdownOpen]);

  const selectClass = (id: string) => {
    setClassDropdownOpen(false);
    if (id === selectedClassId) return;
    if (isDirty && configReady) {
      showConfirm("เปลี่ยนรายวิชา?", () => setSelectedClassId(id), "warning", "การแก้ไขที่ยังไม่ได้บันทึกจะถูกยกเลิก");
    } else setSelectedClassId(id);
  };

  const toggleField = (key: keyof CheckInConfigFields) => {
    setConfig((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const renderField = (key: keyof CheckInConfigFields) => {
    if (key === "note") {
      return (
        <div className="w-full">
          <div className="mb-2 flex items-center justify-between">
            <label className="text-xs text-gray-800 lg:text-base">
              {fieldLabels[key]}
            </label>

            <button
              onClick={() => toggleField(key)}
              className={`flex h-4 w-8 items-center rounded-full px-0.5 transition cursor-pointer lg:h-5 lg:w-10 lg:px-1 ${
                config[key] ? "bg-green-500" : "bg-gray-300"
              }`}
            >
              <div
                className={`h-3 w-3 rounded-full bg-white shadow-sm transform transition duration-200 lg:h-3.5 lg:w-3.5 ${
                  config[key]
                    ? "translate-x-4 lg:translate-x-5"
                    : "translate-x-0"
                }`}
              />
            </button>
          </div>

          <textarea
            disabled
            placeholder={fieldPlaceholders[key]}
            rows={3}
            className="w-full resize-none rounded-lg border border-gray-200 bg-gray-100 px-2.5 py-2 text-xs text-gray-400 placeholder:text-xs lg:px-3 lg:text-sm lg:placeholder:text-sm"
          />
        </div>
      );
    }

    if (key === "photo") {
      return (
        <div className="w-full">
          <div className="mb-2 flex items-center justify-between">
            <label className="text-xs text-gray-800 lg:text-base">
              {fieldLabels[key]}
            </label>

            <button
              onClick={() => toggleField(key)}
              className={`flex h-4 w-8 items-center rounded-full px-0.5 transition cursor-pointer lg:h-5 lg:w-10 lg:px-1 ${
                config[key] ? "bg-green-500" : "bg-gray-300"
              }`}
            >
              <div
                className={`h-3 w-3 rounded-full bg-white shadow-sm transform transition duration-200 lg:h-3.5 lg:w-3.5 ${
                  config[key]
                    ? "translate-x-4 lg:translate-x-5"
                    : "translate-x-0"
                }`}
              />
            </button>
          </div>

          <div className="flex w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 py-7 text-center lg:py-10">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-500 lg:h-12 lg:w-12">
              <Upload className="h-5 w-5 text-blue-500 lg:h-6 lg:w-6" />
            </div>

            <p className="mb-1 text-xs text-gray-600 lg:text-sm">
              เลือกรูปภาพ หรือ ลากและวางรูปภาพที่นี่
            </p>

            <p className="mb-4 text-[10px] text-gray-400 lg:text-xs">
              ไฟล์ต้องมีขนาดไม่เกิน 10 MB
            </p>

            <button
              disabled
              className="flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-500 lg:px-4 lg:text-sm"
            >
              <Upload className="h-3.5 w-3.5 lg:h-4 lg:w-4" />
              อัปโหลดรูปภาพ
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="w-full">
        <div className="mb-2 flex items-center justify-between">
          <label className="text-xs text-gray-800 lg:text-base">
            {fieldLabels[key]}
          </label>

          <button
            onClick={() => toggleField(key)}
            className={`flex h-4 w-8 items-center rounded-full px-0.5 transition cursor-pointer lg:h-5 lg:w-10 lg:px-1 ${
              config[key] ? "bg-green-500" : "bg-gray-300"
            }`}
          >
            <div
              className={`h-3 w-3 rounded-full bg-white shadow-sm transform transition duration-200 lg:h-3.5 lg:w-3.5 ${
                config[key] ? "translate-x-4 lg:translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        <input
          type="text"
          disabled
          placeholder={fieldPlaceholders[key]}
          className="w-full rounded-lg border border-gray-200 bg-gray-100 px-2.5 py-2 text-xs text-gray-400 placeholder:text-[10px] lg:px-3 lg:text-sm lg:placeholder:text-sm"
        />
      </div>
    );
  };

  useEffect(() => {
    const controller = new AbortController();
    const loadClasses = async () => {
      setClassesLoading(true);
      setLoadError("");
      try {
        const res = await classesApi.list({}, { signal: controller.signal, cache: "no-store" });
        const data = await res.json();
        if (!res.ok || !data.success || !Array.isArray(data.data)) throw new Error("โหลดรายวิชาไม่สำเร็จ");
        if (!controller.signal.aborted) setClasses(data.data);
      } catch {
        if (!controller.signal.aborted) setLoadError("โหลดรายวิชาไม่สำเร็จ กรุณาลองอีกครั้ง");
      } finally {
        if (!controller.signal.aborted) setClassesLoading(false);
      }
    };
    void loadClasses();
    return () => controller.abort();
  }, [retry]);

  useEffect(() => {
    if (!selectedClassId) return;
    const controller = new AbortController();
    const fetchConfig = async () => {
      setConfigLoading(true);
      setLoadedClassId("");
      setLoadError("");
      try {
        const res = await checkInApi.getConfig(selectedClassId, { signal: controller.signal, cache: "no-store" });

        if (!res.ok) throw new Error("โหลดไม่สำเร็จ");

        const data = await res.json();

        if (!data.success || !data.config) throw new Error("โหลดไม่สำเร็จ");
        if (!controller.signal.aborted) {
          setConfig(data.config);
          setInitialConfig(data.config);
          setUsesDefault(data.source !== "class");
          setLoadedClassId(selectedClassId);
        }
      } catch {
        if (!controller.signal.aborted) setLoadError("โหลดการตั้งค่าไม่สำเร็จ กรุณาลองอีกครั้ง");
      } finally {
        if (!controller.signal.aborted) setConfigLoading(false);
      }
    };

    fetchConfig();
    return () => controller.abort();
  }, [selectedClassId, retry]);

  const handleSaveConfig = async () => {
    if (!canSave) return;
    try {
      setSaving(true);

      const res = await checkInApi.updateConfig({ classId: selectedClassId, config });

      const data = await res.json();

      if (!res.ok || !data.success) throw new Error();

      setInitialConfig(config);
      setUsesDefault(false);

      showAlert("บันทึกการตั้งค่าของรายวิชานี้แล้ว", "success");
    } catch (err) {
      showAlert("เกิดข้อผิดพลาดในการบันทึก", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-blue-50">
      <main className="min-h-0 flex-1 overflow-y-auto p-6 pt-[80px] font-noto lg:pt-6">
        <div className="w-full space-y-5 rounded-2xl bg-white p-6 lg:p-8">
          <header className="mb-7">
            <h1 className="text-xl font-semibold text-slate-900 sm:text-2xl">
              ตั้งค่าแบบฟอร์มเช็คชื่อ
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              เลือกรายวิชา แล้วเปิด–ปิดช่องข้อมูลที่ต้องการให้นักศึกษากรอก การตั้งค่าจะมีผลเฉพาะวิชาที่เลือก
            </p>
          </header>

          <section aria-labelledby="class-section-heading" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-4">
              <h2 id="class-section-heading" className="text-base font-semibold text-slate-800">เลือกรายวิชา</h2>
              <p className="mt-1 text-sm text-slate-500">การตั้งค่าจะบันทึกแยกตามรายวิชา</p>
            </div>
            <label id="config-class-label" className="mb-2 block text-sm font-medium text-slate-700">รายวิชา</label>
            <div ref={classDropdownRef} className="relative">
              <button
                id="config-class"
                type="button"
                aria-labelledby="config-class-label config-class"
                aria-expanded={classDropdownOpen}
                aria-haspopup="listbox"
                disabled={classesLoading || saving || classes.length === 0}
                onClick={() => setClassDropdownOpen((open) => !open)}
                onKeyDown={(event) => {
                  if (event.key === "Escape") setClassDropdownOpen(false);
                }}
                className="form-input-card flex min-h-11 cursor-pointer items-center justify-between gap-2 text-left text-sm text-gray-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span className="truncate">
                  {selectedClass
                    ? `${selectedClass.classCodes.join(", ")} — ${selectedClass.className}`
                    : classesLoading ? "กำลังโหลดรายวิชา..." : "เลือกรายวิชาที่ต้องการตั้งค่า"}
                </span>
                <ChevronDownIcon className="h-4 w-4 shrink-0 text-gray-400" />
              </button>
              {classDropdownOpen && (
                <div role="listbox" aria-labelledby="config-class-label" className="absolute z-30 mt-1 max-h-60 w-full overflow-y-auto rounded-md border border-gray-200 bg-white shadow-lg">
                  {classes.map((subject) => (
                    <button
                      key={subject._id}
                      type="button"
                      role="option"
                      aria-selected={subject._id === selectedClassId}
                      onClick={() => selectClass(subject._id)}
                      className={`block w-full cursor-pointer px-4 py-2 text-left text-sm ${subject._id === selectedClassId ? "bg-blue-50 font-medium text-blue-600" : "hover:bg-gray-100"}`}
                    >
                      {subject.classCodes.join(", ")} — {subject.className}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {!classesLoading && !classes.length && !loadError && <p className="mt-3 text-sm text-slate-500">ยังไม่มีรายวิชา กรุณาเพิ่มรายวิชาก่อนตั้งค่า</p>}
          </section>

          <section aria-labelledby="fields-section-heading" className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-5 sm:px-6">
              <h2 id="fields-section-heading" className="text-base font-semibold text-slate-800">ช่องข้อมูลในแบบฟอร์ม</h2>
              <p className="mt-1 text-sm text-slate-500">เลือกช่องที่ต้องการให้นักศึกษากรอกเมื่อเช็คชื่อ</p>
              {configReady && <p className="mt-3 inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">{usesDefault ? "ใช้ค่าเริ่มต้น · บันทึกเพื่อกำหนดค่าเฉพาะวิชา" : "กำลังใช้การตั้งค่าเฉพาะวิชา"}</p>}
              {!selectedClassId && !classesLoading && <p className="mt-3 text-sm text-slate-500">เลือกรายวิชาเพื่อเริ่มตั้งค่า</p>}
              {loadError && <p role="alert" className="mt-3 text-sm text-red-600">{loadError} <button type="button" onClick={() => setRetry((value) => value + 1)} className="underline">ลองอีกครั้ง</button></p>}
              {configLoading && <p role="status" className="mt-3 text-sm text-slate-500">กำลังโหลดการตั้งค่ารายวิชา...</p>}
            </div>

          <fieldset disabled={!configReady || saving} className={`min-w-0 space-y-5 p-5 sm:p-6 lg:space-y-6 ${!configReady ? "opacity-50" : ""}`}>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 lg:gap-4">
              {renderField("prefix")}
              {renderField("firstname")}
              {renderField("lastname")}
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:gap-4">
              {renderField("studentId")}
              {renderField("section")}
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:gap-4">
              {renderField("email")}
              {renderField("location")}
            </div>

            <div className="grid grid-cols-1">{renderField("note")}</div>

            {renderField("photo")}

            <div className="mt-6 w-full">
              <div className="flex w-full flex-col gap-2 text-sm lg:flex-row lg:justify-end lg:gap-3">
                <button
                  onClick={() =>
                    showConfirm(
                      "บันทึกแก้ไขข้อมูล",
                      handleSaveConfig,
                      "info",
                      `บันทึกการตั้งค่าสำหรับ ${classes.find((subject) => subject._id === selectedClassId)?.className || "รายวิชาที่เลือก"} ใช่หรือไม่`,
                    )
                  }
                  disabled={!canSave}
                  className={`w-full rounded-lg px-5 py-2.5 text-xs text-white lg:w-auto lg:px-6 lg:text-sm ${
                    !canSave
                      ? "bg-gray-300"
                      : "bg-blue-500 hover:bg-blue-600 cursor-pointer"
                  }`}
                >
                  {saving ? "กำลังบันทึก..." : "บันทึก"}
                </button>

                <button
                  className="w-full rounded-md border border-gray-300 px-5 py-2.5 text-xs text-gray-600 hover:bg-gray-100 cursor-pointer lg:w-auto lg:px-6 lg:text-sm"
                  onClick={() =>
                    showConfirm(
                      "ยกเลิกการแก้ไขข้อมูล",
                      () => setConfig(initialConfig),
                      "edit",
                      "คุณต้องการยกเลิกการแก้ไขข้อมูลใช่หรือไม่",
                    )
                  }
                >
                  ยกเลิก
                </button>
              </div>
            </div>
          </fieldset>
          </section>
        </div>
      </main>
    </div>
  );
}

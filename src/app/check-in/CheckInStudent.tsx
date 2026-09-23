"use client";

import { checkInApi } from "@/services/api/check-in";
import { classesApi } from "@/services/api/classes";
import { attendanceApi } from "@/services/api/attendance";
import { useEffect, useState } from "react";
import {
  CameraIcon,
  MapPinIcon,
  CheckCircleIcon,
  ChevronDownIcon,
  AcademicCapIcon,
} from "@heroicons/react/24/outline";
import { useRef } from "react";
import { useConfirm } from "@/context/swal";
import { useAlert } from "@/context/AlertContext";
import type {
  CheckInClassInfo,
  CheckInConfigFields,
  CheckInFormData,
} from "@/types/check-in";

export default function CheckInStudentPage({
  classId,
}: {
  classId: string | null;
}) {
  const [config, setConfig] = useState<CheckInConfigFields | null>(null);
  const [configError, setConfigError] = useState(false);
  const [configRetry, setConfigRetry] = useState(0);
  const [form, setForm] = useState<CheckInFormData>({});
  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState<string | null>(null);
  const [openSection, setOpenSection] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);
  const { showConfirm } = useConfirm();
  const { showAlert } = useAlert();
  const [showSuccess, setShowSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loadingClass, setLoadingClass] = useState(true);

  const [openPrefix, setOpenPrefix] = useState(false);
  const prefixRef = useRef<HTMLDivElement>(null);

  const [classInfo, setClassInfo] = useState<CheckInClassInfo | null>(null);

  const isEmailValid = (email?: string) =>
    !email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const isStudentIdValid = (id?: string) => !id || /^\d{9}-\d$/.test(id);

  const isFormValid = () => {
    if (!config) return false;

    if (config.prefix && !form.prefix) return false;
    if (config.firstname && !form.firstname) return false;
    if (config.lastname && !form.lastname) return false;
    if (config.email && (!form.email || !isEmailValid(form.email)))
      return false;
    if (
      config.studentId &&
      (!form.studentId || !isStudentIdValid(form.studentId))
    )
      return false;
    if (config.section && !form.section) return false;
    if (config.photo && !form.photo) return false;
    if (config.location && !form.location) return false;
    if (config.note && !form.note) return false;

    return true;
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        sectionRef.current &&
        !sectionRef.current.contains(e.target as Node)
      ) {
        setOpenSection(false);
      }

      if (prefixRef.current && !prefixRef.current.contains(e.target as Node)) {
        setOpenPrefix(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const fetchConfig = async () => {
      setLoading(true);
      setConfigError(false);
      try {
        const res = await checkInApi.getConfig(classId, {
          signal: controller.signal,
          cache: "no-store",
        });
        const data = await res.json();

        if (!res.ok || !data.success || !data.config)
          throw new Error("Config unavailable");
        if (!controller.signal.aborted) {
          setConfig(data.config);
        }
      } catch {
        if (!controller.signal.aborted) {
          setConfig(null);
          setConfigError(true);
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    if (classId) {
      fetchConfig();
    } else {
      setLoading(false);
    }
    return () => controller.abort();
  }, [classId, configRetry]);

  useEffect(() => {
    const fetchClassInfo = async () => {
      if (!classId) return;

      try {
        const res = await classesApi.get(classId);
        const data = await res.json();

        if (data.success) {
          setClassInfo(data.data);
        }
      } catch {
        showAlert("โหลดข้อมูลวิชาไม่สำเร็จ", "error");
      } finally {
        setLoadingClass(false);
      }
    };

    fetchClassInfo();
  }, [classId]);

  const handlePhoto = (file: File) => {
    const reader = new FileReader();

    reader.onloadend = () => {
      const base64 = reader.result as string;

      setPreview(base64);
      setForm((prev) => ({
        ...prev,
        photo: base64,
      }));
    };

    reader.readAsDataURL(file);
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      showAlert("อุปกรณ์ไม่รองรับการระบุตำแหน่ง", "error");
      return;
    }

    setGettingLocation(true);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };

        setForm((prev) => ({
          ...prev,
          location: coords,
        }));

        setGettingLocation(false);
        showAlert("ดึงตำแหน่งสำเร็จ", "success");
      },
      () => {
        setGettingLocation(false);
        showAlert(
          "ไม่สามารถดึงตำแหน่งได้ กรุณาอนุญาตการเข้าถึงตำแหน่ง",
          "error",
        );
      },
    );
  };

  const handleSubmit = async () => {
    if (!classId) {
      showAlert("ไม่พบข้อมูลรายวิชา", "error");
      return;
    }

    if (!isFormValid()) {
      showConfirm("กรุณากรอกข้อมูลให้ครบ", () => {});
      return;
    }

    showConfirm("ยืนยันการเช็คชื่อ?", async () => {
      try {
        setSubmitting(true);

        const fullName = [form.prefix, form.firstname, form.lastname]
          .filter(Boolean)
          .join(" ")
          .trim();

        const payload = {
          ...form,
          name: fullName,
        };

        const res = await attendanceApi.submit({
          classId,
          ...payload,
        });

        const data = await res.json();

        if (!data.success) {
          if (data.message === "คุณเช็คชื่อแล้ว") {
            showAlert("คุณเช็คชื่อไปแล้ว", "error");
          } else {
            showAlert(data.message || "เกิดข้อผิดพลาด", "error");
          }

          setSubmitting(false);
          return;
        }

        setTimeout(() => {
          setSubmitting(false);
          setShowSuccess(true);
        }, 300);
      } catch (error) {
        showAlert("เกิดข้อผิดพลาด", "error");
        setSubmitting(false);
      }
    });
  };

  if (!classId) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p>ไม่พบวิชา</p>
      </div>
    );
  }

  if (loading || loadingClass) {
    return (
      <div className="absolute inset-0 z-10 flex items-center justify-center bg-gray-300">
        <div className="flex flex-col items-center gap-4">
          <div className="h-14 w-14 animate-spin rounded-full border-4 border-white border-t-transparent"></div>
          <p className="text-gray-600 text-base text-white">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  if (configError) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6 font-noto">
        <div
          role="alert"
          className="max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center"
        >
          <p className="text-slate-700">
            โหลดแบบฟอร์มของรายวิชาไม่สำเร็จ กรุณาลองอีกครั้ง
          </p>
          <button
            type="button"
            onClick={() => setConfigRetry((value) => value + 1)}
            className="mt-4 rounded-lg bg-blue-600 px-5 py-2 text-sm text-white"
          >
            ลองอีกครั้ง
          </button>
        </div>
      </main>
    );
  }

  if (showSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-blue-50 px-6 font-noto">
        <div
          className="bg-white rounded-3xl shadow-sm border border-gray-200 
                  px-8 py-15 text-center max-w-xl w-full"
        >
          <CheckCircleIcon className="w-20 h-20 text-green-500 mx-auto mb-5" />

          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            เช็คชื่อสำเร็จ
          </h2>

          <p className="text-sm text-gray-500 leading-relaxed">
            คุณได้ทำการเช็คชื่อเรียบร้อยแล้ว
          </p>
        </div>
      </div>
    );
  }

  return (
    <main className="student-checkin-form min-h-screen bg-slate-50 px-4 py-6 font-noto sm:py-10">
      {submitting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-300">
          <div className="flex flex-col items-center gap-4">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-white border-t-transparent"></div>
            <p className="text-white text-sm font-noto">กำลังบันทึก...</p>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-2xl space-y-5">
        <header className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-6 sm:px-8 sm:py-7">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <AcademicCapIcon aria-hidden="true" className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-medium tracking-widest text-slate-400">
                  ATTENDY
                </p>
                <p className="mt-0.5 text-sm text-slate-600">
                  เช็คชื่อเข้าเรียน
                </p>
              </div>
            </div>
            <div className="mb-3 flex flex-wrap gap-2">
              {classInfo?.classCodes?.map((code) => (
                <span
                  key={code}
                  className="rounded-md bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700"
                >
                  {code}
                </span>
              ))}
            </div>
            <h1 className="break-words text-xl font-semibold leading-relaxed text-slate-900 sm:text-2xl">
              {classInfo?.className || "ไม่พบข้อมูลรายวิชา"}
            </h1>
          </div>
          <section
            aria-labelledby="checkin-instructions-title"
            className="bg-slate-50/60 px-5 py-5 sm:px-8"
          >
            <h2
              id="checkin-instructions-title"
              className="mb-2 text-sm font-semibold text-slate-700"
            >
              คำชี้แจงการเช็คชื่อ
            </h2>
            <ol className="list-decimal space-y-1.5 pl-5 text-sm leading-relaxed text-slate-500">
              <li>
                ตรวจสอบรายวิชา และกรอกข้อมูลนักศึกษาของตนเองให้ถูกต้องครบถ้วน
              </li>
              {config?.photo && (
                <li>แนบรูปถ่ายยืนยันตัวตนตามเงื่อนไขที่ระบุในแบบฟอร์ม</li>
              )}
              {config?.location && (
                <li>อนุญาตการเข้าถึงตำแหน่ง แล้วกดดึงตำแหน่งปัจจุบัน</li>
              )}
              <li>กด “ยืนยันเช็กชื่อ” และรอจนระบบแสดงข้อความเช็กชื่อสำเร็จ</li>
            </ol>
            
            {config?.photo && (
              <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50/60 p-4">
                <p className="text-sm text-blue-800 leading-relaxed">
                  <span className="font-semibold block mb-1">
                    เงื่อนไขการเช็คชื่อด้วยรูปถ่าย
                  </span>
                  กรุณาถ่ายภาพตัวเองตามตัวอย่าง
                  โดยให้เห็นใบหน้าชัดเจนและมีหน้าจอประกอบอยู่ในภาพ
                  หากไม่ปฏิบัติตามเงื่อนไขดังกล่าว จะถือว่า{" "}
                  <b>ไม่ประสงค์จะเช็คชื่อ</b>
                  <br />
                  <br />
                  หากตรวจพบการทุจริต จะมีการ <b>ตัด 2 คะแนนดิบ (ไม่หาร)</b>{" "}
                </p>
              </div>
            )}
          </section>
        </header>

        <section
          aria-labelledby="student-info-title"
          className="rounded-2xl border border-slate-200 bg-white shadow-sm"
        >
          <div className="border-b border-slate-100 px-5 py-5 sm:px-8">
            <h2
              id="student-info-title"
              className="text-base font-semibold text-slate-800"
            >
              ข้อมูลนักศึกษา
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-slate-500">
              กรอกข้อมูลของคุณให้ครบถ้วน แล้วตรวจสอบก่อนยืนยันเช็กชื่อ
            </p>
          </div>
          <div className="px-5 py-6 sm:px-8 sm:py-7">
            <div className="space-y-6">
              {(config?.prefix || config?.firstname || config?.lastname) && (
                <div className="space-y-2">
                  <p className="block text-sm font-medium text-slate-700">
                    ชื่อ-นามสกุล
                  </p>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-[0.8fr_1fr_1fr]">
                    {config?.prefix && (
                      <div ref={prefixRef}>
                        <div className="relative">
                          <button
                            type="button"
                            aria-label="คำนำหน้า"
                            aria-expanded={openPrefix}
                            onClick={() => setOpenPrefix((prev) => !prev)}
                            className="form-input-card text-sm flex items-center justify-between w-full cursor-pointer"
                          >
                            {form.prefix || "คำนำหน้า"}
                            <ChevronDownIcon className="w-4 h-4 text-gray-400" />
                          </button>

                          {openPrefix && (
                            <div className="absolute z-10 mt-1 w-full rounded-md bg-white shadow-lg border border-gray-200 max-h-48 overflow-y-auto">
                              {[
                                { label: "นาย", value: "นาย" },
                                { label: "นางสาว", value: "นางสาว" },
                                { label: "นาง", value: "นาง" },
                              ].map((item) => {
                                const isSelected = form.prefix === item.value;

                                return (
                                  <button
                                    key={item.value}
                                    type="button"
                                    onClick={() => {
                                      setForm((prev) => ({
                                        ...prev,
                                        prefix: item.value,
                                      }));
                                      setOpenPrefix(false);
                                    }}
                                    className={`block w-full px-4 py-2 text-left text-sm cursor-pointer
                              ${
                                isSelected
                                  ? "bg-blue-50 text-blue-600"
                                  : "hover:bg-gray-100"
                              }`}
                                  >
                                    {item.label}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {config?.firstname && (
                      <input
                        aria-label="ชื่อ"
                        autoComplete="given-name"
                        placeholder="ชื่อ"
                        className="form-input-card w-full text-sm"
                        value={form.firstname || ""}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            firstname: e.target.value,
                          }))
                        }
                      />
                    )}

                    {config?.lastname && (
                      <input
                        aria-label="นามสกุล"
                        autoComplete="family-name"
                        placeholder="นามสกุล"
                        className="form-input-card w-full text-sm"
                        value={form.lastname || ""}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            lastname: e.target.value,
                          }))
                        }
                      />
                    )}
                  </div>
                </div>
              )}

              {config?.studentId && (
                <div>
                  <label
                    htmlFor="student-id"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    รหัสนักศึกษา
                  </label>

                  <input
                    id="student-id"
                    inputMode="numeric"
                    placeholder="เช่น 123456789-0"
                    className="form-input-card w-full text-sm"
                    value={form.studentId || ""}
                    onChange={(e) => {
                      let value = e.target.value;

                      value = value.replace(/\D/g, "");

                      value = value.slice(0, 10);

                      if (value.length > 9) {
                        value = value.slice(0, 9) + "-" + value.slice(9);
                      }

                      setForm((prev) => ({
                        ...prev,
                        studentId: value,
                      }));
                    }}
                    onKeyDown={(e) => {
                      const allowed =
                        /[0-9]/.test(e.key) ||
                        [
                          "Backspace",
                          "Delete",
                          "ArrowLeft",
                          "ArrowRight",
                          "Tab",
                        ].includes(e.key);

                      if (!allowed) {
                        e.preventDefault();
                      }
                    }}
                  />
                </div>
              )}

              {errors.studentId && (
                <p className="text-xs text-red-500 mt-1">{errors.studentId}</p>
              )}

              {config?.section && (
                <div ref={sectionRef}>
                  <label className="text-sm text-gray-700 mb-1 block">
                    Section
                  </label>

                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setOpenSection((prev) => !prev)}
                      className="form-input-card text-sm flex items-center justify-between w-full"
                    >
                      {form.section || "เลือก section"}
                      <ChevronDownIcon className="w-4 h-4 text-gray-400" />
                    </button>

                    {openSection && (
                      <div className="absolute z-10 mt-1 w-full rounded-md bg-white shadow-lg border border-gray-200 max-h-48 overflow-y-auto">
                        {[
                          { label: "Section 1", value: "1" },
                          { label: "Section 2", value: "2" },
                          { label: "Section 3", value: "3" },
                        ].map((sec) => {
                          const isSelected = form.section === sec.value;

                          return (
                            <button
                              key={sec.value}
                              type="button"
                              onClick={() => {
                                setForm((prev) => ({
                                  ...prev,
                                  section: sec.value,
                                }));
                                setOpenSection(false);
                              }}
                              className={`block w-full px-4 py-2 text-left text-sm cursor-pointer
                          ${
                            isSelected
                              ? "bg-blue-50 text-blue-600"
                              : "hover:bg-gray-100"
                          }`}
                            >
                              {sec.label}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {config?.email && (
                <div>
                  <label
                    htmlFor="student-email"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    อีเมล
                  </label>
                  <input
                    id="student-email"
                    type="email"
                    autoComplete="email"
                    placeholder="name@example.com"
                    className="form-input-card w-full text-sm"
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        email: e.target.value,
                      }))
                    }
                  />
                </div>
              )}

              {config?.note && (
                <div>
                  <label className="text-sm text-gray-700 mb-1 block">
                    หมายเหตุเพิ่มเติม
                  </label>

                  <textarea
                    placeholder="กรอกหมายเหตุ (ถ้ามี)"
                    className="form-input-card w-full text-sm resize-none"
                    rows={3}
                    value={form.note || ""}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        note: e.target.value,
                      }))
                    }
                  />
                </div>
              )}

              {(config?.photo || config?.location) && (
                <div className="border-t border-slate-100 pt-6">
                  <h3 className="text-sm font-semibold text-slate-800">
                    ยืนยันการเข้าเรียน
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    แนบข้อมูลตามที่รายวิชากำหนด
                  </p>
                </div>
              )}

              {config?.photo && (
                <div>
                  <label className="text-sm text-gray-700 mb-1 block">
                    ถ่ายรูปยืนยันตัวตน
                  </label>

                  {!preview && (
                    <div className="relative">
                      <CameraIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />

                      <input
                        aria-label="ถ่ายรูปยืนยันตัวตน"
                        type="file"
                        accept="image/*"
                        capture="environment"
                        className="min-h-12 w-full cursor-pointer rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm text-slate-600 transition file:mr-2 file:cursor-pointer file:border-0 file:bg-transparent file:text-slate-600 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-blue-500"
                        onChange={(e) => {
                          if (e.target.files?.[0]) {
                            handlePhoto(e.target.files[0]);
                          }
                        }}
                      />
                    </div>
                  )}

                  {preview && (
                    <div className="mt-2">
                      <label className="block cursor-pointer">
                        <img
                          src={preview}
                          alt="preview"
                          className="w-full max-h-60 object-contain rounded-lg border bg-gray-50 hover:opacity-90 transition"
                        />

                        <input
                          type="file"
                          accept="image/*"
                          capture="environment"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files?.[0]) {
                              handlePhoto(e.target.files[0]);
                            }
                          }}
                        />
                      </label>
                    </div>
                  )}
                </div>
              )}

              {config?.location && (
                <div>
                  <label className="text-sm text-gray-700 mb-1 block">
                    ตำแหน่งที่ตั้ง
                  </label>

                  <button
                    type="button"
                    onClick={handleGetLocation}
                    disabled={gettingLocation}
                    aria-busy={gettingLocation}
                    className="relative flex min-h-12 w-full cursor-pointer items-center rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 pl-11 text-left text-sm text-slate-600 transition hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-blue-500 disabled:cursor-wait"
                  >
                    {gettingLocation ? (
                      <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin absolute left-3 top-1/2 -translate-y-1/2" />
                    ) : form.location ? (
                      <CheckCircleIcon className="w-5 h-5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    ) : (
                      <MapPinIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    )}

                    <span>
                      {gettingLocation
                        ? "กำลังดึงตำแหน่ง..."
                        : form.location
                          ? `Lat: ${form.location.lat.toFixed(4)}, Lng: ${form.location.lng.toFixed(4)}`
                          : "กดเพื่อดึงตำแหน่งปัจจุบัน"}
                    </span>
                  </button>

                  <p className="text-xs text-gray-500 mt-1">
                    ระบบจะใช้ตำแหน่งของคุณเพื่อตรวจสอบการเข้าเรียน
                  </p>
                </div>
              )}

              <div className="border-t border-slate-100 pt-6">
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={!isFormValid() || submitting}
                  className={`flex min-h-12 w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-base font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 ${
                    isFormValid()
                      ? "bg-blue-600 text-white hover:bg-blue-700 cursor-pointer"
                      : "bg-slate-100 text-slate-400"
                  }`}
                >
                  <CheckCircleIcon aria-hidden="true" className="h-5 w-5" />
                  ยืนยันเช็กชื่อ
                </button>
                <p className="mt-3 text-center text-xs leading-relaxed text-slate-400">
                  โปรดตรวจสอบชื่อและรหัสนักศึกษาให้ถูกต้องก่อนยืนยัน
                </p>
              </div>
            </div>
          </div>
        </section>
        <p className="pb-2 text-center text-xs text-slate-400">
          Attendy · ระบบบันทึกการเข้าเรียน
        </p>
      </div>
    </main>
  );
}

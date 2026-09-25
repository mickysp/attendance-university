"use client";

import { teachersApi } from "@/services/api/teachers";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { AcademicCapIcon, ArrowLeftIcon } from "@heroicons/react/24/outline";
import { useAlert } from "@/context/AlertContext";
import { useConfirm } from "@/context/swal";

const normalizeTeacherName = (value: string) => {
  return value
    .toLowerCase()
    .replace(
      /(อ\.?|อาจารย์|ดร\.?|ผศ\.?|รศ\.?|ศ\.?|นาย|นางสาว|นาง|น\.ส\.?|น\.ส|นางสาว|น.ส\.?)/g,
      "",
    )
    .replace(/[^\p{L}\p{N}]+/gu, "")
    .trim();
};

export default function TeacherForm({ id }: { id?: string }) {
  const router = useRouter();
  const { showAlert } = useAlert();
  const { showConfirm } = useConfirm();
  const [name, setName] = useState("");
  const [additionalTeachers, setAdditionalTeachers] = useState<
    { key: number; name: string }[]
  >([]);
  const nextTeacherKey = useRef(1);
  const [originalName, setOriginalName] = useState("");
  const [loading, setLoading] = useState(Boolean(id));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [existingTeacherNames, setExistingTeacherNames] = useState<string[]>(
    [],
  );
  const [retry, setRetry] = useState(0);
  const busy = useRef(false);
  const title = id ? "แก้ไขอาจารย์" : "เพิ่มอาจารย์";

  const trimmedName = name.trim();
  const names = [
    trimmedName,
    ...additionalTeachers.map((teacher) => teacher.name.trim()),
  ];
  const duplicateMessage = (value: string) => {
    if (!value.trim()) return "";
    const normalized = normalizeTeacherName(value);
    if (
      names.filter((item) => normalizeTeacherName(item) === normalized).length >
      1
    ) {
      return "ชื่อซ้ำกับอาจารย์ที่กำลังเพิ่ม";
    }
    const currentName = normalizeTeacherName(originalName);
    if (id && normalized === currentName) return "";
    return existingTeacherNames.some(
      (teacherName) => normalizeTeacherName(teacherName) === normalized,
    )
      ? "มีชื่อนี้ในระบบแล้ว"
      : "";
  };
  const isDuplicateName = Boolean(duplicateMessage(name));
  const invalidNames = names.some(
    (value) => !value || Boolean(duplicateMessage(value)),
  );

  useEffect(() => {
    const abortController = new AbortController();

    const loadTeacherNames = async () => {
      try {
        const res = await teachersApi.list({
          cache: "no-store",
          signal: abortController.signal,
        });
        const result = await res.json();
        if (!res.ok || !result.success)
          throw new Error(result.message || "โหลดรายชื่ออาจารย์ไม่สำเร็จ");

        if (abortController.signal.aborted) return;

        setExistingTeacherNames(
          Array.isArray(result.data)
            ? result.data
                .map((item: { name?: string }) =>
                  typeof item?.name === "string" ? item.name.trim() : "",
                )
                .filter(Boolean)
            : [],
        );
      } catch {
        if (!abortController.signal.aborted) {
          setExistingTeacherNames([]);
        }
      }
    };

    void loadTeacherNames();

    if (!id) return () => abortController.abort();

    const controller = new AbortController();
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await teachersApi.get(id, {
          cache: "no-store",
          signal: controller.signal,
        });
        const result = await res.json();
        if (!res.ok || !result.success)
          throw new Error(result.message || "โหลดข้อมูลอาจารย์ไม่สำเร็จ");
        setName(result.data.name);
        setOriginalName(result.data.name);
      } catch (error) {
        if (!controller.signal.aborted)
          setError(
            error instanceof Error
              ? error.message
              : "โหลดข้อมูลอาจารย์ไม่สำเร็จ",
          );
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };
    void load();
    return () => {
      controller.abort();
      abortController.abort();
    };
  }, [id, retry]);

  const leave = () => {
    if (saving) return;
    if (
      name.trim() !== originalName ||
      additionalTeachers.some((teacher) => teacher.name.trim())
    ) {
      void showConfirm(
        "ยกเลิกการกรอกข้อมูล?",
        () => router.push("/teachers"),
        "edit",
        "ข้อมูลที่ยังไม่ได้บันทึกจะไม่ถูกเก็บไว้",
      );
    } else router.push("/teachers");
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (invalidNames || busy.current) return;
    void showConfirm(
      id ? "บันทึกการแก้ไขอาจารย์?" : "เพิ่มอาจารย์?",
      async () => {
        if (busy.current) return;
        busy.current = true;
        setSaving(true);
        try {
          const res = id
            ? await teachersApi.save({ id, name: trimmedName })
            : await teachersApi.createMany(names.map((name) => ({ name })));
          const result = await res.json();
          if (!res.ok || !result.success)
            throw new Error(result.message || "บันทึกข้อมูลไม่สำเร็จ");
          showAlert(result.message || "บันทึกข้อมูลสำเร็จ", "success");
          router.push("/teachers");
        } catch (error) {
          showAlert(
            error instanceof Error ? error.message : "บันทึกข้อมูลไม่สำเร็จ",
            "error",
          );
        } finally {
          busy.current = false;
          setSaving(false);
        }
      },
      "info",
      id
        ? `ยืนยันการบันทึกข้อมูลอาจารย์ ${trimmedName}`
        : `ยืนยันการเพิ่มอาจารย์ทั้งหมด ${names.length} คน`,
    );
  };

  return (
    <div className="flex h-screen overflow-hidden bg-blue-50 font-noto">
      <main className="min-h-0 min-w-0 flex-1 overflow-y-auto p-4 pt-20 sm:p-6 sm:pt-20 lg:pt-6">
        <div className="rounded-2xl bg-white p-5 sm:p-6">
          <div className="mb-6 flex items-start gap-3">
            <button
              type="button"
              aria-label="กลับหน้ารายชื่ออาจารย์"
              disabled={saving}
              onClick={leave}
              className="mt-1 flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full border border-gray-300 hover:bg-gray-100 disabled:opacity-50"
            >
              <ArrowLeftIcon className="h-4 w-4 text-gray-700" />
            </button>
            <div>
              <h1 className="text-[26px] font-semibold text-gray-800">
                {title}
              </h1>
              <p className="mt-1 text-sm text-gray-400">
                {id
                  ? "ปรับปรุงข้อมูลอาจารย์ในระบบ"
                  : "เพิ่มรายชื่ออาจารย์สำหรับเลือกผู้สอนในรายวิชา"}
              </p>
            </div>
          </div>
          {loading ? (
            <p
              role="status"
              className="py-16 text-center text-sm text-gray-500"
            >
              กำลังโหลดข้อมูลอาจารย์...
            </p>
          ) : error ? (
            <div
              role="alert"
              className="rounded-xl bg-red-50 p-6 text-center text-sm text-red-600"
            >
              <p>{error}</p>
              <button
                type="button"
                onClick={() => setRetry((value) => value + 1)}
                className="mt-3 cursor-pointer underline"
              >
                ลองอีกครั้ง
              </button>
            </div>
          ) : (
            <form onSubmit={submit}>
              <div className="rounded-xl border border-gray-100 bg-(--card) p-4 sm:p-6">
                <div className="mb-6 flex items-center gap-3">
                  <div className="rounded-xl bg-blue-50 p-3 text-blue-500">
                    <AcademicCapIcon className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="font-medium text-gray-800">ข้อมูลอาจารย์</h2>
                    <p className="mt-1 text-sm text-gray-400">
                      {id
                        ? "กรอกชื่อ-นามสกุลให้ครบถ้วน"
                        : "กรอกชื่อ-นามสกุลให้ครบถ้วน สามารถเพิ่มอาจารย์หลายคนแล้วบันทึกพร้อมกันได้"}
                    </p>
                  </div>
                </div>

                <div className="max-w-2xl">
                  <label
                    htmlFor="teacher-name"
                    className="mb-2 block text-sm font-medium text-gray-600"
                  >
                    ชื่อ-นามสกุลอาจารย์ <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="teacher-name"
                    required
                    autoComplete="name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    disabled={saving}
                    placeholder="กรอกชื่อ-นามสกุลอาจารย์"
                    aria-invalid={isDuplicateName}
                    className={`form-input w-full ${
                      isDuplicateName
                        ? "border-red-300 bg-red-50 text-red-700"
                        : ""
                    }`}
                  />
                  {isDuplicateName && (
                    <p className="mt-2 text-sm text-red-600">
                      {duplicateMessage(name)}
                    </p>
                  )}
                </div>
                {!id && (
                  <div className="mt-4 max-w-2xl space-y-4">
                    {additionalTeachers.map((teacher, index) => {
                      const message = duplicateMessage(teacher.name);
                      return (
                        <div key={teacher.key}>
                          <label
                            htmlFor={`teacher-name-${teacher.key}`}
                            className="mb-2 block text-sm font-medium text-gray-600"
                          >
                            ชื่อ-นามสกุลอาจารย์ คนที่ {index + 2}{" "}
                            <span className="text-red-500">*</span>
                          </label>
                          <div className="flex items-center gap-3">
                            <input
                              id={`teacher-name-${teacher.key}`}
                              required
                              autoFocus
                              value={teacher.name}
                              onChange={(event) =>
                                setAdditionalTeachers((items) =>
                                  items.map((item) =>
                                    item.key === teacher.key
                                      ? { ...item, name: event.target.value }
                                      : item,
                                  ),
                                )
                              }
                              disabled={saving}
                              placeholder="กรอกชื่อ-นามสกุลอาจารย์"
                              aria-invalid={Boolean(message)}
                              aria-describedby={
                                message
                                  ? `teacher-error-${teacher.key}`
                                  : undefined
                              }
                              className={`form-input min-w-0 flex-1 ${message ? "border-red-300 bg-red-50 text-red-700" : ""}`}
                            />
                            <button
                              type="button"
                              disabled={saving}
                              aria-label={`ลบอาจารย์ คนที่ ${index + 2}`}
                              onClick={() =>
                                setAdditionalTeachers((items) =>
                                  items.filter(
                                    (item) => item.key !== teacher.key,
                                  ),
                                )
                              }
                              className="cursor-pointer rounded-md px-3 py-2 text-sm text-red-500 hover:bg-red-50 disabled:opacity-50"
                            >
                              ลบ
                            </button>
                          </div>
                          {message && (
                            <p
                              id={`teacher-error-${teacher.key}`}
                              className="mt-2 text-sm text-red-600"
                            >
                              {message}
                            </p>
                          )}
                        </div>
                      );
                    })}
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => {
                        const key = nextTeacherKey.current++;
                        setAdditionalTeachers((items) => [
                          ...items,
                          { key, name: "" },
                        ]);
                      }}
                      className="min-h-11 cursor-pointer rounded-md border border-blue-200 px-4 py-2 text-sm text-blue-500 hover:bg-blue-50 disabled:opacity-50"
                    >
                      + เพิ่มอาจารย์อีกคน
                    </button>
                    <p className="text-sm text-gray-400">
                      ทั้งหมด {names.length} คน
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end gap-3 border-t border-gray-100 pt-6">
                <button
                  type="button"
                  disabled={saving}
                  onClick={leave}
                  className="min-h-11 cursor-pointer rounded-md border border-gray-200 px-6 py-2 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={
                    saving ||
                    invalidNames ||
                    Boolean(id && trimmedName === originalName.trim())
                  }
                  className="min-h-11 cursor-pointer rounded-md bg-(--primary) px-6 py-2 text-sm text-white hover:bg-(--primary-hover) disabled:opacity-50"
                >
                  {saving ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
                </button>
              </div>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}

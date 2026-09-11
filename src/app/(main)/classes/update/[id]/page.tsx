"use client";

import { useRouter, useParams } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import {
  TrashIcon,
  ArrowLeftIcon,
  ChevronDownIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

import { useAlert } from "@/context/AlertContext";
import { useConfirm } from "@/context/swal";

type Teacher = {
  _id: string;
  name: string;
};

type ClassItem = {
  className: string;
  classCodes: string[];
  teachers: Teacher[];
  description: string;
};

type ApiClassData = {
  className?: string;
  classCodes?: string[];
  teachers?: Teacher[];
  description?: string;
};

export default function EditClassPage() {
  const router = useRouter();
  const params = useParams();

  const id = params.id as string;

  const { showAlert } = useAlert();
  const { showConfirm } = useConfirm();

  const [item, setItem] = useState<ClassItem | null>(null);
  const [initialItem, setInitialItem] = useState<ClassItem | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loadingTeachers, setLoadingTeachers] = useState(true);

  const [openTeacher, setOpenTeacher] = useState(false);
  const [teacherSearch, setTeacherSearch] = useState("");

  const teacherRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!id) {
      return;
    }

    const fetchClass = async () => {
      try {
        setLoading(true);

        const res = await fetch(`/api/classes/${id}`);

        const data: {
          success: boolean;
          data?: ApiClassData;
          message?: string;
        } = await res.json();

        if (!res.ok || !data.success || !data.data) {
          throw new Error(data.message || "ไม่พบข้อมูลรายวิชา");
        }

        const normalizedTeachers: Teacher[] = Array.isArray(data.data.teachers)
          ? data.data.teachers
              .filter(
                (teacher) =>
                  teacher &&
                  typeof teacher._id === "string" &&
                  typeof teacher.name === "string",
              )
              .map((teacher) => ({
                _id: String(teacher._id),
                name: teacher.name,
              }))
          : [];

        const normalizedClassCodes: string[] =
          Array.isArray(data.data.classCodes) && data.data.classCodes.length > 0
            ? data.data.classCodes
                .filter((code): code is string => typeof code === "string")
                .map((code) => code.trim())
            : [""];

        const mapped: ClassItem = {
          className: data.data.className || "",
          classCodes: normalizedClassCodes,
          teachers: normalizedTeachers,
          description: data.data.description || "",
        };

        setItem(mapped);

        setInitialItem(JSON.parse(JSON.stringify(mapped)));
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "เกิดข้อผิดพลาด";

        showAlert(message, "error");
      } finally {
        setLoading(false);
      }
    };

    fetchClass();
  }, [id, showAlert]);

  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        setLoadingTeachers(true);

        const res = await fetch("/api/teachers");

        const data: {
          success: boolean;
          data?: Teacher[];
        } = await res.json();

        if (data.success && Array.isArray(data.data)) {
          setTeachers(
            data.data.map((teacher) => ({
              _id: String(teacher._id),
              name: teacher.name,
            })),
          );
        } else {
          showAlert("ไม่สามารถโหลดข้อมูลอาจารย์ได้", "error");
        }
      } catch (error) {
        showAlert("ไม่สามารถโหลดข้อมูลอาจารย์ได้", "error");
      } finally {
        setLoadingTeachers(false);
      }
    };

    fetchTeachers();
  }, [showAlert]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      if (teacherRef.current && !teacherRef.current.contains(target)) {
        setOpenTeacher(false);
        setTeacherSearch("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const isDirty =
    item !== null &&
    initialItem !== null &&
    JSON.stringify(item) !== JSON.stringify(initialItem);

  const filteredTeachers = teachers.filter((teacher) =>
    teacher.name.toLowerCase().includes(teacherSearch.toLowerCase().trim()),
  );

  const handleClassChange = (
    key: "className" | "description",
    value: string,
  ) => {
    if (!item) {
      return;
    }

    setItem({
      ...item,
      [key]: value,
    });
  };

  const handleClassCodeChange = (codeIndex: number, value: string) => {
    if (!item) {
      return;
    }

    const updatedClassCodes = [...item.classCodes];

    updatedClassCodes[codeIndex] = value;

    setItem({
      ...item,
      classCodes: updatedClassCodes,
    });
  };

  const handleAddClassCode = () => {
    if (!item) {
      return;
    }

    setItem({
      ...item,
      classCodes: [...item.classCodes, ""],
    });
  };

  const handleRemoveClassCode = (codeIndex: number) => {
    if (!item) {
      return;
    }

    setItem({
      ...item,
      classCodes: item.classCodes.filter((_, index) => index !== codeIndex),
    });
  };

  const handleToggleTeacher = (teacher: Teacher) => {
    if (!item) {
      return;
    }

    const alreadySelected = item.teachers.some(
      (selectedTeacher) => selectedTeacher._id === teacher._id,
    );

    if (alreadySelected) {
      setItem({
        ...item,
        teachers: item.teachers.filter(
          (selectedTeacher) => selectedTeacher._id !== teacher._id,
        ),
      });

      return;
    }

    setItem({
      ...item,
      teachers: [...item.teachers, teacher],
    });
  };

  const handleRemoveTeacher = (teacherId: string) => {
    if (!item) {
      return;
    }

    setItem({
      ...item,
      teachers: item.teachers.filter((teacher) => teacher._id !== teacherId),
    });
  };

  const validateForm = (): boolean => {
    if (!item) {
      return false;
    }

    if (!item.className.trim()) {
      showAlert("กรุณากรอกชื่อวิชา", "error");
      return false;
    }

    if (item.classCodes.length === 0) {
      showAlert("กรุณากรอกรหัสวิชาอย่างน้อย 1 รหัส", "error");
      return false;
    }

    const hasEmptyClassCode = item.classCodes.some((code) => !code.trim());

    if (hasEmptyClassCode) {
      showAlert("กรุณากรอกรหัสวิชาให้ครบทุกช่อง", "error");
      return false;
    }

    if (item.teachers.length === 0) {
      showAlert("กรุณาเลือกอาจารย์ผู้สอนอย่างน้อย 1 คน", "error");

      return false;
    }

    const normalizedCodes = item.classCodes.map((code) => code.trim());

    const uniqueCodes = new Set(
      normalizedCodes.map((code) => code.toLowerCase()),
    );

    if (uniqueCodes.size !== normalizedCodes.length) {
      showAlert("มีรหัสวิชาซ้ำกัน กรุณาตรวจสอบอีกครั้ง", "error");
      return false;
    }

    return true;
  };

  const handleSubmit = () => {
    if (!item) {
      return;
    }

    if (!validateForm()) {
      return;
    }

    showConfirm(
      "บันทึกแก้ไขข้อมูล?",
      async () => {
        try {
          setSaving(true);

          const payload = {
            className: item.className.trim(),
            classCodes: [
              ...new Set(
                item.classCodes.map((code) => code.trim()).filter(Boolean),
              ),
            ],

            teachers: item.teachers.map((teacher) => ({
              _id: teacher._id,
              name: teacher.name,
            })),
            ...(item.description.trim()
              ? {
                  description: item.description.trim(),
                }
              : {}),
          };

          const res = await fetch(`/api/classes/update?id=${id}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },

            body: JSON.stringify(payload),
          });

          const data = await res.json();

          if (!res.ok) {
            throw new Error(data.message || "ไม่สามารถแก้ไขรายวิชาได้");
          }

          showAlert(data.message || "อัปเดตรายวิชาสำเร็จ", "success");

          router.push("/classes");
        } catch (error: unknown) {
          const message =
            error instanceof Error
              ? error.message
              : "เกิดข้อผิดพลาดในการอัปเดตรายวิชา";

          showAlert(message, "error");
        } finally {
          setSaving(false);
        }
      },
      "edit",
      "คุณต้องการยืนยันการบันทึกแก้ไขข้อมูลใช่หรือไม่",
    );
  };

  if (loading) {
    return (
      <div className="relative flex h-screen overflow-hidden bg-blue-50">
        <div className="flex-1 overflow-y-auto p-6 font-noto" />
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-gray-300/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4">
            <div className="h-14 w-14 animate-spin rounded-full border-4 border-white border-t-transparent" />

            <p className="text-base font-medium text-white">กำลังโหลด...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="flex h-screen overflow-hidden bg-blue-50">
        <div className="flex-1 p-6 font-noto">
          <div className="rounded-2xl bg-white p-6">
            <p className="text-gray-600">ไม่พบข้อมูลรายวิชา</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-blue-50">
      <div className="flex-1 min-h-0 overflow-y-auto p-6 pt-[80px] font-noto lg:pt-6">
        <div className="rounded-2xl bg-white px-4 pb-6 pt-6 sm:px-6">
          <div className="mb-4 flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.push("/classes")}
              className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full border border-gray-300 transition hover:bg-gray-100"
            >
              <ArrowLeftIcon className="h-3 w-3 text-gray-700" />
            </button>

            <h1 className="text-[22px] font-semibold text-gray-800 sm:text-[26px]">
              แก้ไขรายวิชา
            </h1>
          </div>

          <div className="rounded-xl border border-gray-50 bg-[var(--card)] p-4">
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-800">
                  ชื่อวิชา <span className="text-red-500">*</span>
                </label>

                <input
                  type="text"
                  value={item.className}
                  onChange={(e) =>
                    handleClassChange("className", e.target.value)
                  }
                  className="form-input-card text-sm"
                  placeholder="เช่น Web Programming"
                />
              </div>

              <div ref={teacherRef} className="relative">
                <label className="text-sm text-gray-800">
                  อาจารย์ผู้สอน <span className="text-red-500">*</span>
                </label>

                <div
                  className="form-input-card min-h-[42px] text-sm flex items-center justify-between gap-2 cursor-pointer"
                  onClick={() => setOpenTeacher((prev) => !prev)}
                >
                  <div className="flex flex-wrap gap-2 flex-1">
                    {item.teachers.length === 0 ? (
                      <span className="text-gray-400">เลือกอาจารย์</span>
                    ) : (
                      item.teachers.map((teacher) => (
                        <span
                          key={teacher._id}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-blue-50 text-blue-600 border border-blue-100"
                        >
                          <span>{teacher.name}</span>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();

                              handleRemoveTeacher(teacher._id);
                            }}
                            className="hover:bg-blue-100 rounded-full p-0.5 cursor-pointer"
                          >
                            <XMarkIcon className="w-3.5 h-3.5" />
                          </button>
                        </span>
                      ))
                    )}
                  </div>

                  <ChevronDownIcon className="w-4 h-4 text-gray-400 shrink-0" />
                </div>

                {openTeacher && (
                  <div className="absolute z-30 mt-1 w-full rounded-md bg-white shadow-lg border border-gray-200 max-h-60 overflow-y-auto">
                    <div className="p-2 border-b border-gray-100">
                      <input
                        type="text"
                        value={teacherSearch}
                        onChange={(e) => setTeacherSearch(e.target.value)}
                        autoFocus
                        placeholder="ค้นหาอาจารย์..."
                        className="form-input-card text-sm"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>

                    {loadingTeachers ? (
                      <div className="px-4 py-2 text-sm text-gray-400">
                        กำลังโหลดอาจารย์...
                      </div>
                    ) : filteredTeachers.length === 0 ? (
                      <div className="px-4 py-2 text-sm text-gray-400">
                        ไม่พบอาจารย์
                      </div>
                    ) : (
                      filteredTeachers.map((teacher) => {
                        const isSelected = item.teachers.some(
                          (selectedTeacher) =>
                            selectedTeacher._id === teacher._id,
                        );

                        return (
                          <button
                            key={teacher._id}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();

                              handleToggleTeacher(teacher);

                              setTeacherSearch("");
                            }}
                            className={`w-full px-4 py-2 text-left text-sm flex items-center justify-between cursor-pointer ${
                              isSelected
                                ? "bg-blue-50 text-blue-600 font-medium"
                                : "hover:bg-gray-100"
                            }`}
                          >
                            <span>{teacher.name}</span>

                            {isSelected && (
                              <span className="text-xs text-blue-600">✓</span>
                            )}
                          </button>
                        );
                      })
                    )}
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label className="text-sm text-gray-800">
                    รหัสวิชา <span className="text-red-500">*</span>
                  </label>

                  <span className="text-xs text-gray-400">
                    สามารถเพิ่มได้หลายรหัส
                  </span>
                </div>

                <div className="space-y-2 mt-2">
                  {item.classCodes.map((classCode, codeIndex) => (
                    <div key={codeIndex} className="flex gap-2">
                      <input
                        type="text"
                        value={classCode}
                        onChange={(e) =>
                          handleClassCodeChange(codeIndex, e.target.value)
                        }
                        className="form-input-card text-sm flex-1"
                        placeholder="เช่น CS101"
                      />

                      {item.classCodes.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveClassCode(codeIndex)}
                          className="text-red-500 hover:bg-red-50 p-2 rounded-md cursor-pointer"
                        >
                          <TrashIcon className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={handleAddClassCode}
                  className="mt-2 text-sm text-blue-600 hover:underline cursor-pointer"
                >
                  + เพิ่มรหัสวิชา
                </button>
              </div>

              <div>
                <label className="text-sm text-gray-800">
                  รายละเอียดวิชา{" "}
                  <span className="text-xs text-gray-400">(ไม่จำเป็น)</span>
                </label>

                <textarea
                  value={item.description}
                  onChange={(e) =>
                    handleClassChange("description", e.target.value)
                  }
                  className="form-input-card text-sm"
                  rows={4}
                  placeholder="กรอกรายละเอียดเพิ่มเติม"
                />
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => router.push("/classes")}
              className="cursor-pointer rounded-md border border-gray-300 px-6 py-2.5 text-sm text-gray-600 hover:bg-gray-100"
            >
              ยกเลิก
            </button>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={!isDirty || saving}
              className={`rounded-md px-6 py-2.5 text-sm text-white transition ${
                !isDirty || saving
                  ? "cursor-not-allowed bg-gray-400"
                  : "cursor-pointer bg-[var(--primary)] hover:bg-[var(--primary-hover)]"
              }`}
            >
              {saving ? "กำลังบันทึก..." : "บันทึก"}
            </button>
          </div>
        </div>
      </div>

      {saving && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-300/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4">
            <div className="h-14 w-14 animate-spin rounded-full border-4 border-white border-t-transparent" />

            <p className="text-base font-medium text-white">กำลังบันทึก...</p>
          </div>
        </div>
      )}
    </div>
  );
}

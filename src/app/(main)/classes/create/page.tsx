"use client";

import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
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

export default function CreateClassPage() {
  const router = useRouter();

  const { showAlert } = useAlert();
  const { showConfirm } = useConfirm();

  const [loading, setLoading] = useState(false);

  const [openTeacherIndex, setOpenTeacherIndex] = useState<number | null>(null);

  const [teacherSearch, setTeacherSearch] = useState("");

  const teacherRefs = useRef<(HTMLDivElement | null)[]>([]);

  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loadingTeachers, setLoadingTeachers] = useState(true);

  const [classes, setClasses] = useState<ClassItem[]>([
    {
      className: "",
      classCodes: [""],
      teachers: [],
      description: "",
    },
  ]);

  const filteredTeachers = teachers.filter((teacher) =>
    teacher.name.toLowerCase().includes(teacherSearch.trim().toLowerCase()),
  );

  const completedCount = classes.filter((item) => {
    const hasClassName = item.className.trim() !== "";

    const hasTeachers = item.teachers.length > 0;

    const hasClassCodes =
      item.classCodes.length > 0 &&
      item.classCodes.every((code) => code.trim() !== "");

    return hasClassName && hasTeachers && hasClassCodes;
  }).length;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;

      if (
        openTeacherIndex !== null &&
        teacherRefs.current[openTeacherIndex] &&
        !teacherRefs.current[openTeacherIndex]?.contains(target)
      ) {
        setOpenTeacherIndex(null);
        setTeacherSearch("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [openTeacherIndex]);

  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        const res = await fetch("/api/teachers");

        const data = await res.json();

        if (data.success && Array.isArray(data.data)) {
          setTeachers(data.data);
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

  const handleClassChange = (
    classIndex: number,
    key: "className" | "description",
    value: string,
  ) => {
    setClasses((prev) =>
      prev.map((item, index) =>
        index === classIndex
          ? {
              ...item,
              [key]: value,
            }
          : item,
      ),
    );
  };

  const handleAddClass = () => {
    setClasses((prev) => [
      ...prev,
      {
        className: "",
        classCodes: [""],
        teachers: [],
        description: "",
      },
    ]);
  };

  const handleRemoveClass = (classIndex: number) => {
    setClasses((prev) => prev.filter((_, index) => index !== classIndex));

    if (openTeacherIndex === classIndex) {
      setOpenTeacherIndex(null);
      setTeacherSearch("");
    }
  };

  const handleAddClassCode = (classIndex: number) => {
    setClasses((prev) =>
      prev.map((item, index) =>
        index === classIndex
          ? {
              ...item,
              classCodes: [...item.classCodes, ""],
            }
          : item,
      ),
    );
  };

  const handleRemoveClassCode = (classIndex: number, codeIndex: number) => {
    setClasses((prev) =>
      prev.map((item, index) => {
        if (index !== classIndex) {
          return item;
        }

        return {
          ...item,
          classCodes: item.classCodes.filter((_, index) => index !== codeIndex),
        };
      }),
    );
  };

  const handleClassCodeChange = (
    classIndex: number,
    codeIndex: number,
    value: string,
  ) => {
    setClasses((prev) =>
      prev.map((item, index) => {
        if (index !== classIndex) {
          return item;
        }

        const updatedClassCodes = [...item.classCodes];

        updatedClassCodes[codeIndex] = value;

        return {
          ...item,
          classCodes: updatedClassCodes,
        };
      }),
    );
  };

  const handleToggleTeacher = (classIndex: number, teacher: Teacher) => {
    setClasses((prev) =>
      prev.map((item, index) => {
        if (index !== classIndex) {
          return item;
        }

        const alreadySelected = item.teachers.some(
          (selectedTeacher) => selectedTeacher._id === teacher._id,
        );

        if (alreadySelected) {
          return {
            ...item,
            teachers: item.teachers.filter(
              (selectedTeacher) => selectedTeacher._id !== teacher._id,
            ),
          };
        }

        return {
          ...item,
          teachers: [...item.teachers, teacher],
        };
      }),
    );

    setTeacherSearch("");
    setOpenTeacherIndex(classIndex);
  };

  const handleRemoveTeacher = (classIndex: number, teacherId: string) => {
    setClasses((prev) =>
      prev.map((item, index) => {
        if (index !== classIndex) {
          return item;
        }

        return {
          ...item,
          teachers: item.teachers.filter(
            (teacher) => teacher._id !== teacherId,
          ),
        };
      }),
    );
  };

  const handleTeacherSearchKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    classIndex: number,
  ) => {
    if (e.key === "Backspace" && teacherSearch === "") {
      const currentClass = classes[classIndex];

      if (currentClass.teachers.length === 0) {
        return;
      }

      const lastTeacher =
        currentClass.teachers[currentClass.teachers.length - 1];

      handleRemoveTeacher(classIndex, lastTeacher._id);
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);

      const invalidClassName = classes.some((item) => !item.className.trim());

      if (invalidClassName) {
        showAlert("กรุณากรอกชื่อวิชาให้ครบทุกวิชา", "error");
        return;
      }

      const invalidClassCode = classes.some(
        (item) =>
          item.classCodes.length === 0 ||
          item.classCodes.some((code) => !code.trim()),
      );

      if (invalidClassCode) {
        showAlert("กรุณากรอกรหัสวิชาให้ครบทุกช่อง", "error");
        return;
      }

      const invalidTeacher = classes.some((item) => item.teachers.length === 0);

      if (invalidTeacher) {
        showAlert(
          "กรุณาเลือกอาจารย์ผู้สอนอย่างน้อย 1 คนให้ครบทุกวิชา",
          "error",
        );
        return;
      }

      for (const item of classes) {
        const normalizedCodes = item.classCodes.map((code) => code.trim());

        const uniqueCodes = new Set(normalizedCodes);

        if (normalizedCodes.length !== uniqueCodes.size) {
          showAlert(`วิชา ${item.className} มีรหัสวิชาซ้ำกัน`, "error");
          return;
        }
      }

      const payload = classes.map((item) => ({
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
      }));

      const res = await fetch("/api/classes/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        showAlert(data.message || "เกิดข้อผิดพลาดในการเพิ่มรายวิชา", "error");
        return;
      }

      showAlert(data.message || "เพิ่มรายวิชาสำเร็จ", "success");

      router.push("/classes");
    } catch (error) {
      showAlert("เกิดข้อผิดพลาดในการเพิ่มรายวิชา", "error");
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = classes.every((item) => {
    const hasClassName = item.className.trim() !== "";

    const hasTeachers = item.teachers.length > 0;

    const hasClassCodes =
      item.classCodes.length > 0 &&
      item.classCodes.every((code) => code.trim() !== "");

    return hasClassName && hasTeachers && hasClassCodes;
  });

  return (
    <div className="flex h-screen overflow-hidden bg-blue-50">
      <div className="min-h-0 flex-1 overflow-y-auto p-6 pt-[80px] font-noto lg:pt-6">
        <div className="rounded-2xl bg-white px-6 pb-6 pt-6">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => router.push("/classes")}
                className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-gray-300 transition hover:bg-gray-100"
              >
                <ArrowLeftIcon className="h-3 w-3 text-gray-700" />
              </button>

              <h1 className="text-[26px] font-semibold text-gray-800">
                เพิ่มรายวิชา
              </h1>
            </div>

            <div className="flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-4 py-2">
              <span className="text-sm text-gray-500">จำนวนวิชาที่เพิ่ม</span>

              <span className="text-sm font-semibold text-blue-600">
                {completedCount}
              </span>
            </div>
          </div>

          <div className="space-y-4">
            {classes.map((item, classIndex) => (
              <div
                key={classIndex}
                className="rounded-xl border border-gray-50 bg-[var(--card)] p-4"
              >
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="font-medium text-gray-800">
                    ข้อมูลวิชาที่ {classIndex + 1}
                  </h2>

                  {classes.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveClass(classIndex)}
                      className="cursor-pointer rounded-lg p-2 text-red-500 hover:bg-red-50"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  )}
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-gray-800">ชื่อวิชา</label>

                    <input
                      type="text"
                      value={item.className}
                      onChange={(e) =>
                        handleClassChange(
                          classIndex,
                          "className",
                          e.target.value,
                        )
                      }
                      className="form-input-card text-sm"
                      placeholder="เช่น Web Programming"
                    />
                  </div>

                  <div
                    ref={(el) => {
                      teacherRefs.current[classIndex] = el;
                    }}
                    className="relative"
                  >
                    <label className="text-sm text-gray-800">
                      อาจารย์ผู้สอน
                    </label>

                    <div
                      className="form-input-card min-h-[42px] cursor-text text-sm"
                      onClick={() => {
                        setOpenTeacherIndex(classIndex);
                      }}
                    >
                      <div className="flex min-h-[26px] flex-wrap items-center gap-2">
                        {item.teachers.map((teacher) => (
                          <span
                            key={teacher._id}
                            className="inline-flex items-center gap-1 rounded-md border border-blue-100 bg-blue-50 px-2.5 py-1 text-blue-600"
                          >
                            <span>{teacher.name}</span>

                            <button
                              type="button"
                              onMouseDown={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                              }}
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();

                                handleRemoveTeacher(classIndex, teacher._id);
                              }}
                              className="cursor-pointer rounded-full p-0.5 hover:bg-blue-100"
                            >
                              <XMarkIcon className="h-3.5 w-3.5" />
                            </button>
                          </span>
                        ))}

                        <input
                          type="text"
                          value={
                            openTeacherIndex === classIndex ? teacherSearch : ""
                          }
                          onFocus={() => {
                            setOpenTeacherIndex(classIndex);
                          }}
                          onChange={(e) => {
                            setTeacherSearch(e.target.value);
                            setOpenTeacherIndex(classIndex);
                          }}
                          onKeyDown={(e) => {
                            handleTeacherSearchKeyDown(e, classIndex);
                          }}
                          placeholder={
                            item.teachers.length === 0
                              ? "เลือกอาจารย์"
                              : "ค้นหาอาจารย์..."
                          }
                          className="min-w-[120px] flex-1 border-0 bg-transparent p-0 text-sm outline-none focus:ring-0"
                        />

                        <ChevronDownIcon className="h-4 w-4 shrink-0 text-gray-400" />
                      </div>
                    </div>

                    {openTeacherIndex === classIndex && (
                      <div className="absolute z-30 mt-1 max-h-60 w-full overflow-y-auto rounded-md border border-gray-200 bg-white shadow-lg">
                        {loadingTeachers ? (
                          <div className="px-4 py-2 text-sm text-gray-400">
                            กำลังโหลดอาจารย์...
                          </div>
                        ) : teachers.length === 0 ? (
                          <div className="px-4 py-2 text-sm text-gray-400">
                            ไม่พบข้อมูลอาจารย์
                          </div>
                        ) : filteredTeachers.length === 0 ? (
                          <div className="px-4 py-2 text-sm text-gray-400">
                            ไม่พบอาจารย์ที่ค้นหา
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
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                }}
                                onClick={() => {
                                  handleToggleTeacher(classIndex, teacher);
                                }}
                                className={`flex w-full cursor-pointer items-center justify-between px-4 py-2 text-left text-sm ${
                                  isSelected
                                    ? "bg-blue-50 font-medium text-blue-600"
                                    : "hover:bg-gray-100"
                                }`}
                              >
                                <span>{teacher.name}</span>

                                {isSelected && (
                                  <span className="text-xs text-blue-600">
                                    ✓
                                  </span>
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
                      <label className="text-sm text-gray-800">รหัสวิชา</label>

                      <span className="text-xs text-gray-400">
                        สามารถเพิ่มได้หลายรหัส
                      </span>
                    </div>

                    <div className="mt-2 space-y-2">
                      {item.classCodes.map((classCode, codeIndex) => (
                        <div key={codeIndex} className="flex gap-2">
                          <input
                            type="text"
                            value={classCode}
                            onChange={(e) =>
                              handleClassCodeChange(
                                classIndex,
                                codeIndex,
                                e.target.value,
                              )
                            }
                            className="form-input-card flex-1 text-sm"
                            placeholder="เช่น CS101"
                          />

                          {item.classCodes.length > 1 && (
                            <button
                              type="button"
                              onClick={() =>
                                handleRemoveClassCode(classIndex, codeIndex)
                              }
                              className="cursor-pointer rounded-md p-2 text-red-500 hover:bg-red-50"
                            >
                              <TrashIcon className="h-5 w-5" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleAddClassCode(classIndex)}
                      className="mt-2 cursor-pointer text-sm text-blue-600 hover:underline"
                    >
                      + เพิ่มรหัสวิชา
                    </button>
                  </div>

                  <div>
                    <label className="text-sm text-gray-800">
                      รายละเอียดวิชา
                    </label>

                    <textarea
                      value={item.description}
                      onChange={(e) =>
                        handleClassChange(
                          classIndex,
                          "description",
                          e.target.value,
                        )
                      }
                      className="form-input-card text-sm"
                      rows={4}
                      placeholder="กรอกรายละเอียดเพิ่มเติม"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex items-center justify-between">
            <button
              type="button"
              onClick={handleAddClass}
              className="cursor-pointer rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              + เพิ่มวิชา
            </button>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => router.push("/classes")}
                className="cursor-pointer rounded-md border border-gray-300 px-6 py-2.5 text-sm text-gray-600 hover:bg-gray-100"
              >
                ยกเลิก
              </button>

              <button
                type="button"
                onClick={() => showConfirm("เพิ่มข้อมูลรายวิชา", handleSubmit)}
                disabled={loading || !isFormValid}
                className={`rounded-md px-6 py-2.5 text-sm text-white transition ${
                  loading || !isFormValid
                    ? "bg-gray-400"
                    : "cursor-pointer bg-[var(--primary)] hover:bg-[var(--primary-hover)]"
                }`}
              >
                {loading ? "กำลังบันทึก..." : "บันทึก"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

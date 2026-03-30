"use client";

import { useEffect, useState, useRef } from "react";
import Sidebar from "@/components/layouts/Sidebar";
import {
  DocumentTextIcon,
  ArrowUpTrayIcon,
  ChevronDownIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";

type Major = {
  _id: string;
  name: string;
};

type Class = {
  _id: string;
  className: string;
  classCode: string;
};

type StudentInput = {
  studentId: string;
  fullName: string;
};

export default function StudentsPage() {
  const [loading, setLoading] = useState<boolean>(false);

  const [file, setFile] = useState<File | null>(null);

  const [open, setOpen] = useState<boolean>(false);
  const [mode, setMode] = useState<"file" | "manual">("file");

  const [majors, setMajors] = useState<Major[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);

  const [selectedMajor, setSelectedMajor] = useState<string>("");
  const [selectedClass, setSelectedClass] = useState<string>("");

  const [students, setStudents] = useState<StudentInput[]>([
    { studentId: "", fullName: "" },
  ]);

  const [data, setData] = useState<StudentInput[]>([]);

  const [openMajor, setOpenMajor] = useState(false);
  const [openClass, setOpenClass] = useState(false);

  const majorRef = useRef<HTMLDivElement>(null);
  const classRef = useRef<HTMLDivElement>(null);

  const [section, setSection] = useState<string>("");
  const [openSection, setOpenSection] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);
  const sectionOptions = ["1", "2", "3"];

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const [majRes, classRes] = await Promise.all([
          fetch("/api/majors"),
          fetch("/api/classes"),
        ]);

        const majData = await majRes.json();
        const classData = await classRes.json();

        if (majData.success) setMajors(majData.data);

        if (classData.success) {
          const sorted = classData.data.sort((a: Class, b: Class) =>
            a.classCode.localeCompare(b.classCode),
          );
          setClasses(sorted);
        }

        setData([]);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (majorRef.current && !majorRef.current.contains(e.target as Node)) {
        setOpenMajor(false);
      }
      if (classRef.current && !classRef.current.contains(e.target as Node)) {
        setOpenClass(false);
      }
      if (
        sectionRef.current &&
        !sectionRef.current.contains(e.target as Node)
      ) {
        setOpenSection(false);
      }
    };

    document.addEventListener("click", handleClickOutside);

    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const handleAddRow = () => {
    setStudents([...students, { studentId: "", fullName: "" }]);
  };

  const handleRemoveRow = (index: number) => {
    const updated = students.filter((_, i) => i !== index);
    setStudents(updated.length ? updated : [{ studentId: "", fullName: "" }]);
  };

  const handleChangeStudent = (
    index: number,
    field: keyof StudentInput,
    value: string,
  ) => {
    const updated = [...students];
    updated[index][field] = value;
    setStudents(updated);
  };

  const handleSave = () => {
    console.log({
      selectedMajor,
      selectedClass,
      mode,
      students,
    });

    setOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setSelectedMajor("");
    setSelectedClass("");
    setStudents([{ studentId: "", fullName: "" }]);
    setFile(null);
    setSection("");
    setMode("file");
    setOpenMajor(false);
    setOpenClass(false);
    setOpenSection(false);
  };

  const isValidStudentId = (id: string) => {
    return /^\d{9}-\d$/.test(id);
  };

  const isValidName = (name: string) => {
    return /^(นาย|นาง|นางสาว)\s.+/.test(name);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
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

        {!loading && data.length === 0 && (
          <div className="flex flex-col h-[85vh] bg-white rounded-2xl shadow-sm">
            <div className="px-6 py-6 flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-semibold text-gray-800">
                  Students
                </h1>
                <p className="text-sm text-gray-400 mt-1">
                  จัดการรายชื่อนักศึกษาในระบบ
                </p>
              </div>
            </div>

            <div className="flex flex-1 flex-col items-center justify-center text-center">
              <div className="mb-3 flex items-center justify-center w-24 h-24 rounded-full bg-gray-100">
                <DocumentTextIcon className="w-12 h-12 text-gray-400" />
              </div>

              <p className="text-sm text-gray-400">ยังไม่มีข้อมูลนักศึกษา</p>

              <button
                onClick={() => setOpen(true)}
                className="mt-3 px-6 py-2 rounded-md bg-blue-500 text-white hover:bg-blue-600 cursor-pointer"
              >
                + เพิ่มรายชื่อนักศึกษา
              </button>
            </div>
          </div>
        )}

        {open && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white w-full max-w-3xl rounded-2xl p-8 shadow-xl max-h-[70vh] overflow-y-auto">
              {" "}
              <h2 className="text-lg font-semibold mb-4">
                เพิ่มรายชื่อนักศึกษา
              </h2>
              <div className="flex gap-2 mb-4 text-sm">
                <button
                  onClick={() => {
                    setMode("file");

                    setSelectedMajor("");
                    setSelectedClass("");
                    setStudents([{ studentId: "", fullName: "" }]);
                  }}
                  className={`px-4 py-2 rounded-md ${
                    mode === "file"
                      ? "bg-blue-500 text-white"
                      : "bg-gray-100 cursor-pointer"
                  }`}
                >
                  อัปโหลดรายชื่อ
                </button>

                <button
                  onClick={() => {
                    setMode("manual");

                    setSelectedMajor("");
                    setSelectedClass("");
                    setStudents([{ studentId: "", fullName: "" }]);
                  }}
                  className={`px-4 py-2 rounded-md ${
                    mode === "manual"
                      ? "bg-blue-500 text-white"
                      : "bg-gray-100 cursor-pointer"
                  }`}
                >
                  เพิ่มรายชื่อทีละคน
                </button>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div ref={majorRef} className="relative">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenMajor(true);
                    }}
                    className="form-input-card text-sm flex items-center justify-between w-full"
                  >
                    <span className="truncate whitespace-nowrap">
                      {majors.find((m) => m._id === selectedMajor)?.name ||
                        "เลือกสาขา"}
                    </span>

                    <ChevronDownIcon className="w-4 h-4 text-gray-400 flex-shrink-0 ml-2" />
                  </button>

                  {openMajor && (
                    <div className="absolute z-10 mt-1 w-full rounded-md bg-white shadow-lg border border-gray-200 max-h-38 overflow-y-auto">
                      {majors.length === 0 ? (
                        <div className="px-4 py-2 text-sm text-gray-400">
                          ไม่พบข้อมูลสาขา
                        </div>
                      ) : (
                        majors.map((m) => {
                          const isSelected = selectedMajor === m._id;

                          return (
                            <button
                              key={m._id}
                              onClick={() => {
                                setSelectedMajor(m._id);
                                setOpenMajor(false);
                              }}
                              className={`block w-full px-4 py-2 text-left text-sm cursor-pointer
                              ${
                                isSelected
                                  ? "bg-blue-50 text-blue-600 font-medium"
                                  : "hover:bg-gray-100"
                              }`}
                            >
                              {m.name}
                            </button>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>

                <div ref={classRef} className="relative">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenClass(true);
                    }}
                    className="form-input-card text-sm flex items-center justify-between w-full h-[42px]"
                  >
                    <span className="truncate whitespace-nowrap">
                      {(() => {
                        const selected = classes.find(
                          (c) => c._id === selectedClass,
                        );
                        return selected
                          ? `${selected.classCode} - ${selected.className}`
                          : "เลือกวิชา";
                      })()}
                    </span>

                    <ChevronDownIcon className="w-4 h-4 text-gray-400 flex-shrink-0 ml-2" />
                  </button>

                  {openClass && (
                    <div className="absolute z-10 mt-1 w-full rounded-md bg-white shadow-lg border border-gray-200 max-h-38 overflow-y-auto">
                      {classes.length === 0 ? (
                        <div className="px-4 py-2 text-sm text-gray-400">
                          ไม่พบข้อมูลวิชา
                        </div>
                      ) : (
                        classes.map((c) => {
                          const isSelected = selectedClass === c._id;

                          return (
                            <button
                              key={c._id}
                              onClick={() => {
                                setSelectedClass(c._id);
                                setOpenClass(false);
                              }}
                              className={`block w-full px-4 py-2 text-left text-sm cursor-pointer
                              ${
                                isSelected
                                  ? "bg-blue-50 text-blue-600 font-medium"
                                  : "hover:bg-gray-100"
                              }`}
                            >
                              <div className="flex flex-col">
                                <span className="font-medium">
                                  {c.classCode}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {c.className}
                                </span>
                              </div>
                            </button>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              </div>
              {mode === "file" && (
                <div className="flex flex-col gap-3">
                  <div ref={sectionRef} className="relative mb-3">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenSection(true);
                      }}
                      className="form-input-card text-sm flex items-center justify-between w-full h-[42px]"
                    >
                      <span>{section || "เลือก Section"}</span>

                      <ChevronDownIcon className="w-4 h-4 text-gray-400" />
                    </button>

                    {openSection && (
                      <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow max-h-48 overflow-y-auto">
                        {sectionOptions.map((sec) => {
                          const isSelected = section === sec;

                          return (
                            <button
                              key={sec}
                              onClick={() => {
                                setSection(sec);
                                setOpenSection(false);
                              }}
                              className={`block w-full px-4 py-2 text-left text-sm flex justify-between cursor-pointer
                              ${
                                isSelected
                                ? "bg-blue-50 text-blue-600 font-medium"
                                : "hover:bg-gray-100"
                              }`}
                            >
                              <span>{sec}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <label className="group border border-gray-300 hover:border-blue-400 border-dashed rounded-xl p-6 text-center cursor-pointer text-gray-500 hover:text-blue-400 transition block">
                    <input
                      type="file"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) setFile(f);
                      }}
                    />

                    <div className="flex items-center justify-center gap-2 text-sm">
                      <ArrowUpTrayIcon className="w-5 h-5 text-gray-400 group-hover:text-blue-400 transition" />
                      <span>อัปโหลดไฟล์ (.csv / .xlsx)</span>
                    </div>

                    {file && (
                      <p className="text-sm text-gray-500 mt-2 text-center">
                        {file.name}
                      </p>
                    )}
                  </label>
                </div>
              )}

              {mode === "manual" && (
                <div className="flex flex-col gap-3">
                  <div ref={sectionRef} className="relative mb-3">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenSection(true);
                      }}
                      className="form-input-card text-sm flex items-center justify-between w-full h-[42px]"
                    >
                      <span>{section || "เลือก Section"}</span>

                      <ChevronDownIcon className="w-4 h-4 text-gray-400" />
                    </button>

                    {openSection && (
                      <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow max-h-48 overflow-y-auto">
                        {sectionOptions.map((sec) => {
                          const isSelected = section === sec;

                          return (
                            <button
                              key={sec}
                              onClick={() => {
                                setSection(sec);
                                setOpenSection(false);
                              }}
                              className={`block w-full px-4 py-2 text-left text-sm flex justify-between cursor-pointer
                              ${
                                isSelected
                                  ? "bg-blue-50 text-blue-600 font-medium"
                                  : "hover:bg-gray-100"
                              }`}
                            >
                              <span>{sec}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {students.map((s, i) => (
                    <div key={i} className="flex flex-col gap-2">
                      {students.length > 1 && (
                        <p className="text-sm font-medium text-gray-700">
                          ข้อมูลนักศึกษาคนที่ {i + 1}
                        </p>
                      )}

                      <div className="flex items-start gap-2">
                        <div className="grid grid-cols-2 gap-3 w-full">
                          <div>
                            <input
                              value={s.studentId}
                              onChange={(e) => {
                                let value = e.target.value.replace(
                                  /[^\d]/g,
                                  "",
                                );

                                if (value.length > 9) {
                                  value =
                                    value.slice(0, 9) +
                                    "-" +
                                    value.slice(9, 10);
                                }

                                handleChangeStudent(i, "studentId", value);
                              }}
                              className="form-input-card text-sm"
                              placeholder="รหัสนักศึกษา เช่น 64XXXXXXX-X"
                            />

                            {!isValidStudentId(s.studentId) && s.studentId && (
                              <p className="text-xs text-red-500 mt-1">
                                รหัสต้องเป็นตัวเลข 10 หลัก
                              </p>
                            )}
                          </div>

                          <div>
                            <input
                              value={s.fullName}
                              onChange={(e) =>
                                handleChangeStudent(
                                  i,
                                  "fullName",
                                  e.target.value,
                                )
                              }
                              className="form-input-card text-sm"
                              placeholder="ชื่อ-นามสกุล (เช่น นายสมชาย ใจดี)"
                            />

                            {!isValidName(s.fullName) && s.fullName && (
                              <p className="text-xs text-red-500 mt-1">
                                กรุณาใส่คำนำหน้า (นาย/นาง/นางสาว)
                              </p>
                            )}
                          </div>
                        </div>

                        {students.length > 1 && (
                          <button
                            onClick={() => handleRemoveRow(i)}
                            className="p-2 rounded-md hover:bg-red-50 text-red-500 hover:text-red-600 transition cursor-pointer"
                          >
                            <TrashIcon className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}

                  <button
                    onClick={handleAddRow}
                    className="text-blue-500 text-sm text-left cursor-pointer"
                  >
                    + เพิ่มนักศึกษา
                  </button>
                </div>
              )}

              <div className="flex justify-end gap-2 mt-6 text-sm">
                <button
                  onClick={() => {
                    setOpen(false);
                    resetForm();
                  }}
                  className="px-6 py-2.5 bg-gray-100 rounded-md cursor-pointer"
                >
                  ยกเลิก
                </button>

                <button
                  onClick={handleSave}
                  disabled={
                    !selectedMajor ||
                    !selectedClass ||
                    (mode === "file" && !file) ||
                    (mode === "manual" &&
                      (!section ||
                        !students.some(
                          (s) =>
                            isValidStudentId(s.studentId) &&
                            isValidName(s.fullName),
                        )))
                  }
                  className="px-6 py-2.5 bg-blue-500 text-white rounded-md disabled:bg-gray-300 cursor-pointer"
                >
                  บันทึก
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

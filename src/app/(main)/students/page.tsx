"use client";

import { classesApi } from "@/services/api/classes";
import { majorsApi } from "@/services/api/majors";
import { studentsApi } from "@/services/api/students";
import { useCallback, useEffect, useState, useRef } from "react";
import {
  DocumentArrowUpIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";
import StudentFilter from "@/components/students/Select";
import { useRouter } from "next/navigation";
import StudentTable from "@/components/students/Table";
import { useConfirm } from "@/context/swal";
import { useAlert } from "@/context/AlertContext";
import { TrashIcon } from "@heroicons/react/24/outline";

type StudentInput = {
  _id: string;
  studentId: string;
  fullName: string;
  email?: string;
  className?: string;
  major?: string;
  section?: string;
  academicYear?: number;
  classes?: {
    classId?: string;
    className: string;
    section: string;
    academicYear: number;
  }[];
};

type ClassDoc = {
  _id: string;
  name?: string;
  class_name?: string;
  className?: string;
};

type MajorDoc = {
  _id: string;
  name: string;
};

type ClassItem = {
  _id: string;
  name: string;
};

type ImportRow = { section: string; file: File | null };
type ImportResult = { section: string; message: string; success: boolean };

export default function StudentsPage() {
  const router = useRouter();
  const { showConfirm } = useConfirm();
  const { showAlert } = useAlert();
  const [deletingClass, setDeletingClass] = useState(false);
  const [loading, setLoading] = useState<boolean>(false);

  const [data, setData] = useState<StudentInput[]>([]);
  const [openImport, setOpenImport] = useState(false);

  const [importRows, setImportRows] = useState<ImportRow[]>([
    { section: "", file: null },
  ]);
  const [importResults, setImportResults] = useState<ImportResult[]>([]);
  const [selectedClass, setSelectedClass] = useState<ClassItem | null>(null);
  const [selectedMajor, setSelectedMajor] = useState("");

  const [openClass, setOpenClass] = useState(false);
  const [openMajor, setOpenMajor] = useState(false);
  const [classSearch, setClassSearch] = useState("");
  const [majorSearch, setMajorSearch] = useState("");

  const classRef = useRef<HTMLDivElement>(null);
  const majorRef = useRef<HTMLDivElement>(null);
  const importDialogRef = useRef<HTMLDivElement>(null);
  const cancelImportRef = useRef<HTMLButtonElement>(null);

  const bounceImportDialog = useCallback(() => {
    const dialog = importDialogRef.current;
    if (!dialog) return;
    dialog.classList.remove("app-dialog-attention");
    void dialog.offsetWidth;
    dialog.classList.add("app-dialog-attention");
  }, []);

  useEffect(() => {
    if (!openImport) return;
    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        if (openClass || openMajor) {
          setOpenClass(false);
          setOpenMajor(false);
          setClassSearch("");
          setMajorSearch("");
        } else bounceImportDialog();
      }
    };
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [openImport, openClass, openMajor, bounceImportDialog]);

  useEffect(() => {
    if (openImport) cancelImportRef.current?.focus();
  }, [openImport]);

  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [classesLoaded, setClassesLoaded] = useState(false);
  const [studentsLoaded, setStudentsLoaded] = useState(false);
  const initialClassSelected = useRef(false);
  const [majors, setMajors] = useState<string[]>([]);
  const [importLoading, setImportLoading] = useState(false);

  const [hasInitialData, setHasInitialData] = useState(false);

  const [years, setYears] = useState<number[]>([]);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);

  const [openYear, setOpenYear] = useState(false);
  const yearRef = useRef<HTMLDivElement>(null);

  const getClassName = (c: ClassDoc): string =>
    c.name || c.class_name || c.className || "";

  const getImportValidationError = () => {
    if (!selectedClass?._id) return "กรุณาเลือกวิชาจากรายการที่ค้นหา";
    if (!selectedMajor) return "กรุณาเลือกสาขาจากรายการที่ค้นหา";
    const incompleteIndex = importRows.findIndex((row) => !row.section || !row.file);
    if (incompleteIndex >= 0) {
      const row = importRows[incompleteIndex];
      return row.section
        ? `กรุณาเลือกไฟล์สำหรับ Section ${row.section}`
        : `กรุณากรอกหมายเลข Section ในรายการที่ ${incompleteIndex + 1}`;
    }
    if (importRows.some((row) => !/^[1-9]\d*$/.test(row.section))) {
      return "หมายเลข Section ต้องเป็นจำนวนเต็มมากกว่า 0";
    }
    if (new Set(importRows.map((row) => Number(row.section))).size !== importRows.length) {
      return "กรุณากรอกหมายเลข Section ให้ต่างกัน";
    }
    return "";
  };
  const canImport = !getImportValidationError();
  const allImportsComplete =
    importResults.length === importRows.length &&
    importResults.every((result) => result.success);
  const openImportDialog = () => {
    setImportRows([{ section: "", file: null }]);
    setImportResults([]);
    setSelectedClass(null);
    setSelectedMajor("");
    setClassSearch("");
    setMajorSearch("");
    setOpenImport(true);
  };
  const filteredClasses = classes.filter((item) =>
    item.name
      .toLocaleLowerCase()
      .includes(classSearch.trim().toLocaleLowerCase()),
  );
  const filteredMajors = majors.filter((item) =>
    item.toLocaleLowerCase().includes(majorSearch.trim().toLocaleLowerCase()),
  );


  const [filters, setFilters] = useState({
    keyword: "",
    classId: "",
    branch: "",
    section: "",
  });

  const branchesByClass = new Map<string, Set<string>>();
  for (const student of data) {
    const major = student.major?.trim();
    if (!major) continue;
    for (const course of student.classes || []) {
      if (!course.classId) continue;
      if (!branchesByClass.has(course.classId)) branchesByClass.set(course.classId, new Set());
      branchesByClass.get(course.classId)!.add(major);
    }
  }
  const selectedBranches = filters.classId
    ? [...(branchesByClass.get(filters.classId) || [])]
    : [...new Set(data.map((student) => student.major?.trim()).filter((major): major is string => Boolean(major)))];
  const effectiveBranch = filters.classId && selectedBranches.length === 1
    ? selectedBranches[0]
    : selectedBranches.includes(filters.branch) ? filters.branch : "";

  const filteredData = data.filter((s) => {
    const keyword = filters.keyword.toLowerCase();

    const matchKeyword =
      (s.fullName || "").toLowerCase().includes(keyword) ||
      (s.studentId || "").toLowerCase().includes(keyword);

    const matchClass = filters.classId
      ? (s.classes || []).some((c) =>
          c.classId === filters.classId,
        )
      : true;

    const matchBranch = effectiveBranch
      ? (s.major || "").trim().toLocaleLowerCase() === effectiveBranch.toLocaleLowerCase()
      : true;

    const matchSection = filters.section ? s.section === filters.section : true;

    const matchYear = true;

    return matchKeyword && matchClass && matchBranch && matchSection;
  });
  const selectedListClass = classes.find((item) => item._id === filters.classId);
  const selectedClassHasStudents = Boolean(filters.classId) && data.some((student) =>
    (student.classes || []).some((course) => course.classId === filters.classId),
  );

  const handleDeleteClassStudents = () => {
    if (!selectedListClass || !selectedYear || deletingClass) return;
    void showConfirm(
      `ลบรายชื่อทั้งหมดใน ${selectedListClass.name}?`,
      async () => {
        setDeletingClass(true);
        try {
          const response = await studentsApi.removeClassStudents(selectedListClass._id, selectedYear);
          const result = await response.json();
          if (!response.ok || !result.success) throw new Error(result.message || "ลบรายชื่อไม่สำเร็จ");
          showAlert(`ลบรายชื่อในวิชา ${selectedListClass.name} แล้ว ${result.deletedRelations} รายการ`, "success");
          await fetchStudents(selectedYear);
        } catch (error) {
          showAlert(error instanceof Error ? error.message : "ลบรายชื่อไม่สำเร็จ", "error");
        } finally {
          setDeletingClass(false);
        }
      },
      "delete",
      `ลบการลงทะเบียนทุก Section ของวิชานี้ในปีการศึกษา ${selectedYear} นักศึกษาที่ยังอยู่ในวิชาอื่นจะคงอยู่ ส่วนผู้ที่ไม่อยู่ในวิชาใดแล้วจะถูกลบออกจากระบบ`,
    );
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (yearRef.current && !yearRef.current.contains(e.target as Node)) {
        setOpenYear(false);
      }

      if (classRef.current && !classRef.current.contains(e.target as Node)) {
        setOpenClass(false);
        setClassSearch("");
      }

      if (majorRef.current && !majorRef.current.contains(e.target as Node)) {
        setOpenMajor(false);
        setMajorSearch("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const res = await classesApi.list();
        const data: { success: boolean; data: ClassDoc[] } = await res.json();

        if (data.success) {
          const loadedClasses = data.data.map((c) => ({
              _id: c._id,
              name: getClassName(c),
            }));
          setClasses(loadedClasses);
        }
      } catch (err) {
        //console.error(err);
      } finally {
        setClassesLoaded(true);
      }
    };

    const fetchMajors = async () => {
      try {
        const res = await majorsApi.list();
        const data: { success: boolean; data: MajorDoc[] } = await res.json();

        if (data.success) {
          setMajors(data.data.map((m) => m.name));
        }
      } catch (err) {
        //console.error(err);
      } finally {
      }
    };

    fetchClasses();
    fetchMajors();
  }, []);

  useEffect(() => {
    if (!classesLoaded || !studentsLoaded || initialClassSelected.current) return;
    initialClassSelected.current = true;
    const firstWithStudents = classes.find((course) =>
      data.some((student) =>
        (student.classes || []).some((enrollment) => enrollment.classId === course._id),
      ),
    );
    const requestedClassId = new URLSearchParams(window.location.search).get("classId");
    const requestedClass = classes.find((course) => course._id === requestedClassId);
    const defaultClass = requestedClass || firstWithStudents || classes[0];
    if (defaultClass) {
      setFilters((current) => current.classId
        ? current
        : { ...current, classId: defaultClass._id });
    }
  }, [classes, data, classesLoaded, studentsLoaded]);

  const fetchStudents = async (year?: number) => {
    try {
      setLoading(true);

      const res = await studentsApi.list({
        year: year || undefined,
        page: 1,
        limit: 500,
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error("API error");
      }

      const result = await res.json();

      if (!result.success) return;

      const allStudents: StudentInput[] = result.students || [];
      const total = Number(result.count || allStudents.length);
      for (let page = 2; allStudents.length < total; page++) {
        const nextResponse = await studentsApi.list({
          year: year || undefined,
          page,
          limit: 500,
        });
        if (!nextResponse.ok) throw new Error("โหลดรายชื่อนักศึกษาไม่สำเร็จ");
        const nextResult = await nextResponse.json();
        if (
          !nextResult.success ||
          !Array.isArray(nextResult.students) ||
          !nextResult.students.length
        )
          break;
        allStudents.push(...nextResult.students);
      }
      setData(allStudents);
      setYears(result.years || []);
      setSelectedYear(year ?? result.currentYear);

      setHasInitialData(allStudents.length > 0);
    } catch (err) {
      //console.error("FETCH ERROR:", err);
    } finally {
      setLoading(false);
      setStudentsLoaded(true);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const handleDeleteSuccess = (id: string) => {
    setData((prev) => prev.filter((s) => s._id !== id));
  };

  return (
    <div className="flex h-screen overflow-hidden bg-blue-50">
        <div className="min-h-0 min-w-0 flex-1 overflow-y-auto p-4 pt-[80px] font-noto sm:p-6 sm:pt-[80px] lg:pt-6">
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-gray-300">
            <div className="flex flex-col items-center gap-4">
              <div className="h-14 w-14 animate-spin rounded-full border-4 border-white border-t-transparent"></div>
              <p className="text-gray-600 text-base text-white">กำลังโหลด...</p>
            </div>
          </div>
        )}

        {!loading && (
          <div
            className={`flex min-w-0 flex-col rounded-2xl bg-white
            ${!hasInitialData ? "min-h-[90vh]" : ""}`}
          >
            <div className="flex flex-col gap-4 px-4 pt-5 sm:px-6 sm:pt-6 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h1 className="text-[26px] font-semibold text-gray-800">
                  Students
                </h1>
                <p className="text-sm text-gray-400 mt-1">
                  แสดงข้อมูลนักศึกษาในระบบ
                </p>
              </div>

              {hasInitialData && (
                <div className="flex w-full flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center lg:mt-[2px] lg:w-auto lg:justify-end">
                  <div
                    ref={yearRef}
                    className="relative flex items-center justify-between gap-2 sm:justify-start"
                  >
                    <span className="text-sm text-gray-500 whitespace-nowrap">
                      ปีการศึกษา:
                    </span>

                    <button
                      type="button"
                      onClick={() => setOpenYear(!openYear)}
                      className="h-[40px] px-3 border border-gray-200 rounded-md bg-white flex items-center justify-between text-sm hover:bg-gray-50 w-[100px] focus:outline-none focus:ring-1 focus:ring-gray-200 cursor-pointer"
                    >
                      <span
                        className={
                          selectedYear ? "text-gray-800" : "text-gray-400"
                        }
                      >
                        {selectedYear || "เลือกปี"}
                      </span>

                      <ChevronDownIcon className="w-4 h-4 text-blue-500 ml-2" />
                    </button>

                    {openYear && (
                      <div className="absolute right-0 top-[40px] z-20 bg-white border border-gray-200 rounded-md shadow max-h-48 overflow-y-auto w-[100px] cursor-pointer">
                        {years.length === 0 ? (
                          <div className="px-3 py-2 text-sm text-gray-400">
                            ไม่มีข้อมูลปี
                          </div>
                        ) : (
                          years.map((y) => (
                            <button
                              key={y}
                              onClick={() => {
                                setSelectedYear(y);
                                setOpenYear(false);
                                fetchStudents(y);
                              }}
                              className={`block w-full px-3 py-2 text-left text-sm cursor-pointer
                              ${
                                selectedYear === y
                                  ? "bg-blue-50 text-blue-600 font-medium"
                                  : "hover:bg-gray-100"
                              }`}
                            >
                              {y}
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={openImportDialog}
                    className="h-[40px] w-full px-4 rounded-md border border-gray-300 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer sm:w-auto"
                  >
                    Import
                  </button>

                  <button
                    onClick={() => router.push("/students/create")}
                    className="h-[40px] w-full px-5 rounded-md text-base bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] cursor-pointer sm:w-auto"
                  >
                    + เพิ่มนักศึกษา
                  </button>
                </div>
              )}
            </div>

            <div className="flex min-w-0 flex-1 flex-col px-4 pt-5 sm:px-6 sm:pt-6">
              {hasInitialData && (
                <div className="mb-4 min-w-0 w-full">
                  <StudentFilter
                    selectedClassId={filters.classId}
                    selectedBranch={effectiveBranch}
                    keyword={filters.keyword}
                    data={classes.map((c) => ({
                      _id: c._id,
                      className: c.name,
                      branches: [...(branchesByClass.get(c._id) || [])].map((m) => ({
                        _id: m,
                        name: m,
                      })),
                    }))}
                    onChange={(value) => {
                      setFilters(value);
                    }}
                  />
                </div>
              )}

              {!hasInitialData && (
                <div className="flex flex-1 flex-col items-center justify-center text-center">
                  <div className="mb-4 flex items-center justify-center w-28 h-28 rounded-full bg-gray-100">
                    <img src="/not-exist.png" className="w-28 h-28" />
                  </div>

                  <p className="text-sm text-gray-400 mb-4">
                    ยังไม่มีข้อมูลนักศึกษา
                  </p>

                  <button
                    onClick={openImportDialog}
                    className="px-5 py-2.5 rounded-md text-sm bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] flex items-center gap-2 shadow-sm cursor-pointer"
                  >
                    <DocumentArrowUpIcon className="w-5 h-5" />
                    Import
                  </button>
                </div>
              )}

              {hasInitialData && data.length === 0 && (
                <div className="flex flex-1 flex-col items-center justify-center text-center">
                  <div className="mb-4 flex items-center justify-center w-28 h-28 rounded-full bg-gray-100">
                    <img src="/not-exist.png" className="w-28 h-28" />
                  </div>

                  <p className="text-sm text-gray-400">
                    ยังไม่มีข้อมูลรายนักศึกษาล่าสุด
                  </p>
                </div>
              )}

              {hasInitialData && data.length > 0 && (
                <>
                  <div className="mt-2 mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-base font-semibold text-gray-600">
                      Student ทั้งหมด {filteredData.length} รายการ
                    </p>
                    {selectedListClass && selectedClassHasStudents && (
                      <button
                        type="button"
                        disabled={deletingClass}
                        onClick={handleDeleteClassStudents}
                        className="flex h-10 w-full shrink-0 cursor-pointer items-center justify-center gap-2 rounded-md border border-red-200 px-4 text-sm text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                      >
                        <TrashIcon className="h-4 w-4" />
                        {deletingClass ? "กำลังลบ..." : "ลบรายชื่อทั้งหมดในวิชานี้"}
                      </button>
                    )}
                  </div>

                  <div className="w-full pb-6.5">
                    <StudentTable
                      data={filteredData}
                      selectedClassId={filters.classId}
                      classHasStudents={selectedClassHasStudents}
                      onDeleteSuccess={handleDeleteSuccess}
                      onUpdateSuccess={() => { void fetchStudents(selectedYear || undefined); }}
                      onWithdrawSuccess={(studentId, className, section) => {
                        setData((prev) =>
                          prev.map((student) => {
                            if (student._id !== studentId) {
                              return student;
                            }

                            return {
                              ...student,
                              classes: (student.classes || []).filter(
                                (c) =>
                                  !(
                                    c.className === className &&
                                    c.section === section
                                  ),
                              ),
                            };
                          }),
                        );
                      }}
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {openImport && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="import-dialog-title"
          className="app-dialog-backdrop fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3 font-noto sm:p-6"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) bounceImportDialog();
          }}
        >
          <div
            ref={importDialogRef}
            className="app-dialog-panel max-h-[95vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-6 shadow-sm"
            onAnimationEnd={(event) => {
              if (event.animationName === "app-dialog-attention") {
                event.currentTarget.classList.remove("app-dialog-attention");
              }
            }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-[var(--card)]">
                <DocumentArrowUpIcon className="w-5 h-5 text-gray-700" />
              </div>

              <h2
                id="import-dialog-title"
                className="text-lg font-semibold text-gray-800"
              >
                นำเข้ารายชื่อนักศึกษา
              </h2>
            </div>

            <div className="border border-gray-50 bg-[var(--card)] rounded-xl p-4 space-y-4">
              <div ref={classRef} className="relative">
                <label className="text-sm text-gray-800">วิชา</label>

                <div className="relative">
                <input
                  aria-label="ค้นหาและเลือกวิชา"
                  disabled={importLoading}
                  value={openClass ? classSearch : selectedClass?.name || ""}
                  placeholder="เลือกหรือพิมพ์ค้นหาวิชา"
                  onFocus={() => { setClassSearch(""); setOpenClass(true); setOpenMajor(false); }}
                  onChange={(event) => { setClassSearch(event.target.value); setSelectedClass(null); setImportResults([]); setOpenClass(true); }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && filteredClasses[0]) {
                      event.preventDefault();
                      setSelectedClass(filteredClasses[0]);
                      setImportResults([]);
                      setOpenClass(false);
                      setClassSearch("");
                    }
                  }}
                  className="form-input-card w-full pr-9 text-sm"
                />
                <ChevronDownIcon className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                </div>

                {openClass && (
                  <div className="absolute z-10 mt-1 w-full rounded-md bg-white shadow-lg border border-gray-200 max-h-48 overflow-y-auto">
                    {filteredClasses.length === 0 ? (
                      <div className="px-4 py-2 text-sm text-gray-400">
                        {classes.length ? "ไม่พบวิชาที่ค้นหา" : "ไม่พบข้อมูลวิชา"}
                      </div>
                    ) : (
                      filteredClasses.map((c) => {
                        const isSelected = selectedClass?._id === c._id;

                        return (
                          <button
                            key={c._id}
                            onClick={() => {
                              setSelectedClass(c);
                              setImportResults([]);
                              setOpenClass(false);
                              setClassSearch("");
                            }}
                            className={`block w-full px-4 py-2 text-left text-sm cursor-pointer
                            ${
                              isSelected
                                ? "bg-blue-50 text-blue-600 font-medium"
                                : "hover:bg-gray-100"
                            }`}
                          >
                            {c.name}
                          </button>
                        );
                      })
                    )}
                  </div>
                )}
              </div>

              <div ref={majorRef} className="relative">
                <label className="text-sm text-gray-800">สาขา</label>

                <div className="relative">
                <input
                  aria-label="ค้นหาและเลือกสาขา"
                  disabled={importLoading}
                  value={openMajor ? majorSearch : selectedMajor}
                  placeholder="เลือกหรือพิมพ์ค้นหาสาขา"
                  onFocus={() => { setMajorSearch(""); setOpenMajor(true); setOpenClass(false); }}
                  onChange={(event) => { setMajorSearch(event.target.value); setSelectedMajor(""); setImportResults([]); setOpenMajor(true); }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && filteredMajors[0]) {
                      event.preventDefault();
                      setSelectedMajor(filteredMajors[0]);
                      setImportResults([]);
                      setOpenMajor(false);
                      setMajorSearch("");
                    }
                  }}
                  className="form-input-card w-full pr-9 text-sm"
                />
                <ChevronDownIcon className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                </div>

                {openMajor && (
                  <div className="absolute z-10 mt-1 w-full rounded-md bg-white shadow-lg border border-gray-200 max-h-48 overflow-y-auto">
                    {filteredMajors.length === 0 ? (
                      <div className="px-4 py-2 text-sm text-gray-400">
                        {majors.length ? "ไม่พบสาขาที่ค้นหา" : "ไม่พบข้อมูลสาขา"}
                      </div>
                    ) : (
                      filteredMajors.map((m) => {
                        const isSelected = selectedMajor === m;

                        return (
                          <button
                            key={m}
                            onClick={() => {
                              setSelectedMajor(m);
                              setImportResults([]);
                              setOpenMajor(false);
                              setMajorSearch("");
                            }}
                            className={`block w-full px-4 py-2 text-left text-sm cursor-pointer
                            ${
                              isSelected
                                ? "bg-blue-50 text-blue-600 font-medium"
                                : "hover:bg-gray-100"
                            }`}
                          >
                            {m}
                          </button>
                        );
                      })
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div>
                  <h3 className="text-sm font-medium text-gray-800">
                    ไฟล์รายชื่อตาม Section
                  </h3>
                  <p className="mt-1 text-xs text-gray-500">
                    กรอกหมายเลข Section และเลือกไฟล์ .xlsx หรือ .xls แยกกัน
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    รองรับคอลัมน์รหัสประจำตัว, ชื่อ และ kkumail โดยมีข้อมูลวิชาอยู่เหนือหัวตารางได้
                  </p>
                </div>
                {importRows.map((row, index) => (
                  <div
                    key={index}
                    className="rounded-xl border border-gray-200 bg-white p-3 sm:p-4"
                  >
                    <div className="flex items-center gap-2">
                      <div className="flex min-w-0 flex-1 items-center gap-2">
                        <label htmlFor={`import-section-${index}`} className="shrink-0 text-sm text-gray-600">Section</label>
                        <input
                          id={`import-section-${index}`}
                          type="text"
                          inputMode="numeric"
                          pattern="[1-9][0-9]*"
                          value={row.section}
                          placeholder="เช่น 4"
                          disabled={importLoading}
                          onChange={(event) => {
                            const section = event.target.value.replace(/\D/g, "");
                            setImportRows((rows) => rows.map((item, i) => i === index ? { ...item, section } : item));
                            setImportResults([]);
                          }}
                          onBlur={() => {
                            if (!row.section) return;
                            const section = String(Number(row.section));
                            setImportRows((rows) => rows.map((item, i) => i === index ? { ...item, section } : item));
                          }}
                          className="form-input-card min-w-0 flex-1 text-sm"
                        />
                      </div>
                      {importRows.length > 1 && (
                        <button
                          type="button"
                          disabled={importLoading}
                          onClick={() => {
                            setImportRows((rows) =>
                              rows.filter((_, i) => i !== index),
                            );
                            setImportResults([]);
                          }}
                          className="shrink-0 cursor-pointer px-2 py-2 text-sm text-red-500 hover:text-red-600 disabled:opacity-50"
                        >
                          ลบ
                        </button>
                      )}
                    </div>
                    <label className="mt-3 flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-gray-300 px-3 py-3 text-sm text-gray-600 hover:bg-gray-50">
                      <DocumentArrowUpIcon className="h-5 w-5 shrink-0 text-gray-400" />
                      <span className="min-w-0 truncate">
                        {row.file?.name || "เลือกไฟล์ Excel (.xlsx, .xls)"}
                      </span>
                      <input
                        type="file"
                        accept=".xlsx,.xls"
                        disabled={importLoading}
                        className="sr-only"
                        onChange={(event) => {
                          const file = event.target.files?.[0] || null;
                          if (file && !/\.(xlsx|xls)$/i.test(file.name)) {
                            event.target.value = "";
                            setImportRows((rows) => rows.map((item, i) => i === index ? { ...item, file: null } : item));
                            setImportResults([{ section: row.section || "-", success: false, message: "รองรับเฉพาะไฟล์ .xlsx และ .xls" }]);
                            return;
                          }
                          setImportRows((rows) =>
                            rows.map((item, i) =>
                              i === index ? { ...item, file } : item,
                            ),
                          );
                          setImportResults([]);
                        }}
                      />
                    </label>
                  </div>
                ))}
                <button
                    type="button"
                    disabled={importLoading}
                    onClick={() => {
                      setImportRows((rows) => [
                        ...rows,
                        { section: "", file: null },
                      ]);
                      setImportResults([]);
                    }}
                    className="cursor-pointer text-sm font-medium text-blue-600 hover:underline disabled:opacity-50"
                  >
                    + เพิ่ม Section
                </button>
              </div>
            </div>

            {importResults.length > 0 && (
              <div
                role="status"
                className="mt-4 space-y-1 rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm"
              >
                {importResults.map((result) => (
                  <p
                    key={result.section}
                    className={
                      result.success ? "text-green-700" : "text-red-600"
                    }
                  >
                    Section {result.section}: {result.message}
                  </p>
                ))}
              </div>
            )}

            <div className="flex justify-end gap-2 mt-6">
              <button
                ref={cancelImportRef}
                type="button"
                disabled={importLoading}
                onClick={() => setOpenImport(false)}
                className="px-4 py-2 rounded-md border border-gray-300 text-gray-600 text-sm hover:bg-gray-100 cursor-pointer"
              >
                {importResults.length ? "ปิด" : "ยกเลิก"}
              </button>

              <button
                type="button"
                disabled={!canImport || importLoading || allImportsComplete}
                onClick={async () => {
                  if (!canImport || allImportsComplete || importLoading) return;

                  setImportLoading(true);
                  const importedClass = selectedClass;
                  const results: ImportResult[] = importResults.filter(
                    (result) => result.success,
                  );
                  for (const row of importRows) {
                    if (
                      results.some(
                        (result) =>
                          result.section === row.section && result.success,
                      )
                    )
                      continue;
                    try {
                      const formData = new FormData();
                      formData.append("file", row.file as File);
                      formData.append("classId", selectedClass?._id || "");
                      formData.append("major", selectedMajor);
                      formData.append("section", row.section);
                      const res = await studentsApi.uploadFile(formData);
                      const result = await res.json();
                      const errorCount = result.summary?.errors ?? result.errors?.length ?? 0;
                      const firstError = result.errors?.[0]?.message;
                      const warningCount = result.summary?.warnings ?? result.warnings?.length ?? 0;
                      const firstWarning = result.warnings?.[0]?.message;
                      const outcome: ImportResult = {
                        section: row.section,
                        success: res.ok && result.success,
                        message:
                          res.ok && result.success
                            ? `เพิ่ม ${result.summary?.added ?? 0} คน, มีอยู่แล้ว ${result.summary?.exists ?? 0} คน, ข้อมูลผิดพลาด ${errorCount} คน${warningCount ? `, ข้ามอีเมล ${warningCount} แถว` : ""}${firstError || firstWarning ? ` (${firstError || firstWarning})` : ""}`
                            : `${result.message || "นำเข้าไม่สำเร็จ"}${firstError ? ` — ${firstError}` : ""}`,
                      };
                      const existingIndex = results.findIndex(
                        (item) => item.section === row.section,
                      );
                      if (existingIndex >= 0) results[existingIndex] = outcome;
                      else results.push(outcome);
                    } catch {
                      const outcome = {
                        section: row.section,
                        success: false,
                        message: "เชื่อมต่อเซิร์ฟเวอร์ไม่ได้",
                      };
                      const existingIndex = results.findIndex(
                        (item) => item.section === row.section,
                      );
                      if (existingIndex >= 0) results[existingIndex] = outcome;
                      else results.push(outcome);
                    }
                    setImportResults([...results]);
                  }
                  if (results.length === importRows.length && results.every((result) => result.success)) {
                    const importYear = new Date().getFullYear() + 543;
                    await fetchStudents(importYear);
                    setFilters({ keyword: "", classId: importedClass?._id || "", branch: "", section: "" });
                    setOpenImport(false);
                    showAlert(`นำเข้ารายชื่อวิชา ${importedClass?.name || "ที่เลือก"} สำเร็จ`, "success");
                  } else if (results.some((result) => result.success)) {
                    await fetchStudents(new Date().getFullYear() + 543);
                  }
                  setImportLoading(false);
                }}
                className={`px-5 py-2.5 rounded-md text-white text-sm transition
                ${
                  canImport && !importLoading && !allImportsComplete
                    ? "bg-[var(--primary)] hover:bg-[var(--primary-hover)] cursor-pointer"
                    : "bg-gray-300"
                }`}
              >
                {importLoading
                  ? "กำลังนำเข้า..."
                  : importResults.some((result) => !result.success)
                    ? "ลองนำเข้าส่วนที่ไม่สำเร็จ"
                    : allImportsComplete
                      ? "นำเข้าสำเร็จ"
                      : "นำเข้ารายชื่อ"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

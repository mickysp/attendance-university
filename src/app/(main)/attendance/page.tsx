"use client";

import {
  AcademicCapIcon,
  BookOpenIcon,
  MagnifyingGlassIcon,
  UserGroupIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { useEffect, useMemo, useState } from "react";
import StudentSummaryCard from "@/components/attendance/Card";
import AttendanceDropdown from "@/components/attendance/Dropdown";
import AttendanceTable from "@/components/attendance/Table";
import EmptyStateIcon from "@/components/common/EmptyStateIcon";
import { attendanceApi } from "@/services/api/attendance";
import { classesApi } from "@/services/api/classes";
import type {
  AttendanceClassOption,
  AttendanceStatus,
  StudentAttendance,
} from "@/types/attendance";

export default function AttendancePage() {
  const [classes, setClasses] = useState<AttendanceClassOption[]>([]);
  const [students, setStudents] = useState<StudentAttendance[]>([]);
  const [years, setYears] = useState<number[]>([]);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedMajor, setSelectedMajor] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<AttendanceStatus | null>(
    null,
  );
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [studentsReady, setStudentsReady] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    async function loadClasses() {
      setLoading(true);
      setError("");
      try {
        const response = await classesApi.list(
          { year: selectedYear ?? undefined },
          { signal: controller.signal, cache: "no-store" },
        );
        const result = await response.json();
        if (!response.ok || !result.success)
          throw new Error(result.message || "โหลดข้อมูลชั้นเรียนไม่สำเร็จ");
        const availableYears = Array.isArray(result.years) ? result.years : [];
        setClasses(Array.isArray(result.data) ? result.data : []);
        setYears(availableYears);
        if (!selectedYear) {
          const currentAcademicYear = Number(result.currentAcademicYear);
          setSelectedYear(
            Number.isFinite(currentAcademicYear)
              ? currentAcademicYear
              : availableYears[0] || null,
          );
        }
      } catch (cause) {
        if (!controller.signal.aborted)
          setError(
            cause instanceof Error
              ? cause.message
              : "โหลดข้อมูลชั้นเรียนไม่สำเร็จ",
          );
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void loadClasses();
    return () => controller.abort();
  }, [selectedYear]);

  useEffect(() => {
    if (!selectedClass) {
      setStudents([]);
      setStudentsReady(false);
      setLoadingStudents(false);
      return;
    }
    const controller = new AbortController();
    async function loadStudents() {
      setLoadingStudents(true);
      setStudentsReady(false);
      setStudents([]);
      setError("");
      try {
        const response = await attendanceApi.summary(
          { classId: selectedClass, year: selectedYear },
          { signal: controller.signal, cache: "no-store" },
        );
        const result = await response.json();
        if (!response.ok || !result.success)
          throw new Error(result.message || "โหลดข้อมูลการเข้าเรียนไม่สำเร็จ");
        if (!controller.signal.aborted) {
          setStudents(Array.isArray(result.data) ? result.data : []);
          setStudentsReady(true);
        }
      } catch (cause) {
        if (!controller.signal.aborted) {
          setStudents([]);
          setStudentsReady(true);
          setError(
            cause instanceof Error
              ? cause.message
              : "โหลดข้อมูลการเข้าเรียนไม่สำเร็จ",
          );
        }
      } finally {
        if (!controller.signal.aborted) setLoadingStudents(false);
      }
    }
    void loadStudents();
    return () => controller.abort();
  }, [selectedClass, selectedYear]);

  const majors = useMemo(
    () =>
      [...new Set(students.map((student) => student.major).filter(Boolean))]
        .filter((major) => major !== "-")
        .sort(),
    [students],
  );
  const sections = useMemo(
    () =>
      [
        ...new Set(
          students
            .filter(
              (student) => !selectedMajor || student.major === selectedMajor,
            )
            .map((student) => student.section)
            .filter(Boolean),
        ),
      ]
        .filter((section) => section !== "-")
        .sort((left, right) =>
          left.localeCompare(right, "th", { numeric: true }),
        ),
    [selectedMajor, students],
  );
  const visibleStudents = useMemo(() => {
    const query = keyword.trim().toLocaleLowerCase("th");
    return students.filter(
      (student) =>
        (!selectedMajor || student.major === selectedMajor) &&
        (!selectedSection || student.section === selectedSection) &&
        (!selectedStatus || student.status === selectedStatus) &&
        (!query ||
          student.name.toLocaleLowerCase("th").includes(query) ||
          student.studentId.toLocaleLowerCase("th").includes(query)),
    );
  }, [keyword, selectedMajor, selectedSection, selectedStatus, students]);

  function resetFilters() {
    setSelectedMajor("");
    setSelectedSection("");
    setSelectedStatus(null);
    setKeyword("");
  }

  return (
    <div className="app-page" aria-busy={loading || loadingStudents}>
      {(loading || loadingStudents) && (
        <div
          className="absolute inset-0 z-10 flex items-center justify-center bg-gray-300"
          role="status"
        >
          <div className="flex flex-col items-center gap-4">
            <div className="h-14 w-14 animate-spin rounded-full border-4 border-white border-t-transparent" />
            <p className="text-base text-white">กำลังโหลด...</p>
          </div>
        </div>
      )}
      <div className="flex min-h-full flex-col gap-5 sm:gap-6">
        <header className="app-page-header">
          <div>
            <h1 className="app-page-title">เวลาเข้าเรียน</h1>
            <p className="app-page-description">
              ตรวจสอบการเช็กชื่อ คะแนน และประวัติการเข้าเรียนรายนักศึกษา
            </p>
          </div>
          <div className="w-full sm:w-48">
            <span className="mb-1.5 block text-xs font-medium text-gray-500">
              ปีการศึกษา
            </span>
            <AttendanceDropdown
              value={selectedYear ? String(selectedYear) : ""}
              options={years.map((year) => ({
                value: String(year),
                label: String(year),
              }))}
              placeholder="เลือกปี"
              ariaLabel="เลือกปีการศึกษา"
              allowEmpty={false}
              onChange={(value) => {
                setSelectedYear(value ? Number(value) : null);
                setSelectedClass("");
                setStudents([]);
                setStudentsReady(false);
                setLoadingStudents(false);
                resetFilters();
              }}
            />
          </div>
        </header>

        <section className="app-card" aria-labelledby="attendance-filter-title">
          <div className="border-b border-gray-100 px-5 py-5 sm:px-6">
            <h2
              id="attendance-filter-title"
              className="text-lg font-semibold text-gray-800"
            >
              เลือกข้อมูลที่ต้องการตรวจสอบ
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              เริ่มจากเลือกวิชา แล้วกรองรายชื่อตามสาขาหรือ Section
            </p>
          </div>
          <div className="grid gap-4 p-5 sm:p-6 lg:grid-cols-3">
            <FilterField
              number="1"
              icon={BookOpenIcon}
              label="วิชา"
              value={selectedClass}
              onChange={(value) => {
                setStudents([]);
                setStudentsReady(false);
                setLoadingStudents(Boolean(value));
                setSelectedClass(value);
                resetFilters();
              }}
              options={classes.map((item) => ({
                value: item._id,
                label: `${item.className || item.name || "ไม่ระบุชื่อวิชา"}${item.classCode ? ` (${item.classCode})` : ""}`,
              }))}
              placeholder="เลือกวิชา"
            />
            <FilterField
              number="2"
              icon={AcademicCapIcon}
              label="สาขา"
              value={selectedMajor}
              onChange={(value) => {
                setSelectedMajor(value);
                setSelectedSection("");
              }}
              options={majors.map((major) => ({ value: major, label: major }))}
              placeholder="ทุกสาขา"
              disabled={!selectedClass || students.length === 0}
            />
            <FilterField
              number="3"
              icon={UserGroupIcon}
              label="Section"
              value={selectedSection}
              onChange={setSelectedSection}
              options={sections.map((section) => ({
                value: section,
                label: `Section ${section}`,
              }))}
              placeholder="ทุก Section"
              disabled={!selectedClass || students.length === 0}
            />
          </div>
        </section>

        {error && (
          <div
            className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            role="alert"
          >
            {error}
          </div>
        )}
        {!selectedClass ? (
          <EmptyAttendanceState
            kind="classes"
            title="เลือกวิชาเพื่อเริ่มตรวจสอบ"
            description="ระบบจะแสดงรายชื่อนักศึกษาและสรุปการเข้าเรียนของวิชาที่เลือก"
          />
        ) : studentsReady && students.length === 0 ? (
          <EmptyAttendanceState
            kind="students"
            title="ยังไม่มีข้อมูลนักศึกษา"
            description="วิชานี้ยังไม่มีนักศึกษาหรือข้อมูลการเข้าเรียนในปีการศึกษาที่เลือก"
          />
        ) : studentsReady ? (
          <>
            <StudentSummaryCard
              students={students}
              selectedStatus={selectedStatus}
              onSelectStatus={(status) =>
                setSelectedStatus((current) =>
                  current === status ? null : status,
                )
              }
            />
            <section className="app-card min-h-[420px]">
              <div className="flex flex-col gap-4 border-b border-gray-100 px-5 py-5 sm:px-6 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-800">
                    รายชื่อนักศึกษา
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    พบ {visibleStudents.length.toLocaleString("th-TH")} จาก{" "}
                    {students.length.toLocaleString("th-TH")} คน
                  </p>
                </div>
                <div className="relative w-full lg:max-w-sm">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    type="search"
                    value={keyword}
                    onChange={(event) => setKeyword(event.target.value)}
                    placeholder="ค้นหาชื่อหรือรหัสนักศึกษา"
                    className="app-field pl-9 pr-9"
                  />
                  {keyword && (
                    <button
                      type="button"
                      onClick={() => setKeyword("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-gray-400 hover:text-gray-700"
                      aria-label="ล้างคำค้นหา"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
              <div className="p-4 sm:p-6">
                <AttendanceTable
                  classId={selectedClass}
                  data={visibleStudents}
                />
              </div>
            </section>
          </>
        ) : null}
      </div>
    </div>
  );
}

type FilterFieldProps = {
  number: string;
  icon: typeof BookOpenIcon;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder: string;
  disabled?: boolean;
};

function FilterField({
  number,
  icon: Icon,
  label,
  value,
  onChange,
  options,
  placeholder,
  disabled = false,
}: FilterFieldProps) {
  return (
    <div className="min-w-0">
      <span className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-50 text-xs font-semibold text-blue-600">
          {number}
        </span>
        <Icon className="h-4 w-4 text-gray-400" />
        {label}
      </span>
      <AttendanceDropdown
        value={value}
        disabled={disabled}
        onChange={onChange}
        options={options}
        placeholder={placeholder}
        ariaLabel={`เลือก${label}`}
      />
    </div>
  );
}

function EmptyAttendanceState({
  kind,
  title,
  description,
}: {
  kind: "classes" | "students";
  title: string;
  description: string;
}) {
  return (
    <section className="app-card flex min-h-[420px] flex-col items-center justify-center px-6 text-center">
      <EmptyStateIcon kind={kind} />
      <h2 className="text-base font-semibold text-gray-700">{title}</h2>
      <p className="mt-1 max-w-lg text-sm text-gray-500">{description}</p>
    </section>
  );
}

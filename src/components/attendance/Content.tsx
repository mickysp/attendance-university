"use client";
import { useLanguage, getLocale } from "@/lib/language";

import { MagnifyingGlassIcon, XMarkIcon } from "@heroicons/react/24/outline";
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

export default function AttendanceContent() {
  const { tr } = useLanguage();

  const [classes, setClasses] = useState<AttendanceClassOption[]>([]);
  const [summaries, setSummaries] = useState<
    Record<string, { students: StudentAttendance[]; error?: string }>
  >({});
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
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    async function loadPage() {
      setLoading(true);
      setError("");
      try {
        const response = await classesApi.list(
          {},
          { signal: controller.signal, cache: "no-store" },
        );
        const result = await response.json();
        if (!response.ok || !result.success)
          throw new Error(result.message || "โหลดข้อมูลชั้นเรียนไม่สำเร็จ");
        const availableClasses: AttendanceClassOption[] = Array.isArray(
          result.data,
        )
          ? result.data
          : [];
        const currentAcademicYear = Number(result.currentAcademicYear);
        const availableYears: number[] = [
          ...new Set<number>([
            ...(Array.isArray(result.years) ? result.years : []),
            ...(Number.isFinite(currentAcademicYear)
              ? [currentAcademicYear]
              : []),
          ]),
        ].sort((left, right) => right - left);
        const tasks = availableYears.flatMap((year) =>
          availableClasses.map((item) => ({ classId: item._id, year })),
        );
        const loadedSummaries: typeof summaries = {};
        let nextTask = 0;

        // Bound concurrent requests while preloading every selectable class/year.
        async function loadSummaries() {
          while (nextTask < tasks.length && !controller.signal.aborted) {
            const task = tasks[nextTask++];
            const key = `${task.year}:${task.classId}`;
            try {
              const response = await attendanceApi.summary(task, {
                signal: controller.signal,
                cache: "no-store",
              });
              const result = await response.json();
              if (!response.ok || !result.success)
                throw new Error(
                  result.message || "โหลดข้อมูลการเข้าเรียนไม่สำเร็จ",
                );
              loadedSummaries[key] = {
                students: Array.isArray(result.data) ? result.data : [],
              };
            } catch (cause) {
              if (controller.signal.aborted) return;
              loadedSummaries[key] = {
                students: [],
                error:
                  cause instanceof Error
                    ? cause.message
                    : "โหลดข้อมูลการเข้าเรียนไม่สำเร็จ",
              };
            }
          }
        }
        await Promise.all(
          Array.from({ length: Math.min(4, tasks.length) }, loadSummaries),
        );
        if (controller.signal.aborted) return;
        setClasses(availableClasses);
        setYears(availableYears);
        setSelectedYear(
          Number.isFinite(currentAcademicYear)
            ? currentAcademicYear
            : (availableYears[0] ?? null),
        );
        setSummaries(loadedSummaries);
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
    void loadPage();
    return () => controller.abort();
  }, []);

  const summary = summaries[`${selectedYear}:${selectedClass}`];
  const students = useMemo(() => summary?.students ?? [], [summary]);
  const studentsReady = !loading && Boolean(summary) && !summary.error;
  const displayError = error || summary?.error;

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

  if (loading) {
    return (
      <div
        className="absolute inset-0 z-10 flex items-center justify-center bg-gray-300"
        role="status"
        aria-busy="true"
      >
        <div className="flex flex-col items-center gap-4">
          <div className="h-14 w-14 animate-spin rounded-full border-4 border-white border-t-transparent" />
          <p className="text-base text-white">{tr("กำลังโหลด...")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-[min(800px,calc(100dvh-96px))] min-w-0 flex-col rounded-2xl bg-white sm:min-h-[min(800px,calc(100dvh-104px))] lg:min-h-[min(800px,calc(100dvh-48px))] dark:bg-[#172235]">
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex flex-col gap-4 px-5 pt-5 pb-2 sm:flex-row sm:items-start sm:justify-between sm:px-6">
          <div>
            <h1 className="app-page-title">{tr("เวลาเข้าเรียน")}</h1>
            <p className="app-page-description">
              {tr("ตรวจสอบการเช็กชื่อ คะแนน และประวัติการเข้าเรียนรายนักศึกษา")}
            </p>
          </div>
          <div className="flex w-full items-center gap-2 sm:w-auto">
            <span className="shrink-0 text-sm text-gray-500">
              {tr("ปีการศึกษา")}
            </span>
            <div className="min-w-0 flex-1 sm:w-[100px] sm:flex-none">
              <AttendanceDropdown
                value={selectedYear ? String(selectedYear) : ""}
                options={years.map((year) => ({
                  value: String(year),
                  label: String(year),
                }))}
                placeholder={tr("เลือกปี")}
                ariaLabel={tr("เลือกปีการศึกษา")}
                allowEmpty={false}
                onChange={(value) => {
                  setSelectedYear(value ? Number(value) : null);
                  setSelectedClass("");
                  resetFilters();
                }}
              />
            </div>
          </div>
        </header>

        <section aria-label={tr("เลือกข้อมูลที่ต้องการตรวจสอบ")}>
          <div className="px-5 py-4 sm:px-6">
            <div className="flex w-full flex-wrap items-end gap-3">
              <FilterField
                className="w-full min-w-0 sm:w-[280px] sm:flex-none"
                label={tr("วิชา")}
                value={selectedClass}
                onChange={(value) => {
                  setSelectedClass(value);
                  resetFilters();
                }}
                options={classes.map((item) => ({
                  value: item._id,
                  label: getClassLabel(item),
                }))}
                placeholder={tr("เลือกวิชา")}
              />
              <FilterField
                className="w-full min-w-0 sm:w-[280px] sm:flex-none"
                label={tr("สาขา")}
                value={selectedMajor}
                onChange={(value) => {
                  setSelectedMajor(value);
                  setSelectedSection("");
                }}
                options={majors.map((major) => ({
                  value: major,
                  label: major,
                }))}
                placeholder={tr("ทุกสาขา")}
                disabled={!selectedClass || students.length === 0}
              />
              <FilterField
                className="w-full min-w-0 sm:w-[280px] sm:flex-none"
                label="Section"
                value={selectedSection}
                onChange={setSelectedSection}
                options={sections.map((section) => ({
                  value: section,
                  label: `Section ${section}`,
                }))}
                placeholder={tr("ทุก Section")}
                disabled={!selectedClass || students.length === 0}
              />
            </div>
          </div>
        </section>

        {displayError && (
          <div
            className="mx-5 mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 sm:mx-6"
            role="alert"
          >
            {tr(displayError)}
          </div>
        )}
        {!selectedClass ? (
          <EmptyAttendanceState
            kind="classes"
            title={tr("เลือกวิชาเพื่อเริ่มตรวจสอบ")}
            description={tr(
              "ระบบจะแสดงรายชื่อนักศึกษาและสรุปการเข้าเรียนของวิชาที่เลือก",
            )}
          />
        ) : studentsReady && students.length === 0 ? (
          <EmptyAttendanceState
            kind="students"
            title={tr("ยังไม่มีข้อมูลนักศึกษา")}
            description={tr(
              "วิชานี้ยังไม่มีนักศึกษาหรือข้อมูลการเข้าเรียนในปีการศึกษาที่เลือก",
            )}
          />
        ) : studentsReady ? (
          <>
            <div className="px-5 pb-4 sm:px-6">
              <StudentSummaryCard
                students={students}
                selectedStatus={selectedStatus}
                onSelectStatus={(status) =>
                  setSelectedStatus((current) =>
                    current === status ? null : status,
                  )
                }
              />
            </div>
            <section className="min-w-0 flex-1">
              <div className="flex flex-col gap-3 px-5 pb-4 sm:px-6 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <h2 className="text-base font-semibold text-gray-800">
                    {tr("รายชื่อนักศึกษา")}
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    {tr("พบ")}{" "}
                    {visibleStudents.length.toLocaleString(getLocale())}{" "}
                    {tr("จาก")} {students.length.toLocaleString(getLocale())}{" "}
                    {tr("คน")}
                  </p>
                </div>
                <div className="relative w-full lg:max-w-sm">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    type="search"
                    value={keyword}
                    onChange={(event) => setKeyword(event.target.value)}
                    placeholder={tr("ค้นหาชื่อหรือรหัสนักศึกษา")}
                    className="app-field pl-9 pr-9"
                  />
                  {keyword && (
                    <button
                      type="button"
                      onClick={() => setKeyword("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-gray-400 hover:text-gray-700"
                      aria-label={tr("ล้างคำค้นหา")}
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
              <div className="px-5 pb-5 sm:px-6 sm:pb-6">
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
  className?: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder: string;
  disabled?: boolean;
};

function FilterField({
  className = "min-w-0",
  label,
  value,
  onChange,
  options,
  placeholder,
  disabled = false,
}: FilterFieldProps) {
  const { tr } = useLanguage();

  return (
    <div className={className}>
      <span className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700">
        {tr(label)}
      </span>
      <AttendanceDropdown
        value={value}
        searchable
        disabled={disabled}
        onChange={onChange}
        options={options}
        placeholder={tr(placeholder)}
        ariaLabel={tr("เลือก{0}", { 0: label })}
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
  const { tr } = useLanguage();

  return (
    <section className="flex min-h-[240px] flex-1 flex-col items-center justify-center px-6 py-6 text-center">
      <EmptyStateIcon kind={kind} />
      <h2 className="text-base font-semibold text-gray-700">{tr(title)}</h2>
      <p className="mt-1 max-w-lg text-sm text-gray-500">{tr(description)}</p>
    </section>
  );
}

function getClassLabel(item: AttendanceClassOption) {
  const name = item.className || item.name || "ไม่ระบุชื่อวิชา";
  const code = item.classCode || item.classCodes?.join(", ");
  return code ? `${name} (${code})` : name;
}

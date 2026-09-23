"use client";

import { studentsApi } from "@/services/api/students";
import { useState, useEffect, useRef } from "react";
import {
  UserCircleIcon,
  ChevronDownIcon,
  PencilSquareIcon,
  TrashIcon,
  EyeIcon,
} from "@heroicons/react/24/outline";
import EmptyStateIcon from "@/components/common/EmptyStateIcon";
import { useConfirm } from "@/context/swal";
import { useAlert } from "@/context/AlertContext";

type Student = {
  _id: string;
  studentId: string;
  fullName: string;
  email?: string;
  section?: string;
  classes?: {
    classId?: string;
    className: string;
    section: string;
    academicYear: number;
  }[];
};

export default function StudentTable({
  data,
  selectedClassId,
  classHasStudents,
  onDeleteSuccess,
  onUpdateSuccess,
  onWithdrawSuccess,
}: {
  data: Student[];
  selectedClassId: string;
  classHasStudents: boolean;
  onDeleteSuccess: (id: string) => void;
  onUpdateSuccess: (student: Student) => void;
  onWithdrawSuccess: (
    studentId: string,
    className: string,
    section: string,
  ) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [openView, setOpenView] = useState(false);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [page, setPage] = useState(1);
  const [openPageSize, setOpenPageSize] = useState(false);
  const pageSizeRef = useRef<HTMLDivElement>(null);

  const { showConfirm } = useConfirm();
  const { showAlert } = useAlert();

  const totalPages = Math.max(1, Math.ceil(data.length / itemsPerPage));
  const currentPage = Math.min(page, totalPages);

  const [originalStudent, setOriginalStudent] = useState<Student | null>(null);
  const [openEdit, setOpenEdit] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  const [editingClasses, setEditingClasses] = useState<
    { className: string; section: string }[]
  >([]);

  const paginatedData = data.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const getSectionLabels = (student: Student) => {
    const enrollments = selectedClassId
      ? (student.classes || []).filter(
          (course) => course.classId === selectedClassId,
        )
      : student.classes || [];
    const labels = enrollments.map((course) =>
      selectedClassId
        ? `Section ${course.section || "-"}`
        : `${course.className || "ไม่ทราบวิชา"} · Section ${course.section || "-"}`,
    );
    return [
      ...new Set(
        labels.length
          ? labels
          : student.section
            ? [`Section ${student.section}`]
            : [],
      ),
    ];
  };

  const getSectionBadgeColor = (label: string) => {
    const number = Number(label.match(/Section\s+(\d+)/)?.[1]);
    const colors = [
      "bg-blue-50 text-blue-700",
      "bg-emerald-50 text-emerald-700",
      "bg-amber-50 text-amber-700",
      "bg-violet-50 text-violet-700",
      "bg-rose-50 text-rose-700",
    ];
    return colors[
      Number.isInteger(number) && number > 0 ? (number - 1) % colors.length : 0
    ];
  };

  const isDirty =
    selectedStudent?.studentId !== originalStudent?.studentId ||
    selectedStudent?.fullName !== originalStudent?.fullName ||
    selectedStudent?.email !== originalStudent?.email ||
    JSON.stringify(editingClasses) !==
      JSON.stringify(
        (originalStudent?.classes || []).map((c) => ({
          className: c.className,
          section: c.section || "",
        })),
      );

  const isValidSection = (section: string) => /^[0-9]+$/.test(section);
  const isValidStudentId = (id: string) => /^\d{9}-\d$/.test(id);
  const isValidName = (name: string) => /^(นาย|นาง|นางสาว)/.test(name);
  const isValidEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const isFormValid =
    selectedStudent &&
    selectedStudent.studentId.trim().length > 0 &&
    selectedStudent.fullName.trim().length > 0 &&
    isValidStudentId(selectedStudent.studentId) &&
    isValidName(selectedStudent.fullName.trim()) &&
    (!selectedStudent.email || isValidEmail(selectedStudent.email.trim())) &&
    editingClasses.length > 0 &&
    editingClasses.every(
      (c) =>
        c.className.trim().length > 0 &&
        c.section.trim().length > 0 &&
        isValidSection(c.section),
    );

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        pageSizeRef.current &&
        !pageSizeRef.current.contains(e.target as Node)
      ) {
        setOpenPageSize(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getVisiblePages = () => {
    const pages = [];

    const maxVisible = 4;

    let start = Math.max(1, currentPage - 1);
    let end = start + maxVisible - 1;

    if (end > totalPages) {
      end = totalPages;
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return pages;
  };

  const handleDelete = (id: string) => {
    showConfirm(
      "ลบข้อมูล?",
      async () => {
        try {
          const res = await studentsApi.remove(id);

          if (!res.ok) {
            const text = await res.text();
            throw new Error(text);
          }

          const data = await res.json();

          showAlert(data.message || "ลบข้อมูลสำเร็จ", "success");

          onDeleteSuccess(id);
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : "เกิดข้อผิดพลาด";
          showAlert(message, "error");
        }
      },
      "delete",
      "คุณต้องการลบข้อมูลใช่หรือไม่",
    );
  };

  const handleEdit = (student: Student) => {
    setSelectedStudent(student);
    setOriginalStudent(JSON.parse(JSON.stringify(student)));
    setEditingClasses(
      (student.classes || []).map((course) => ({
        className: course.className,
        section: course.section || "",
      })),
    );
    setOpenEdit(true);
  };

  const handleUpdateStudent = async () => {
    if (!selectedStudent) return;

    try {
      setLoading(true);

      const payload: Student = {
        ...selectedStudent,
        classes: editingClasses
          .filter((c) => c.className.trim() !== "")
          .map((c, i) => ({
            className: c.className,
            section: c.section,
            academicYear: selectedStudent.classes?.[i]?.academicYear || 0,
          })),
      };

      const res = await studentsApi.update(payload);

      const data = await res.json();

      if (!res.ok) {
        showAlert(data.message, "error");
        return;
      }

      showAlert("อัปเดตสำเร็จ", "success");
      onUpdateSuccess(payload);
      setOpenEdit(false);
    } catch {
      showAlert("เกิดข้อผิดพลาด", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = (
    student: Student,
    className: string,
    section: string,
  ) => {
    showConfirm(
      "ถอนวิชา?",
      async () => {
        try {
          const res = await studentsApi.withdrawCourse({
            studentId: student._id,
            className,
            section,
          });

          const data = await res.json();

          if (!res.ok) {
            showAlert(data.message, "error");
            return;
          }

          showAlert("ถอนวิชาสำเร็จ", "success");

          onWithdrawSuccess(student._id, className, section);

          setSelectedStudent((prev) => {
            if (!prev) return prev;

            return {
              ...prev,
              classes: (prev.classes || []).filter(
                (c) => !(c.className === className && c.section === section),
              ),
            };
          });
        } catch {
          showAlert("เกิดข้อผิดพลาด", "error");
        }
      },
      "withdraw",
      `คุณต้องการถอนวิชา ${className} Section ${section} ใช่หรือไม่`,
    );
  };

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <EmptyStateIcon kind="search" />
        <p className="whitespace-nowrap text-sm text-gray-500">
          {selectedClassId && !classHasStudents
            ? "วิชานี้ยังไม่มีรายชื่อนักศึกษา"
            : "ไม่พบรายชื่อนักศึกษาที่ตรงกับตัวกรอง"}
        </p>
      </div>
    );
  }

  return (
    <div className="min-w-0 w-full">
      <div className="space-y-3 md:hidden">
        {paginatedData.map((student) => (
          <div
            key={student._id}
            className="w-full rounded-xl border border-gray-200 bg-white p-4"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-4">
                <span className="shrink-0 text-sm text-gray-500">
                  รหัสนักศึกษา
                </span>
                <span className="min-w-0 max-w-[65%] break-words text-right text-sm text-gray-700">
                  {student.studentId}
                </span>
              </div>
              <div className="flex items-start justify-between gap-4">
                <span className="shrink-0 text-sm text-gray-500">
                  ชื่อ-นามสกุล
                </span>
                <span className="min-w-0 max-w-[65%] break-words text-right text-sm text-gray-700">
                  {student.fullName}
                </span>
              </div>
              <div className="flex items-start justify-between gap-4">
                <span className="shrink-0 text-sm text-gray-500">อีเมล</span>
                <span className="min-w-0 max-w-[65%] break-all text-right text-sm text-gray-700">
                  {student.email || "-"}
                </span>
              </div>
              <div className="flex items-start justify-between gap-4">
                <span className="shrink-0 text-sm text-gray-500">Section</span>
                <div className="flex min-w-0 max-w-[65%] flex-wrap justify-end gap-1 text-right">
                  {getSectionLabels(student).length ? (
                    getSectionLabels(student).map((label) => (
                      <span
                        key={label}
                        className={`max-w-full break-words rounded-md px-2 py-1 text-xs ${getSectionBadgeColor(label)}`}
                      >
                        {label}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-gray-400">-</span>
                  )}
                </div>
              </div>
            </div>
            <div className="my-4 border-t border-gray-100" />
            <div className="flex items-center justify-between gap-2">
              <span className="shrink-0 text-sm text-gray-500">จัดการ</span>
              <div className="@container/actions flex min-w-0 flex-1 flex-nowrap justify-end gap-2 whitespace-nowrap [&>button]:min-h-11 [&>button]:min-w-11 [&>button]:shrink-0 [&>button]:justify-center">
                <button
                  type="button"
                  aria-label="รายละเอียด"
                  title="รายละเอียด"
                  onClick={() => {
                    setSelectedStudent(student);
                    setOpenView(true);
                  }}
                  className="flex cursor-pointer items-center gap-1 rounded-md border border-blue-200 px-2.5 py-1.5 text-sm text-blue-600 hover:bg-blue-50"
                >
                  <EyeIcon className="h-4 w-4 shrink-0" />
                  <span className="hidden @[260px]/actions:inline">
                    รายละเอียด
                  </span>
                </button>
                <button
                  type="button"
                  aria-label="แก้ไข"
                  title="แก้ไข"
                  onClick={() => handleEdit(student)}
                  className="flex cursor-pointer items-center gap-1 rounded-md border border-gray-200 px-2.5 py-1.5 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <PencilSquareIcon className="h-4 w-4 shrink-0" />
                  <span className="hidden @[260px]/actions:inline">แก้ไข</span>
                </button>
                <button
                  type="button"
                  aria-label="ลบ"
                  title="ลบ"
                  onClick={() => handleDelete(student._id)}
                  className="flex cursor-pointer items-center gap-1 rounded-md border border-red-200 px-2.5 py-1.5 text-sm text-red-500 hover:bg-red-50"
                >
                  <TrashIcon className="h-4 w-4 shrink-0" />
                  <span className="hidden @[260px]/actions:inline">ลบ</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="hidden min-w-0 max-w-full overflow-hidden rounded-xl border border-gray-200 md:block">
        <div className="max-h-[510px] w-full overflow-auto">
          <table className="app-data-table w-full min-w-[1130px] table-fixed text-sm">
            <colgroup>
              <col style={{ width: "160px" }} />
              <col style={{ width: "240px" }} />
              <col style={{ width: "250px" }} />
              <col style={{ width: "200px" }} />
              <col style={{ width: "280px" }} />
            </colgroup>
            <thead className="text-gray-600">
              <tr>
                <th className="sticky top-0 z-20 bg-gray-50 px-3 py-3 text-left font-semibold">
                  รหัสนักศึกษา
                </th>
                <th className="sticky top-0 z-20 bg-gray-50 px-3 py-3 text-left font-semibold">
                  ชื่อ-นามสกุล
                </th>
                <th className="sticky top-0 z-20 bg-gray-50 px-3 py-3 text-left font-semibold">
                  อีเมล
                </th>
                <th className="sticky top-0 z-20 bg-gray-50 px-3 py-3 text-left font-semibold">
                  Section
                </th>
                <th className="app-table-sticky-end sticky right-0 top-0 z-30 whitespace-nowrap bg-gray-50 px-3 py-3 text-left font-semibold">
                  จัดการ
                </th>
              </tr>
            </thead>

            <tbody>
              {paginatedData.map((s) => (
                <tr
                  key={s._id}
                  className="group/row border-t border-gray-200 hover:bg-gray-50 text-sm"
                >
                  <td className="px-3 py-3">
                    <div className="truncate" title={s.studentId}>
                      {s.studentId}
                    </div>
                  </td>

                  <td className="px-3 py-3">
                    <div className="truncate" title={s.fullName}>
                      {s.fullName}
                    </div>
                  </td>

                  <td className="px-3 py-3">
                    <div className="truncate" title={s.email || "-"}>
                      {s.email || "-"}
                    </div>
                  </td>

                  <td
                    className="px-3 py-3"
                    title={getSectionLabels(s).join(", ")}
                  >
                    <div className="flex min-w-0 items-center gap-1">
                      {getSectionLabels(s).length > 0 ? (
                        <>
                          <span
                            className={`min-w-0 truncate rounded-md px-2 py-1 text-xs ${getSectionBadgeColor(getSectionLabels(s)[0])}`}
                          >
                            {getSectionLabels(s)[0]}
                          </span>
                          {getSectionLabels(s).length > 1 && (
                            <span className="shrink-0 rounded-md bg-gray-100 px-1.5 py-1 text-xs text-gray-600">
                              +{getSectionLabels(s).length - 1}
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </div>
                  </td>

                  <td className="app-table-sticky-end sticky right-0 z-10 whitespace-nowrap bg-white px-3 py-2 group-hover/row:bg-gray-50">
                    <div className="flex flex-nowrap items-center gap-2 [&>button]:shrink-0">
                      <button
                        onClick={() => {
                          setSelectedStudent(s);
                          setOpenView(true);
                        }}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-blue-200 text-blue-600 hover:bg-blue-50 text-sm cursor-pointer"
                      >
                        <EyeIcon className="w-4 h-4" />
                        รายละเอียด
                      </button>

                      <button
                        onClick={() => handleEdit(s)}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-gray-200 hover:bg-gray-100 text-gray-700 text-sm cursor-pointer"
                      >
                        <PencilSquareIcon className="w-4 h-4" />
                        แก้ไข
                      </button>

                      <button
                        onClick={() => {
                          handleDelete(s._id);
                        }}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-red-200 hover:bg-red-50 text-red-500 text-sm cursor-pointer"
                      >
                        <TrashIcon className="w-4 h-4" />
                        ลบ
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {openEdit && selectedStudent && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 font-noto"
          onClick={() => setOpenEdit(false)}
        >
          <div
            className="w-full min-w-0 max-w-3xl bg-white rounded-2xl shadow-sm p-4 sm:p-6 max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 border-b border-gray-100 pb-4 mb-4">
              <div className="p-2 rounded-lg bg-blue-50">
                <PencilSquareIcon className="w-5 h-5 text-blue-600" />
              </div>

              <h2 className="text-lg font-semibold text-gray-800">
                แก้ไขข้อมูลนักศึกษา
              </h2>
            </div>

            <div className="space-y-4 overflow-y-auto pr-2 flex-1">
              <div>
                <label className="text-sm text-gray-800 mb-0.5 block">
                  รหัสนักศึกษา
                </label>

                <input
                  value={selectedStudent.studentId}
                  onChange={(e) =>
                    setSelectedStudent({
                      ...selectedStudent,
                      studentId: e.target.value.replace(/\s/g, ""),
                    })
                  }
                  className={`form-input-card w-full text-sm ${
                    selectedStudent.studentId &&
                    !isValidStudentId(selectedStudent.studentId)
                      ? "border-red-400 focus:ring-red-300"
                      : ""
                  }`}
                  placeholder="เช่น 650123456-7"
                />

                {selectedStudent.studentId &&
                  !isValidStudentId(selectedStudent.studentId) && (
                    <p className="text-xs text-red-500 mt-1">
                      รูปแบบต้องเป็น 123456789-0
                    </p>
                  )}
              </div>

              <div>
                <label className="text-sm text-gray-800 mb-0.5 block">
                  ชื่อ-นามสกุล
                </label>

                <input
                  value={selectedStudent.fullName}
                  onChange={(e) =>
                    setSelectedStudent({
                      ...selectedStudent,
                      fullName: e.target.value.replace(/^\s+/, ""),
                    })
                  }
                  className={`form-input-card w-full text-sm ${
                    selectedStudent.fullName &&
                    !isValidName(selectedStudent.fullName)
                      ? "border-red-400 focus:ring-red-300"
                      : ""
                  }`}
                  placeholder="เช่น นายสมชาย ใจดี"
                />

                {selectedStudent.fullName &&
                  !isValidName(selectedStudent.fullName) && (
                    <p className="text-xs text-red-500 mt-1">
                      ต้องขึ้นต้นด้วย นาย / นาง / นางสาว และมีชื่อ-นามสกุล
                    </p>
                  )}
              </div>

              <div>
                <label className="text-sm text-gray-800 mb-0.5 block">
                  อีเมล
                </label>

                <input
                  value={selectedStudent.email || ""}
                  onChange={(e) =>
                    setSelectedStudent({
                      ...selectedStudent,
                      email: e.target.value.trim(),
                    })
                  }
                  className={`form-input-card w-full text-sm ${
                    selectedStudent.email &&
                    !isValidEmail(selectedStudent.email)
                      ? "border-red-400 focus:ring-red-300"
                      : ""
                  }`}
                  placeholder="example@email.com"
                />

                {selectedStudent.email &&
                  !isValidEmail(selectedStudent.email) && (
                    <p className="text-xs text-red-500 mt-1">
                      รูปแบบอีเมลไม่ถูกต้อง เช่น example@email.com
                    </p>
                  )}
              </div>

              <div>
                <p className="text-sm text-gray-800 mb-2">รายวิชา</p>

                {editingClasses.length === 0 ? (
                  <p className="text-sm text-gray-400">ไม่มีข้อมูลรายวิชา</p>
                ) : (
                  <div className="space-y-2">
                    {editingClasses.map((c, i) => (
                      <div
                        key={i}
                        className="border border-gray-200 rounded-lg px-3 py-2 flex justify-between items-center"
                      >
                        <div>
                          <p className="text-sm font-medium text-gray-800">
                            {c.className}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">Section</span>

                          <input
                            value={c.section}
                            onChange={(e) => {
                              const updated = [...editingClasses];
                              updated[i].section = e.target.value.replace(
                                /\s/g,
                                "",
                              );
                              setEditingClasses(updated);
                            }}
                            className="w-[70px] px-2 py-1 text-sm border border-gray-200 rounded-md"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setOpenEdit(false)}
                className="px-4 py-2 rounded-md border border-gray-300 text-gray-600 text-sm hover:bg-gray-100 cursor-pointer"
              >
                ยกเลิก
              </button>

              <button
                onClick={handleUpdateStudent}
                disabled={loading || !isFormValid || !isDirty}
                className={`px-5 py-2.5 rounded-md text-white text-sm transition
              ${
                loading || !isFormValid || !isDirty
                  ? "bg-gray-400"
                  : "bg-[var(--primary)] hover:bg-[var(--primary-hover)] cursor-pointer"
              }`}
              >
                {loading ? "กำลังบันทึก..." : "บันทึก"}
              </button>
            </div>
          </div>
        </div>
      )}

      {openView && selectedStudent && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4"
          onClick={() => setOpenView(false)}
        >
          <div
            className="w-full min-w-0 max-w-3xl bg-white rounded-2xl shadow-sm p-4 sm:p-6 max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 border-b border-gray-100 pb-4 mb-4">
              <div className="p-2 rounded-lg bg-blue-50">
                <UserCircleIcon className="w-5 h-5 text-blue-600" />
              </div>

              <h2 className="text-lg font-semibold text-gray-800">
                รายละเอียดนักศึกษา
              </h2>
            </div>

            <div className="flex-1 overflow-y-auto pr-2">
              <div className="grid grid-cols-2 gap-4 text-sm mb-6">
                <div>
                  <p className="text-gray-500">รหัสนักศึกษา</p>
                  <p className="font-medium text-gray-800">
                    {selectedStudent.studentId}
                  </p>
                </div>

                <div>
                  <p className="text-gray-500">ชื่อ-นามสกุล</p>
                  <p className="font-medium text-gray-800">
                    {selectedStudent.fullName}
                  </p>
                </div>

                <div className="col-span-2">
                  <p className="text-gray-500">อีเมล</p>
                  <p className="font-medium text-gray-800">
                    {selectedStudent.email || "-"}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-gray-500 text-sm mb-2">รายวิชา</p>

                {selectedStudent.classes &&
                selectedStudent.classes.length > 0 ? (
                  <div className="space-y-6">
                    {Object.entries(
                      selectedStudent.classes.reduce(
                        (acc, curr) => {
                          const year = curr.academicYear;

                          if (!acc[year]) {
                            acc[year] = [];
                          }

                          acc[year].push(curr);

                          return acc;
                        },
                        {} as Record<
                          number,
                          {
                            className: string;
                            section: string;
                            academicYear: number;
                          }[]
                        >,
                      ),
                    )
                      .sort(([a], [b]) => Number(b) - Number(a))
                      .map(([year, classes]) => (
                        <div key={year}>
                          <div className="flex items-center gap-2 mb-3">
                            <div className="h-8 px-3 rounded-full bg-blue-50 border border-blue-100 flex items-center">
                              <span className="text-sm font-semibold text-blue-700">
                                ปีการศึกษา {year}
                              </span>
                            </div>

                            <div className="flex-1 h-px bg-gray-100" />
                          </div>

                          <div className="space-y-3">
                            {classes.map((c, i) => (
                              <div
                                key={`${c.className}-${c.section}-${i}`}
                                className="group border border-gray-200 rounded-2xl p-4 hover:bg-gray-50 transition"
                              >
                                <div className="flex items-center justify-between gap-4">
                                  <div>
                                    <p className="font-semibold text-gray-800">
                                      {c.className}
                                    </p>

                                    <div className="flex items-center gap-2 mt-1">
                                      <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                                        Section {c.section}
                                      </span>
                                    </div>
                                  </div>

                                  <button
                                    onClick={() => {
                                      handleWithdraw(
                                        selectedStudent,
                                        c.className,
                                        c.section,
                                      );
                                    }}
                                    className="shrink-0 px-4 py-2 rounded-xl bg-red-500 text-white text-sm hover:bg-red-600 transition cursor-pointer"
                                  >
                                    ถอนวิชา
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400">ไม่มีข้อมูลรายวิชา</p>
                )}
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={() => setOpenView(false)}
                className="px-4 py-2 rounded-md border border-gray-300 text-gray-600 text-sm hover:bg-gray-100 cursor-pointer"
              >
                ปิด
              </button>
            </div>
          </div>
        </div>
      )}

      {data.length > 10 && (
        <div className="mt-4 flex flex-col gap-3 text-sm text-gray-600 sm:flex-row sm:justify-between">
          <div className="flex items-center gap-2">
            <span>แสดง</span>

            <div ref={pageSizeRef} className="relative">
              <button
                onClick={() => setOpenPageSize(!openPageSize)}
                className="form-input-card flex items-center justify-between gap-2 px-3 py-1 text-xs min-w-[60px]"
              >
                {itemsPerPage}
                <ChevronDownIcon className="w-3 h-3 text-gray-400" />
              </button>

              {openPageSize && (
                <div className="absolute z-10 mt-1 w-full rounded-md bg-white shadow-lg border border-gray-200">
                  {[10, 15, 20].map((size) => (
                    <button
                      key={size}
                      onClick={() => {
                        setItemsPerPage(size);
                        setPage(1);
                        setOpenPageSize(false);
                      }}
                      className="block w-full px-3 py-2 text-left text-sm hover:bg-gray-100"
                    >
                      {size}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <span>จากทั้งหมด {data.length} รายการ</span>
          </div>

          <div className="flex max-w-full flex-wrap items-center justify-center gap-2 sm:justify-end">
            <button
              onClick={() => setPage(Math.max(currentPage - 1, 1))}
              disabled={currentPage === 1}
              className={`px-3 py-2 text-[13px] rounded-md border border-gray-100 hover:bg-gray-100 
              ${currentPage === 1 ? "opacity-40" : "cursor-pointer"}
              `}
            >
              ก่อนหน้า
            </button>

            {getVisiblePages().map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`px-3.5 py-2 rounded-md border text-[13px] cursor-pointer ${
                  currentPage === p
                    ? "bg-[var(--primary)] text-white border-[var(--primary)]"
                    : "border-gray-100 hover:bg-gray-100"
                }`}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => setPage(Math.min(currentPage + 1, totalPages))}
              disabled={currentPage === totalPages}
              className={`px-4 py-2 text-[13px] rounded-md border border-gray-100 hover:bg-gray-100 
              ${currentPage === totalPages ? "opacity-40" : "cursor-pointer"}
              `}
            >
              ถัดไป
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

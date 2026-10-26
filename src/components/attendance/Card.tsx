"use client";

import { getLocale, useLanguage } from "@/lib/language";
import type { AttendanceStatus, StudentAttendance } from "@/types/attendance";

type Props = {
  students: StudentAttendance[];
  selectedStatus: AttendanceStatus | null;
  onSelectStatus: (status: AttendanceStatus | null) => void;
};

export default function StudentSummaryCard({
  students,
  selectedStatus,
  onSelectStatus,
}: Props) {
  const { tr } = useLanguage();
  const items: {
    title: string;
    status: AttendanceStatus | null;
    dotColor: string;
  }[] = [
    { title: "นักศึกษาทั้งหมด", status: null, dotColor: "bg-slate-400" },
    { title: "มาเรียน", status: "มาเรียน", dotColor: "bg-emerald-500" },
    { title: "มาสาย", status: "มาสาย", dotColor: "bg-amber-500" },
    { title: "ลา", status: "ลา", dotColor: "bg-sky-500" },
    { title: "ขาด", status: "ขาด", dotColor: "bg-rose-500" },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => {
        const isActive = selectedStatus === item.status;
        const count = item.status
          ? students.filter((student) => student.status === item.status).length
          : students.length;

        return (
          <button
            key={item.title}
            type="button"
            aria-pressed={isActive}
            onClick={() => onSelectStatus(item.status)}
            className={`inline-flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-200 ${
              isActive
                ? "border-blue-200 bg-blue-50 text-blue-700"
                : "border-transparent bg-gray-50 text-gray-600 hover:bg-gray-100"
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${item.dotColor}`}
              aria-hidden="true"
            />
            <span>{tr(item.title)}</span>
            <span className="font-semibold tabular-nums">
              {count.toLocaleString(getLocale())}
            </span>
          </button>
        );
      })}
    </div>
  );
}

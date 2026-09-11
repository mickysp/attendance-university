"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { appSwal } from "@/lib/swal";
import { PlusIcon } from "@heroicons/react/24/outline";
import { useAlert } from "@/context/AlertContext";
import { useConfirm } from "@/context/swal";
import TeacherSelect from "@/components/teachers/Select";
import TeacherTable from "@/components/teachers/Table";
import type { Teacher } from "@/types/teachers";

async function readResponse(res: Response) {
  const result = await res.json().catch(() => {
    throw new Error("ระบบตอบกลับไม่ถูกต้อง กรุณาลองอีกครั้ง");
  });
  if (!res.ok || !result.success) {
    throw new Error(result.message || "ดำเนินการไม่สำเร็จ กรุณาลองอีกครั้ง");
  }
  return result;
}

export default function TeachersPage() {
  const { showAlert } = useAlert();
  const { showConfirm } = useConfirm();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [keyword, setKeyword] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);
  const busy = useRef(false);

  const loadTeachers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await readResponse(await fetch("/api/teachers", { cache: "no-store" }));
      if (!Array.isArray(result.data)) throw new Error("รูปแบบรายชื่ออาจารย์ไม่ถูกต้อง");
      setTeachers(result.data.map((item: Teacher) => ({ ...item, _id: String(item._id) })));
    } catch (error) {
      setError(error instanceof Error ? error.message : "โหลดรายชื่ออาจารย์ไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadTeachers(); }, [loadTeachers]);

  const openTeacherForm = async (teacher?: Teacher) => {
    if (busy.current) return;
    busy.current = true;
    try {
      const result = await appSwal.nameForm({
        title: teacher ? "แก้ไขอาจารย์" : "เพิ่มอาจารย์",
        initialValue: teacher?.name,
        onSave: async (name) => {
          await readResponse(await fetch("/api/teachers", {
            method: teacher ? "PATCH" : "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...(teacher ? { id: teacher._id } : {}), name }),
          }));
        },
      });
      if (result.isConfirmed) {
        if (!teacher) setKeyword("");
        showAlert(teacher ? "แก้ไขอาจารย์สำเร็จ" : "เพิ่มอาจารย์สำเร็จ", "success");
        await loadTeachers();
      }
    } finally {
      busy.current = false;
    }
  };

  const deleteTeacher = (teacher: Teacher) => {
    if (busy.current) return;
    void showConfirm(`ลบอาจารย์ ${teacher.name}?`, async () => {
      if (busy.current) return;
      busy.current = true;
      setDeleting(teacher._id);
      try {
        const result = await readResponse(await fetch(`/api/teachers?id=${encodeURIComponent(teacher._id)}`, { method: "DELETE" }));
        setTeachers((items) => items.filter((item) => item._id !== teacher._id));
        showAlert(result.message || "ลบอาจารย์สำเร็จ", "success");
      } catch (error) {
        showAlert(error instanceof Error ? error.message : "ลบอาจารย์ไม่สำเร็จ", "error");
      } finally {
        busy.current = false;
        setDeleting(null);
      }
    }, "delete", "ลบออกจากรายชื่ออาจารย์สำหรับเลือกในรายวิชาใหม่ โดยข้อมูลผู้สอนในรายวิชาเดิมยังคงอยู่");
  };

  const filtered = teachers.filter((teacher) => teacher.name.toLowerCase().includes(keyword.trim().toLowerCase()));

  return (
    <div className="flex h-screen overflow-hidden bg-blue-50 font-noto">
      <main className="min-h-0 min-w-0 flex-1 p-4 pt-20 sm:p-6 sm:pt-20 lg:pt-6">
        <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl bg-white">
          <div className="flex shrink-0 flex-col gap-4 px-6 pt-6 pb-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-[26px] font-semibold text-gray-800">Teachers</h1>
              <p className="mt-1 text-sm text-gray-400">จัดการข้อมูลอาจารย์ที่มีอยู่ในระบบ</p>
            </div>
            <button type="button" onClick={() => void openTeacherForm()} className="flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-md bg-(--primary) px-6 py-2 text-white hover:bg-(--primary-hover) disabled:opacity-50">
              <PlusIcon className="h-4 w-4" />เพิ่มอาจารย์
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-6">
            <TeacherSelect keyword={keyword} onKeywordChange={setKeyword} />
            <p className="mt-6 mb-4 font-semibold text-gray-600">อาจารย์ทั้งหมด {teachers.length} รายการ{keyword.trim() && ` · พบ ${filtered.length} รายการ`}</p>

            {filtered.length === 0 && !loading && !error ? (
              <div className="flex flex-col items-center gap-4 py-16 text-center text-sm text-gray-400">
                <p>{teachers.length ? "ไม่พบอาจารย์ที่ตรงกับคำค้นหา" : "ยังไม่มีข้อมูลอาจารย์ กดเพิ่มอาจารย์เพื่อเริ่มต้น"}</p>
              </div>
            ) : (
              <TeacherTable
                teachers={filtered}
                deletingId={deleting}
                loading={loading}
                error={error}
                onDeleteTeacher={deleteTeacher}
                onEditTeacher={(teacher) => void openTeacherForm(teacher)}
                onRetry={() => void loadTeachers()}
                filterKey={keyword}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

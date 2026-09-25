"use client";

import { teachersApi } from "@/services/api/teachers";
import { useCallback, useEffect, useRef, useState } from "react";
import { appSwal } from "@/lib/swal";
import { PlusIcon } from "@heroicons/react/24/outline";
import { useAlert } from "@/context/AlertContext";
import { useConfirm } from "@/context/swal";
import TeacherSelect from "@/components/teachers/Select";
import TeacherTable from "@/components/teachers/Table";
import type { Teacher } from "@/types/teachers";

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
      const result = await readResponse(
        await teachersApi.list({ cache: "no-store" }),
      );
      if (!Array.isArray(result.data))
        throw new Error("รูปแบบรายชื่ออาจารย์ไม่ถูกต้อง");
      setTeachers(
        result.data.map((item: Teacher) => ({
          ...item,
          _id: String(item._id),
        })),
      );
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "โหลดรายชื่ออาจารย์ไม่สำเร็จ",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTeachers();
  }, [loadTeachers]);

  const openTeacherForm = async (teacher?: Teacher) => {
    if (busy.current) return;
    busy.current = true;
    try {
      const result = await appSwal.nameForm({
        title: teacher ? "แก้ไขอาจารย์" : "เพิ่มอาจารย์",
        initialValue: teacher?.name,
        validateName: async (name) => {
          const trimmedName = name.trim();
          if (!trimmedName) return "กรุณากรอกชื่อ-นามสกุลอาจารย์";

          const response = await teachersApi.list({ cache: "no-store" });
          const data = await response.json().catch(() => null);

          if (!response.ok || !data?.success || !Array.isArray(data.data)) {
            return undefined;
          }

          const existingNames = data.data
            .map((item: { name?: string }) =>
              typeof item?.name === "string" ? item.name.trim() : "",
            )
            .filter(Boolean);

          const duplicate = existingNames.some(
            (existingName) =>
              normalizeTeacherName(existingName) === normalizeTeacherName(trimmedName) &&
              (!teacher ||
                normalizeTeacherName(existingName) !==
                  normalizeTeacherName(teacher.name.trim())),
          );

          return duplicate ? "มีชื่อนี้ในระบบแล้ว" : undefined;
        },
        onSave: async (name) => {
          await readResponse(
            await teachersApi.save({
              ...(teacher ? { id: teacher._id } : {}),
              name,
            }),
          );
        },
      });
      if (result.isConfirmed) {
        if (!teacher) setKeyword("");
        showAlert(
          teacher ? "แก้ไขอาจารย์สำเร็จ" : "เพิ่มอาจารย์สำเร็จ",
          "success",
        );
        await loadTeachers();
      }
    } finally {
      busy.current = false;
    }
  };

  const deleteTeacher = (teacher: Teacher) => {
    if (busy.current) return;
    void showConfirm(
      `ลบอาจารย์ ${teacher.name}?`,
      async () => {
        if (busy.current) return;
        busy.current = true;
        setDeleting(teacher._id);
        try {
          const result = await readResponse(
            await teachersApi.remove(teacher._id),
          );
          setTeachers((items) =>
            items.filter((item) => item._id !== teacher._id),
          );
          showAlert(result.message || "ลบอาจารย์สำเร็จ", "success");
        } catch (error) {
          showAlert(
            error instanceof Error ? error.message : "ลบอาจารย์ไม่สำเร็จ",
            "error",
          );
        } finally {
          busy.current = false;
          setDeleting(null);
        }
      },
      "delete",
      "ลบออกจากรายชื่ออาจารย์สำหรับเลือกในรายวิชาใหม่ โดยข้อมูลผู้สอนในรายวิชาเดิมยังคงอยู่",
    );
  };

  const filtered = teachers.filter((teacher) =>
    teacher.name.toLowerCase().includes(keyword.trim().toLowerCase()),
  );

  return (
    <div className="flex h-screen overflow-hidden bg-blue-50 font-noto">
      <main className="relative min-h-0 min-w-0 flex-1 overflow-y-auto p-6 pt-[80px] lg:pt-6">
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-gray-300/80 backdrop-blur-[1px]">
            <div className="flex flex-col items-center gap-4">
              <div className="h-14 w-14 animate-spin rounded-full border-4 border-white border-t-transparent" />
              <p className="text-base text-white">กำลังโหลด...</p>
            </div>
          </div>
        )}

        <div className="flex min-w-0 flex-col rounded-2xl bg-white">
          <div className="flex shrink-0 flex-col px-6 pt-6 pb-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-[26px] font-semibold text-gray-800">
                อาจารย์
              </h1>
              <p className="mt-1 text-sm text-gray-400">
                จัดการข้อมูลอาจารย์ที่มีอยู่ในระบบ
              </p>
            </div>
            <button
              type="button"
              onClick={() => void openTeacherForm()}
              className="mt-4 flex h-[40px] w-full cursor-pointer items-center justify-center gap-2 rounded-md bg-[var(--primary)] px-6 py-2 text-[14px] text-white transition hover:bg-[var(--primary-hover)] disabled:opacity-50 md:mt-0 md:w-auto"
            >
              <PlusIcon className="h-4 w-4" />
              เพิ่มอาจารย์
            </button>
          </div>

          <div className="flex min-w-0 flex-col">
            <div className="shrink-0 px-6">
              <TeacherSelect keyword={keyword} onKeywordChange={setKeyword} />

              <p className="mt-6 mb-4 font-semibold text-gray-600">
                อาจารย์ ทั้งหมด {teachers.length} รายการ
                {keyword.trim() && ` · พบ ${filtered.length} รายการ`}
              </p>
            </div>

            <div className="px-6 pb-6">
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
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

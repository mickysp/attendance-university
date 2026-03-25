"use client";

import { useRouter, useParams } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import Sidebar from "@/components/layouts/Sidebar";
import { TrashIcon, ArrowLeftIcon } from "@heroicons/react/24/outline";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import { useAlert } from "@/context/AlertContext";
import { useConfirm } from "@/context/ConfirmContext";

type ClassItem = {
  className: string;
  classCode: string;
  description: string;
  teacher: string;
  branches: string[];
};

const BRANCH_OPTIONS = [
  "เทคโนโลยีสารสนเทศและนวัตกรรมอัจฉริยะ",
  "วิทยาการคอมพิวเตอร์",
  "ภูมิสารสนเทศศาสตร์",
  "ปัญญาประดิษฐ์",
  "ความมั่นคงปลอดภัยไซเบอร์",
];

const TEACHERS = [
  "รศ.ดร.งามนิจ อาจอินทร์",
  "รศ.ดร.วรารัตน์ สงฆ์แป้น",
  "อ.ดร.วรัญญา วรรณศรี",
  "ผศ.ดร.มัลลิกา วัฒนะ",
  "ผศ.ดร.ปวีณา วันชัย",
  "ผศ.ดร.สุมณฑา เกษมวิลาศ",
  "ศ.ดร.จักรชัย โสอินทร์",
  "ผศ.ดร.เพชร อิ่มทองคำ",
  "ผศ.ดร.สาธิต กระเวนกิจ",
  "อ.ดร.จักรกฤษณ์ แก้วโยธา",
  "ผศ.ดร.สายยัญ สายยศ",
  "ผศ.ดร.ไอศูรย์ กาญจนสุรัตน์",
  "อ.ดร.พงษ์ศธร จันทร์ยอย",
  "ผศ.ดร.พุธษดี ศิริแสงตระกูล",
  "รศ.ดร.อุรฉัตร โคแก้ว",
  "ผศ.ดร.สิลดา อินทรโสธรฉันท์",
  "ผศ.ดร.วชิราวุธ ธรรมวิเศษ",
];

export default function EditClassPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const { showAlert } = useAlert();
  const { showConfirm } = useConfirm();

  const [item, setItem] = useState<ClassItem | null>(null);
  const [loading, setLoading] = useState(true);

  const [openTeacher, setOpenTeacher] = useState(false);
  const [openBranchIndex, setOpenBranchIndex] = useState<number | null>(null);

  const teacherRef = useRef<HTMLDivElement>(null);
  const branchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/classes/${id}`);
        const data = await res.json();

        if (!res.ok) throw new Error(data.message);

        setItem({
          className: data.data.className || "",
          classCode: data.data.classCode || "",
          description: data.data.description || "",
          teacher: data.data.teacher || "",
          branches: data.data.branches?.length ? data.data.branches : [""],
        });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "เกิดข้อผิดพลาด";
        showAlert(message, "error");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, showAlert]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;

      if (teacherRef.current && !teacherRef.current.contains(target)) {
        setOpenTeacher(false);
      }

      if (branchRef.current && !branchRef.current.contains(target)) {
        setOpenBranchIndex(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleChange = (key: keyof ClassItem, value: string) => {
    if (!item) return;
    setItem({ ...item, [key]: value });
  };

  const handleBranchChange = (index: number, value: string) => {
    if (!item) return;
    const updated = [...item.branches];
    updated[index] = value;
    setItem({ ...item, branches: updated });
  };

  const handleAddBranch = () => {
    if (!item) return;
    setItem({ ...item, branches: [...item.branches, ""] });
  };

  const handleRemoveBranch = (index: number) => {
    if (!item) return;
    setItem({
      ...item,
      branches: item.branches.filter((_, i) => i !== index),
    });
  };

  const handleSubmit = async () => {
    if (!item) return;

    const cleanBranches = item.branches.filter((b) => b);

    if (!item.className) {
      return showAlert("กรุณากรอกชื่อวิชา", "error");
    }

    if (cleanBranches.length === 0) {
      return showAlert("ต้องมีอย่างน้อย 1 สาขา", "error");
    }

    showConfirm("คุณต้องการบันทึกข้อมูลใช่หรือไม่?", async () => {
      try {
        const res = await fetch(`/api/classes/update?id=${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...item,
            branches: cleanBranches,
          }),
        });

        const data = await res.json();

        if (!res.ok) throw new Error(data.message);

        showAlert("อัปเดตสำเร็จ", "success");
        router.push("/classes");
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "เกิดข้อผิดพลาด";
        showAlert(message, "error");
      }
    });
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

        {!loading && !item && <div className="p-6">ไม่พบข้อมูล</div>}

        {!loading && item && (
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <button
                onClick={() => router.push("/classes")}
                className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-300 hover:bg-gray-100 transition cursor-pointer"
              >
                <ArrowLeftIcon className="w-3 h-3 text-gray-700" />
              </button>

              <h1 className="text-2xl font-semibold text-gray-800">
                แก้ไขรายวิชา
              </h1>
            </div>

            <div className="border border-gray-50 bg-[var(--card)] rounded-xl p-4 space-y-4">
              <div>
                <label className="text-sm text-gray-800">ชื่อวิชา</label>
                <input
                  value={item.className}
                  onChange={(e) => handleChange("className", e.target.value)}
                  className="form-input-card text-sm"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-800">รหัสวิชา</label>
                  <input
                    value={item.classCode}
                    onChange={(e) => handleChange("classCode", e.target.value)}
                    className="form-input-card text-sm"
                  />
                </div>

                <div ref={teacherRef} className="relative">
                  <label className="text-sm text-gray-800">อาจารย์ผู้สอน</label>

                  <button
                    type="button"
                    onClick={() => setOpenTeacher(!openTeacher)}
                    className="form-input-card text-sm flex justify-between w-full"
                  >
                    {item.teacher || "เลือกอาจารย์"}
                    <ChevronDownIcon className="w-4 h-4 text-gray-400" />
                  </button>

                  {openTeacher && (
                    <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg">
                      {TEACHERS.map((t) => (
                        <button
                          key={t}
                          onClick={() => {
                            handleChange("teacher", t);
                            setOpenTeacher(false);
                          }}
                          className="block w-full px-4 py-2 text-left text-sm hover:bg-gray-100 cursor-pointer"
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div ref={branchRef}>
                <label className="text-sm text-gray-800">สาขา</label>

                <div className="space-y-2 mt-2">
                  {item.branches.map((b, i) => (
                    <div key={i} className="flex gap-2 relative">
                      <button
                        type="button"
                        onClick={() =>
                          setOpenBranchIndex(openBranchIndex === i ? null : i)
                        }
                        className="form-input-card text-sm flex justify-between w-full"
                      >
                        {b || "เลือกสาขา"}
                        <ChevronDownIcon className="w-4 h-4 text-gray-400" />
                      </button>

                      {openBranchIndex === i && (
                        <div className="absolute z-10 mt-10 w-full bg-white border border-gray-200 rounded-md shadow-lg">
                          {BRANCH_OPTIONS.map((opt) => {
                            const isSelected = item.branches.includes(opt);

                            return (
                              <button
                                key={opt}
                                type="button"
                                disabled={isSelected}
                                onClick={() => {
                                  if (isSelected) return;

                                  handleBranchChange(i, opt);
                                  setOpenBranchIndex(null);
                                }}
                                className={`block w-full px-4 py-2 text-left text-sm
                                ${
                                  isSelected
                                  ? "text-gray-400 bg-gray-50 cursor-not-allowed"
                                  : "hover:bg-gray-100 cursor-pointer"
                                }`}
                              >
                                {opt}
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {item.branches.length > 1 && (
                        <button onClick={() => handleRemoveBranch(i)}>
                          <TrashIcon className="w-5 h-5 text-red-500 cursor-pointer" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={handleAddBranch}
                  className="mt-2 text-sm text-blue-600 hover:underline"
                >
                  + เพิ่มสาขา
                </button>
              </div>

              <div>
                <label className="text-sm text-gray-800">รายละเอียดวิชา</label>
                <textarea
                  value={item.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                  className="form-input-card text-sm"
                  rows={4}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => router.push("/classes")}
                className="px-4 py-2 rounded-md border border-gray-300 text-gray-600 text-sm hover:bg-gray-100 cursor-pointer"
              >
                ยกเลิก
              </button>

              <button
                onClick={handleSubmit}
                className="px-5 py-2.5 rounded-md bg-[var(--primary)] text-white text-sm hover:bg-[var(--primary-hover)] cursor-pointer"
              >
                บันทึก
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

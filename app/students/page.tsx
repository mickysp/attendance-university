"use client";

import { useState, useEffect, useRef } from "react";
import Sidebar from "@/components/layouts/Sidebar";
import { ChevronDownIcon } from "@heroicons/react/24/outline";

type ClassItem = {
  _id: string;
  displayName: string;
};

type RawClass = {
  _id: string;
  name?: string;
  className?: string;
  title?: string;
};

type MajorItem = {
  _id: string;
  name: string;
};

export default function StudentsPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const [selectedClass, setSelectedClass] = useState<string>("");
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loadingClasses, setLoadingClasses] = useState(true);

  const [openClass, setOpenClass] = useState(false);
  const classRef = useRef<HTMLDivElement>(null);

  const hasData = false;

  const [majors, setMajors] = useState<MajorItem[]>([]);
  const [selectedMajor, setSelectedMajor] = useState("");
  const [openMajor, setOpenMajor] = useState(false);
  const majorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const res = await fetch("/api/classes");
        const data: { success: boolean; data: RawClass[] } = await res.json();

        if (data.success && Array.isArray(data.data)) {
          const normalized: ClassItem[] = data.data.map((c) => ({
            _id: c._id,
            displayName: c.name || c.className || c.title || "ไม่มีชื่อวิชา",
          }));

          setClasses(normalized);
        }
      } catch (error) {
        console.error("Fetch classes error:", error);
      } finally {
        setLoading(false);
        setLoadingClasses(false);
      }
    };

    fetchClasses();
  }, []);

  useEffect(() => {
    const fetchMajors = async () => {
      try {
        const res = await fetch("/api/majors");
        const data = await res.json();

        if (data.success && Array.isArray(data.data)) {
          setMajors(data.data);
        }
      } catch (error) {
        console.error("Fetch majors error:", error);
      }
    };

    fetchMajors();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (classRef.current && !classRef.current.contains(e.target as Node)) {
        setOpenClass(false);
      }

      if (majorRef.current && !majorRef.current.contains(e.target as Node)) {
        setOpenMajor(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleUpload = async () => {
    if (!file) {
      setMessage("กรุณาเลือกไฟล์");
      return;
    }

    if (!selectedClass) {
      setMessage("กรุณาเลือกวิชา");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("classId", selectedClass);

      const res = await fetch("/api/students/import", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (data.success) {
        setMessage(data.message);
        setFile(null);
      } else {
        setMessage(data.message || "เกิดข้อผิดพลาด");
      }
    } catch (error) {
      console.error(error);
      setMessage("อัปโหลดไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
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

        {!loading && !hasData && (
          <div className="flex flex-col h-[85vh] bg-white rounded-2xl shadow-sm">
            <div className="px-6 pt-6">
              <h1 className="text-2xl font-semibold text-gray-800">Students</h1>
            </div>

            <div className="p-6">
              <div className="flex flex-col md:flex-row gap-6 bg-white border border-gray-100 rounded-2xl shadow-sm p-6">
                <div className="flex-1 space-y-4">
                  <h2 className="text-lg font-semibold text-gray-900">
                    นำเข้ารายชื่อนักศึกษา
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div ref={classRef} className="relative">
                      <label className="text-sm text-gray-700 mb-1 block">
                        เลือกวิชา
                      </label>

                      <button
                        type="button"
                        onClick={() => setOpenClass((prev) => !prev)}
                        disabled={loadingClasses}
                        className="form-input-card text-sm flex items-center justify-between w-full"
                      >
                        {selectedClass
                          ? classes.find((c) => c._id === selectedClass)
                              ?.displayName
                          : loadingClasses
                            ? "กำลังโหลดวิชา..."
                            : "เลือกวิชา"}

                        <ChevronDownIcon className="w-4 h-4 text-gray-400" />
                      </button>

                      {openClass && (
                        <div className="absolute z-10 mt-1 w-full rounded-md bg-white shadow-lg border border-gray-200 max-h-48 overflow-y-auto">
                          {classes.map((cls) => {
                            const isSelected = selectedClass === cls._id;

                            return (
                              <button
                                key={cls._id}
                                type="button"
                                onClick={() => {
                                  setSelectedClass(cls._id);
                                  setOpenClass(false);
                                }}
                                className={`block w-full px-4 py-2 text-left text-sm
                  ${
                    isSelected
                      ? "bg-blue-50 text-blue-600"
                      : "hover:bg-gray-100"
                  }`}
                              >
                                {cls.displayName}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    <div ref={majorRef} className="relative">
                      <label className="text-sm text-gray-700 mb-1 block">
                        เลือกสาขา
                      </label>

                      <button
                        type="button"
                        onClick={() => setOpenMajor((prev) => !prev)}
                        className="form-input-card text-sm flex items-center justify-between w-full"
                      >
                        {selectedMajor
                          ? majors.find((m) => m._id === selectedMajor)?.name
                          : "เลือกสาขา"}

                        <ChevronDownIcon className="w-4 h-4 text-gray-400" />
                      </button>

                      {openMajor && (
                        <div className="absolute z-10 mt-1 w-full rounded-md bg-white shadow-lg border border-gray-200 max-h-48 overflow-y-auto">
                          {majors.length === 0 && (
                            <div className="px-4 py-2 text-sm text-gray-400">
                              ไม่พบข้อมูลสาขา
                            </div>
                          )}

                          {majors.map((m) => {
                            const isSelected = selectedMajor === m._id;

                            return (
                              <button
                                key={m._id}
                                type="button"
                                onClick={() => {
                                  setSelectedMajor(m._id);
                                  setOpenMajor(false);
                                }}
                                className={`block w-full px-4 py-2 text-left text-sm
              ${isSelected ? "bg-blue-50 text-blue-600" : "hover:bg-gray-100"}`}
                              >
                                {m.name}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="text-sm text-gray-700 mb-1 block">
                        ไฟล์ CSV
                      </label>

                      <input
                        type="file"
                        accept=".csv"
                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                        className="block w-full text-sm border rounded-lg p-2 cursor-pointer bg-white"
                      />

                      {file && (
                        <p className="text-xs text-gray-500 mt-1">
                          {file.name}
                        </p>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={handleUpload}
                    disabled={loading}
                    className="w-full py-2.5 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition"
                  >
                    นำเข้าไฟล์
                  </button>

                  {message && (
                    <p className="text-sm text-gray-600">{message}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {!loading && hasData && (
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h1 className="text-xl font-semibold mb-4">รายชื่อนักศึกษา</h1>
          </div>
        )}
      </div>
    </div>
  );
}

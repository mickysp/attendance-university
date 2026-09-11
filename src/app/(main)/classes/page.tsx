"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import Table from "@/components/classes/Table";
import Select from "@/components/classes/Select";

import type { ClassResponse } from "@/types/classes";

export default function ClassesPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState<ClassResponse[]>([]);

  const [filter, setFilter] = useState({
    keyword: "",
    branch: "",
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const res = await fetch("/api/classes");

        const data = await res.json();

        if (data.success && Array.isArray(data.data)) {
          setClasses(data.data);
        } else {
          setClasses([]);
        }
      } catch (error) {
        setClasses([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredClasses = classes.filter((item) => {
    const keyword = filter.keyword.toLowerCase().trim();

    const matchKeyword =
      item.className.toLowerCase().includes(keyword) ||
      item.classCodes.some((classCode) =>
        classCode.toLowerCase().includes(keyword),
      );

    const matchBranch = true;

    return matchKeyword && matchBranch;
  });

  const hasData = classes.length > 0;

  const handleDeleteSuccess = (id: string) => {
    setClasses((prev) => prev.filter((item) => item._id !== id));
  };

  return (
    <div className="flex h-screen overflow-hidden bg-blue-50">
      <div
        className="
          relative
          flex-1
          min-h-0
          overflow-hidden
          p-6
          pt-[80px]
          font-noto
          lg:pt-6
        "
      >
        {loading && (
          <div
            className="
              absolute
              inset-0
              z-10
              flex
              items-center
              justify-center
              bg-gray-300
            "
          >
            <div className="flex flex-col items-center gap-4">
              <div
                className="
                  h-14
                  w-14
                  animate-spin
                  rounded-full
                  border-4
                  border-white
                  border-t-transparent
                "
              />

              <p className="text-base text-white">กำลังโหลด...</p>
            </div>
          </div>
        )}

        {!loading && hasData && (
          <div
            className="
              flex
              h-full
              min-h-0
              flex-col
              overflow-hidden
              rounded-2xl
              bg-white
            "
          >
            <div
              className="
                flex
                shrink-0
                flex-col
                px-6
                pt-6
                pb-4
                md:flex-row
                md:items-center
                md:justify-between
              "
            >
              <div>
                <h1 className="text-[26px] font-semibold text-gray-800">
                  Classes
                </h1>

                <p className="mt-1 text-sm text-gray-400">
                  จัดการข้อมูลรายวิชาที่มีอยู่ในระบบ
                </p>
              </div>

              <button
                type="button"
                onClick={() => router.push("/classes/create")}
                className="
                  mt-4
                  h-[40px]
                  w-full
                  cursor-pointer
                  rounded-md
                  bg-[var(--primary)]
                  px-6
                  py-2
                  text-base
                  text-white
                  transition
                  hover:bg-[var(--primary-hover)]
                  md:mt-0
                  md:w-auto
                "
              >
                + เพิ่มวิชา
              </button>
            </div>

            <div className="shrink-0 px-6 pb-4">
              <div className="flex items-center justify-between">
                <Select data={classes} onChange={setFilter} />
              </div>

              <div className="mt-6 text-base font-semibold text-gray-600">
                Classes ทั้งหมด {filteredClasses.length} รายการ
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-6">
              <Table
                data={filteredClasses}
                onDeleteSuccess={handleDeleteSuccess}
              />
            </div>
          </div>
        )}

        {!loading && !hasData && (
          <div
            className="
              flex
              h-full
              min-h-0
              flex-col
              overflow-hidden
              rounded-2xl
              bg-white
            "
          >
            <div className="shrink-0 px-6 pt-6 pb-4">
              <h1 className="text-[26px] font-semibold text-gray-800">
                Classes
              </h1>
            </div>

            <div
              className="
                min-h-0
                flex-1
                overflow-y-auto
                px-6
                pb-6
              "
            >
              <div
                className="
                  flex
                  min-h-full
                  flex-col
                  items-center
                  justify-center
                  text-center
                "
              >
                <div
                  className="
                    mb-3
                    flex
                    h-28
                    w-28
                    items-center
                    justify-center
                    rounded-full
                    bg-gray-100
                  "
                >
                  <img
                    src="/not-exist.png"
                    alt="ไม่มีข้อมูล"
                    className="h-28 w-28"
                  />
                </div>

                <p className="mb-4 text-sm text-gray-400">
                  ยังไม่มีข้อมูลรายวิชาล่าสุด
                </p>

                <button
                  type="button"
                  onClick={() => router.push("/classes/create")}
                  className="
                    flex
                    cursor-pointer
                    items-center
                    gap-2
                    rounded-md
                    bg-[var(--primary)]
                    px-5
                    py-2.5
                    text-sm
                    text-white
                    shadow-sm
                    transition
                    hover:bg-[var(--primary-hover)]
                  "
                >
                  + เพิ่มวิชา
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

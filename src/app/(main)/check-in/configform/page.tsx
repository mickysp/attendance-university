"use client";

import { useState, useEffect } from "react";
import { Upload } from "lucide-react";
import { useConfirm } from "@/context/swal";
import { useAlert } from "@/context/AlertContext";

type FormConfig = {
  prefix: boolean;
  firstname: boolean;
  lastname: boolean;
  studentId: boolean;
  email: boolean;
  section: boolean;
  photo: boolean;
  note: boolean;
  location: boolean;
};

const defaultConfig: FormConfig = {
  prefix: true,
  firstname: true,
  lastname: true,
  studentId: true,
  email: true,
  section: true,
  photo: true,
  note: true,
  location: true,
};

const fieldLabels: Record<keyof FormConfig, string> = {
  prefix: "คำนำหน้า / Prefix",
  firstname: "ชื่อ / First name",
  lastname: "นามสกุล / Last name",
  studentId: "รหัสนักศึกษา / Student ID",
  email: "อีเมล / Email",
  section: "เซคชั่น / Section",
  photo: "รูปภาพ / Photo",
  note: "หมายเหตุ / Note",
  location: "สถานที่ / Location",
};

const fieldPlaceholders: Record<keyof FormConfig, string> = {
  prefix: "นาย / นางสาว",
  firstname: "กรอกชื่อ",
  lastname: "กรอกนามสกุล",
  studentId: "กรอกรหัสนักศึกษา",
  email: "example@email.com",
  section: "เช่น 1",
  photo: "อัปโหลดรูปภาพ",
  note: "กรอกหมายเหตุเพิ่มเติม",
  location: "กรอกสถานที่",
};

export default function CheckInFormPage() {
  const [config, setConfig] = useState<FormConfig>(defaultConfig);
  const [saving, setSaving] = useState(false);
  const [initialConfig, setInitialConfig] = useState<FormConfig>(defaultConfig);
  const isDirty = JSON.stringify(config) !== JSON.stringify(initialConfig);
  const { showAlert } = useAlert();
  const { showConfirm } = useConfirm();

  const toggleField = (key: keyof FormConfig) => {
    setConfig((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const renderField = (key: keyof FormConfig) => {
    if (key === "note") {
      return (
        <div className="w-full">
          <div className="mb-2 flex items-center justify-between">
            <label className="text-xs text-gray-800 lg:text-base">
              {fieldLabels[key]}
            </label>

            <button
              onClick={() => toggleField(key)}
              className={`flex h-4 w-8 items-center rounded-full px-0.5 transition cursor-pointer lg:h-5 lg:w-10 lg:px-1 ${
                config[key] ? "bg-green-500" : "bg-gray-300"
              }`}
            >
              <div
                className={`h-3 w-3 rounded-full bg-white shadow-sm transform transition duration-200 lg:h-3.5 lg:w-3.5 ${
                  config[key]
                    ? "translate-x-4 lg:translate-x-5"
                    : "translate-x-0"
                }`}
              />
            </button>
          </div>

          <textarea
            disabled
            placeholder={fieldPlaceholders[key]}
            rows={3}
            className="w-full resize-none rounded-lg border border-gray-200 bg-gray-100 px-2.5 py-2 text-xs text-gray-400 placeholder:text-xs lg:px-3 lg:text-sm lg:placeholder:text-sm"
          />
        </div>
      );
    }

    if (key === "photo") {
      return (
        <div className="w-full">
          <div className="mb-2 flex items-center justify-between">
            <label className="text-xs text-gray-800 lg:text-base">
              {fieldLabels[key]}
            </label>

            <button
              onClick={() => toggleField(key)}
              className={`flex h-4 w-8 items-center rounded-full px-0.5 transition cursor-pointer lg:h-5 lg:w-10 lg:px-1 ${
                config[key] ? "bg-green-500" : "bg-gray-300"
              }`}
            >
              <div
                className={`h-3 w-3 rounded-full bg-white shadow-sm transform transition duration-200 lg:h-3.5 lg:w-3.5 ${
                  config[key]
                    ? "translate-x-4 lg:translate-x-5"
                    : "translate-x-0"
                }`}
              />
            </button>
          </div>

          <div className="flex w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 py-7 text-center lg:py-10">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-500 lg:h-12 lg:w-12">
              <Upload className="h-5 w-5 text-blue-500 lg:h-6 lg:w-6" />
            </div>

            <p className="mb-1 text-xs text-gray-600 lg:text-sm">
              เลือกรูปภาพ หรือ ลากและวางรูปภาพที่นี่
            </p>

            <p className="mb-4 text-[10px] text-gray-400 lg:text-xs">
              ไฟล์ต้องมีขนาดไม่เกิน 10 MB
            </p>

            <button
              disabled
              className="flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-500 lg:px-4 lg:text-sm"
            >
              <Upload className="h-3.5 w-3.5 lg:h-4 lg:w-4" />
              อัปโหลดรูปภาพ
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="w-full">
        <div className="mb-2 flex items-center justify-between">
          <label className="text-xs text-gray-800 lg:text-base">
            {fieldLabels[key]}
          </label>

          <button
            onClick={() => toggleField(key)}
            className={`flex h-4 w-8 items-center rounded-full px-0.5 transition cursor-pointer lg:h-5 lg:w-10 lg:px-1 ${
              config[key] ? "bg-green-500" : "bg-gray-300"
            }`}
          >
            <div
              className={`h-3 w-3 rounded-full bg-white shadow-sm transform transition duration-200 lg:h-3.5 lg:w-3.5 ${
                config[key] ? "translate-x-4 lg:translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        <input
          type="text"
          disabled
          placeholder={fieldPlaceholders[key]}
          className="w-full rounded-lg border border-gray-200 bg-gray-100 px-2.5 py-2 text-xs text-gray-400 placeholder:text-[10px] lg:px-3 lg:text-sm lg:placeholder:text-sm"
        />
      </div>
    );
  };

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await fetch("/api/check-in");

        if (!res.ok) throw new Error("โหลดไม่สำเร็จ");

        const data = await res.json();

        if (data.success) {
          setConfig(data.config);
          setInitialConfig(data.config);
        }
      } catch (err) {
        console.error(err);
      }
    };

    fetchConfig();
  }, []);

  const handleSaveConfig = async () => {
    try {
      setSaving(true);

      const res = await fetch("/api/check-in", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ config }),
      });

      const data = await res.json();

      if (!data.success) throw new Error();

      setInitialConfig(config);

      showAlert("บันทึกข้อมูลสำเร็จ", "success");
    } catch (err) {
      showAlert("เกิดข้อผิดพลาดในการบันทึก", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-blue-50">
      <div className="flex-1 min-h-0 overflow-y-auto p-6 pt-[80px] font-noto lg:pt-6">
        <div className="w-full rounded-2xl bg-white p-6 lg:p-8">
          <h1 className="text-[20px] font-semibold text-gray-800 lg:text-[26px]">
            ตั้งค่าแบบฟอร์มเช็คชื่อ
          </h1>

          <p className="mb-7 text-xs text-gray-500 lg:mb-9 lg:text-sm">
            เลือกเปิด–ปิดช่องข้อมูลที่ต้องการให้ผู้ใช้งานกรอก
          </p>

          <div className="space-y-5 lg:space-y-6">
            <div className="grid grid-cols-3 gap-2.5 lg:gap-4">
              {renderField("prefix")}
              {renderField("firstname")}
              {renderField("lastname")}
            </div>

            <div className="grid grid-cols-2 gap-2.5 lg:gap-4">
              {renderField("studentId")}
              {renderField("section")}
            </div>

            <div className="grid grid-cols-2 gap-2.5 lg:gap-4">
              {renderField("email")}
              {renderField("location")}
            </div>

            <div className="grid grid-cols-1">{renderField("note")}</div>

            {renderField("photo")}

            <div className="mt-6 w-full">
              <div className="flex w-full flex-col gap-2 text-sm lg:flex-row lg:justify-end lg:gap-3">
                <button
                  onClick={() =>
                    showConfirm(
                      "บันทึกแก้ไขข้อมูล",
                      handleSaveConfig,
                      "info",
                      "คุณต้องการยืนยันการบันทึกแก้ไขข้อมูลใช่หรือไม่",
                    )
                  }
                  disabled={saving || !isDirty}
                  className={`w-full rounded-lg px-5 py-2.5 text-xs text-white lg:w-auto lg:px-6 lg:text-sm ${
                    saving || !isDirty
                      ? "bg-gray-300"
                      : "bg-blue-500 hover:bg-blue-600 cursor-pointer"
                  }`}
                >
                  {saving ? "กำลังบันทึก..." : "บันทึก"}
                </button>

                <button
                  className="w-full rounded-md border border-gray-300 px-5 py-2.5 text-xs text-gray-600 hover:bg-gray-100 cursor-pointer lg:w-auto lg:px-6 lg:text-sm"
                  onClick={() =>
                    showConfirm(
                      "ยกเลิกการแก้ไขข้อมูล",
                      () => setConfig(initialConfig),
                      "edit",
                      "คุณต้องการยกเลิกการแก้ไขข้อมูลใช่หรือไม่",
                    )
                  }
                >
                  ยกเลิก
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

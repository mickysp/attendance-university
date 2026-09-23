"use client";

import { useEffect, useRef, useState } from "react";
import { authApi } from "@/services/api/auth";
import type { UserProfile } from "@/types/auth";
import ProfileImageDialog from "@/components/setting/ProfileImageDialog";
import Image from "next/image";
import {
  CameraIcon,
  CheckIcon,
  ChevronDownIcon,
  TrashIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";
import { useAlert } from "@/context/AlertContext";
import { USER_PREFIXES, validEmail } from "@/lib/user-validation";

async function readResponse(response: Response) {
  const data = await response.json().catch(() => null);
  if (!response.ok || !data?.success)
    throw new Error(data?.message || "ดำเนินการไม่สำเร็จ");
  return data;
}

export default function ProfileSection({
  initialProfile,
}: {
  initialProfile: UserProfile;
}) {
  const { showAlert } = useAlert();
  const inputRef = useRef<HTMLInputElement>(null);
  const prefixRef = useRef<HTMLDivElement>(null);
  const [openPrefix, setOpenPrefix] = useState(false);
  const [profile, setProfile] = useState<UserProfile>(initialProfile);
  const [initial, setInitial] = useState<UserProfile>(initialProfile);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [showImage, setShowImage] = useState(false);
  const imageUrl = preview || profile.avatarUrl;

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (
        prefixRef.current &&
        !prefixRef.current.contains(event.target as Node)
      )
        setOpenPrefix(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpenPrefix(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", escape);
    };
  }, []);

  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => {
      URL.revokeObjectURL(url);
      setPreview(null);
    };
  }, [file]);

  const changed = ["prefix", "fullname", "username", "email"].some(
    (key) =>
      profile[key as keyof UserProfile] !== initial[key as keyof UserProfile],
  );

  function chooseFile(selected: File | undefined) {
    if (!selected) return;
    if (
      !["image/jpeg", "image/png", "image/webp"].includes(selected.type) ||
      selected.size > 2 * 1024 * 1024 ||
      selected.size === 0
    ) {
      showAlert("เลือกรูป JPG, PNG หรือ WebP ขนาดไม่เกิน 2 MB", "error");
      if (inputRef.current) inputRef.current.value = "";
      return;
    }
    setFile(selected);
  }

  async function saveProfile(event: React.FormEvent) {
    event.preventDefault();
    const normalized = {
      ...profile,
      fullname: profile.fullname.trim(),
      username: profile.username.trim(),
      email: profile.email.trim().toLowerCase(),
    };
    if (
      !USER_PREFIXES.some((item) => item === normalized.prefix) ||
      !normalized.fullname ||
      !normalized.username ||
      !validEmail(normalized.email)
    ) {
      showAlert("กรุณากรอกข้อมูลโปรไฟล์ให้ถูกต้อง", "error");
      return;
    }
    setSaving(true);
    try {
      await readResponse(await authApi.updateProfile(normalized));
      setProfile(normalized);
      setInitial(normalized);
      window.dispatchEvent(new Event("profile-updated"));
      showAlert("บันทึกข้อมูลโปรไฟล์สำเร็จ", "success");
    } catch (cause) {
      showAlert(
        cause instanceof Error ? cause.message : "บันทึกไม่สำเร็จ",
        "error",
      );
    } finally {
      setSaving(false);
    }
  }

  async function uploadAvatar() {
    if (!file) return;
    setUploading(true);
    try {
      const body = new FormData();
      body.set("avatar", file);
      const data = await readResponse(await authApi.uploadAvatar(body));
      setProfile((current) => ({ ...current, avatarUrl: data.avatarUrl }));
      setInitial((current) => ({ ...current, avatarUrl: data.avatarUrl }));
      setFile(null);
      if (inputRef.current) inputRef.current.value = "";
      window.dispatchEvent(new Event("profile-updated"));
      showAlert("อัปโหลดรูปโปรไฟล์สำเร็จ", "success");
    } catch (cause) {
      showAlert(
        cause instanceof Error ? cause.message : "อัปโหลดรูปไม่สำเร็จ",
        "error",
      );
    } finally {
      setUploading(false);
    }
  }

  async function removeAvatar() {
    setUploading(true);
    try {
      await readResponse(await authApi.removeAvatar());
      setProfile((current) => ({ ...current, avatarUrl: null }));
      setInitial((current) => ({ ...current, avatarUrl: null }));
      setFile(null);
      if (inputRef.current) inputRef.current.value = "";
      window.dispatchEvent(new Event("profile-updated"));
      showAlert("ลบรูปโปรไฟล์สำเร็จ", "success");
    } catch (cause) {
      showAlert(
        cause instanceof Error ? cause.message : "ลบรูปไม่สำเร็จ",
        "error",
      );
    } finally {
      setUploading(false);
    }
  }

  return (
    <section
      className="overflow-hidden rounded-2xl border border-gray-200 bg-white"
      aria-labelledby="profile-heading"
    >
      <div className="border-b border-gray-100 px-5 py-5 sm:px-6">
        <h2
          id="profile-heading"
          className="text-lg font-semibold text-gray-800"
        >
          โปรไฟล์ของฉัน
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          แก้ไขข้อมูลบัญชีและรูปโปรไฟล์
        </p>
      </div>

      <div>
        <div className="flex flex-col gap-5 border-b border-gray-100 p-5 sm:flex-row sm:items-center sm:p-6">
          <button
            type="button"
            aria-label="ดูรูปโปรไฟล์ขนาดเต็ม"
            aria-haspopup="dialog"
            disabled={!imageUrl}
            onClick={() => setShowImage(true)}
            title={imageUrl ? "ดูรูปโปรไฟล์ขนาดเต็ม" : "ยังไม่มีรูปโปรไฟล์"}
            className="flex h-24 w-24 shrink-0 cursor-zoom-in items-center justify-center overflow-hidden rounded-full border-4 border-white bg-blue-50 text-blue-600 shadow-sm transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 disabled:cursor-default disabled:hover:opacity-100"
          >
            {preview || profile.avatarUrl ? (
              <Image
                unoptimized
                loading="eager"
                src={preview || profile.avatarUrl || ""}
                alt="รูปโปรไฟล์"
                width={96}
                height={96}
                className="h-full w-full object-cover"
              />
            ) : (
              <UserCircleIcon className="h-16 w-16" />
            )}
          </button>

          <div className="min-w-0 flex-1">
            <p className="font-medium text-gray-800">
              {profile.prefix} {profile.fullname}
            </p>

            <p className="mt-0.5 text-sm text-gray-500">{profile.role}</p>

            <p className="mt-2 text-xs text-gray-400">
              รองรับ JPG, PNG และ WebP ขนาดไม่เกิน 2 MB
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
              <input
                ref={inputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(event) => chooseFile(event.target.files?.[0])}
                className="sr-only"
                aria-label="เลือกรูปโปรไฟล์"
              />

              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                disabled={uploading}
                className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                <CameraIcon className="h-4 w-4" />
                เลือกรูป
              </button>

              {file && (
                <button
                  type="button"
                  onClick={() => void uploadAvatar()}
                  disabled={uploading}
                  className="cursor-pointer rounded-md bg-[var(--primary)] px-3 py-2 text-sm text-white hover:bg-[var(--primary-hover)] disabled:opacity-50"
                >
                  {uploading ? "กำลังอัปโหลด..." : "อัปโหลดรูป"}
                </button>
              )}

              {profile.avatarUrl && (
                <button
                  type="button"
                  onClick={() => void removeAvatar()}
                  disabled={uploading}
                  className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-red-200 px-3 py-2 text-sm text-red-500 hover:bg-red-50 disabled:opacity-50"
                >
                  <TrashIcon className="h-4 w-4" />
                  ลบรูป
                </button>
              )}
            </div>
          </div>
        </div>

        <form
          onSubmit={(event) => void saveProfile(event)}
          className="p-5 sm:p-6"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div
              ref={prefixRef}
              className="relative text-sm font-medium text-gray-700"
            >
              คำนำหน้า
              <button
                type="button"
                aria-label="เลือกคำนำหน้า"
                aria-expanded={openPrefix}
                onClick={() => setOpenPrefix(!openPrefix)}
                className="form-input-card mt-1 flex min-h-11 cursor-pointer items-center justify-between gap-2 text-left text-sm font-normal text-gray-700"
              >
                <span>{profile.prefix || "เลือกคำนำหน้า"}</span>
                <ChevronDownIcon className="h-4 w-4 text-gray-400" />
              </button>
              {openPrefix && (
                <div className="absolute left-0 top-full z-30 mt-1 w-full overflow-hidden rounded-md border border-gray-200 bg-white shadow-lg">
                  {USER_PREFIXES.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => {
                        setProfile({ ...profile, prefix: item });
                        setOpenPrefix(false);
                      }}
                      className={`flex w-full cursor-pointer items-center justify-between px-4 py-2 text-left text-sm ${profile.prefix === item ? "bg-blue-50 font-medium text-blue-600" : "text-gray-700 hover:bg-gray-100"}`}
                    >
                      {item}
                      {profile.prefix === item && (
                        <CheckIcon className="h-4 w-4" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <label className="text-sm font-medium text-gray-700">
              ชื่อ-นามสกุล
              <input
                required
                value={profile.fullname}
                onChange={(event) =>
                  setProfile({ ...profile, fullname: event.target.value })
                }
                className="form-input-card mt-1 text-sm"
              />
            </label>

            <label className="text-sm font-medium text-gray-700">
              ชื่อผู้ใช้
              <input
                required
                value={profile.username}
                onChange={(event) =>
                  setProfile({ ...profile, username: event.target.value })
                }
                className="form-input-card mt-1 text-sm"
              />
            </label>

            <label className="text-sm font-medium text-gray-700">
              อีเมล
              <input
                required
                type="email"
                value={profile.email}
                onChange={(event) =>
                  setProfile({ ...profile, email: event.target.value })
                }
                className="form-input-card mt-1 text-sm"
              />
            </label>
          </div>

          <p className="mt-3 text-xs text-gray-400">
            หากเปลี่ยนชื่อผู้ใช้ ให้ใช้ชื่อใหม่ในการเข้าสู่ระบบครั้งถัดไป
          </p>

          <div className="mt-5 flex justify-end border-t border-gray-100 pt-4">
            <button
              type="submit"
              disabled={!changed || saving}
              className="cursor-pointer rounded-md bg-[var(--primary)] px-5 py-2.5 text-sm text-white hover:bg-[var(--primary-hover)] disabled:opacity-50"
            >
              {saving ? "กำลังบันทึก..." : "บันทึก"}
            </button>
          </div>
        </form>
      </div>
      {showImage && imageUrl && (
        <ProfileImageDialog
          key={imageUrl}
          src={imageUrl}
          onClose={() => setShowImage(false)}
        />
      )}
    </section>
  );
}

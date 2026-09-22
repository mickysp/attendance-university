"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ChevronDownIcon,
  PlusIcon,
  UserPlusIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { useAlert } from "@/context/AlertContext";
import { useConfirm } from "@/context/swal";
import AdministratorSelect from "@/components/administrators/Select";
import AdministratorTable from "@/components/administrators/Table";
import type { Administrator, AdministratorRole } from "@/types/administrators";

const emptyForm = { 
  prefix: "",
  fullname: "",
  username: "",
  email: "",
  password: "",
  role: "Teaching Assistant" as AdministratorRole,
};

async function request(method: string, body?: object) {
  const response = await fetch("/api/administrators", {
    method,
    cache: "no-store",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await response.json();
  if (!response.ok || !data.success)
    throw new Error(data.message || "ดำเนินการไม่สำเร็จ");
  return data;
}

export default function AdministratorsPage() {
  const { showAlert } = useAlert();
  const { showConfirm } = useConfirm();
  const dialogRef = useRef<HTMLDivElement>(null);
  const formRoleRef = useRef<HTMLDivElement>(null);
  const [users, setUsers] = useState<Administrator[]>([]);
  const [currentUserId, setCurrentUserId] = useState("");
  const [keyword, setKeyword] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [openFormRole, setOpenFormRole] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await request("GET");
      setUsers(data.data);
      setCurrentUserId(data.currentUserId);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "โหลดข้อมูลไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);

  const filtered = users.filter(
    (user) =>
      (roleFilter === "all" || user.role === roleFilter) &&
      [user.prefix, user.fullname, user.username, user.email].some((value) =>
        value.toLowerCase().includes(keyword.trim().toLowerCase()),
      ),
  );

  useEffect(() => {
    if (!showForm) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && openFormRole) setOpenFormRole(false);
      else if (event.key === "Escape" && !busy) setShowForm(false);
    };
    const onMouseDown = (event: MouseEvent) => {
      if (
        formRoleRef.current &&
        !formRoleRef.current.contains(event.target as Node)
      )
        setOpenFormRole(false);
    };
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("mousedown", onMouseDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("mousedown", onMouseDown);
    };
  }, [showForm, busy, openFormRole]);

  function bounceDialog() {
    const dialog = dialogRef.current;
    if (!dialog) return;
    dialog.classList.remove("app-dialog-attention");
    void dialog.offsetWidth;
    dialog.classList.add("app-dialog-attention");
  }

  async function addUser(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      await request("POST", form);
      setShowForm(false);
      setForm(emptyForm);
      await load();
      showAlert("เพิ่มผู้ใช้สำเร็จ", "success");
    } catch (e) {
      showAlert(
        e instanceof Error ? e.message : "เพิ่มผู้ใช้ไม่สำเร็จ",
        "error",
      );
    } finally {
      setBusy(false);
    }
  }
  function changeRole(user: Administrator, role: AdministratorRole) {
    if (busy || role === user.role) return;
    void showConfirm(
      `เปลี่ยนสิทธิ์ของ ${user.fullname}?`,
      async () => {
        setBusy(true);
        try {
          await request("PATCH", { id: user._id, role });
          setUsers((items) =>
            items.map((item) => (item._id === user._id ? { ...item, role } : item)),
          );
          showAlert("แก้ไขสิทธิ์สำเร็จ", "success");
        } catch (e) {
          showAlert(
            e instanceof Error ? e.message : "แก้ไขสิทธิ์ไม่สำเร็จ",
            "error",
          );
        } finally {
          setBusy(false);
        }
      },
      "edit",
      `จาก ${user.role} เป็น ${role}`,
    );
  }
  function removeUser(user: Administrator) {
    void showConfirm(
      `ลบผู้ใช้ ${user.fullname}?`,
      async () => {
        setBusy(true);
        try {
          await request("DELETE", { id: user._id });
          setUsers((items) => items.filter((item) => item._id !== user._id));
          showAlert("ลบผู้ใช้สำเร็จ", "success");
        } catch (e) {
          showAlert(
            e instanceof Error ? e.message : "ลบผู้ใช้ไม่สำเร็จ",
            "error",
          );
        } finally {
          setBusy(false);
        }
      },
      "delete",
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-blue-50 font-noto">
      <main className="min-h-0 min-w-0 flex-1 overflow-y-auto p-6 pt-[80px] lg:pt-6">
        <div className="flex min-w-0 flex-col rounded-2xl bg-white">
          <div className="flex shrink-0 flex-col px-6 pt-6 pb-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-[26px] font-semibold text-gray-800">
                Administrators
              </h1>
              <p className="mt-1 text-sm text-gray-400">
                จัดการบัญชีผู้ใช้และสิทธิ์ในระบบ
              </p>
            </div>
            
            {(loading || error || users.length > 0) && <button
              type="button"
              onClick={() => setShowForm(true)}
              className="mt-4 flex h-[40px] w-full cursor-pointer items-center justify-center gap-2 rounded-md bg-[var(--primary)] px-6 py-2 text-[14px] text-white transition hover:bg-[var(--primary-hover)] md:mt-0 md:w-auto"
            >
              <PlusIcon className="h-4 w-4" />
              เพิ่มผู้ใช้
            </button>}
          </div>

          {(loading || error || users.length > 0) && <div className="px-6">
            <AdministratorSelect
              keyword={keyword}
              role={roleFilter}
              onKeywordChange={setKeyword}
              onRoleChange={setRoleFilter}
            />
          </div>}

          {(loading || error || users.length > 0) && <p className="mt-6 mb-4 px-6 font-semibold text-gray-600">
            ผู้ใช้ทั้งหมด {users.length} รายการ
            {(keyword || roleFilter !== "all") &&
              ` · พบ ${filtered.length} รายการ`}
          </p>}

          <div className="px-6 pb-6">
            <AdministratorTable
              users={filtered}
              totalCount={users.length}
              currentUserId={currentUserId}
              busy={busy}
              loading={loading}
              error={error}
              filterKey={keyword + "|" + roleFilter}
              onChangeRole={(user, role) => void changeRole(user, role)}
              onDelete={removeUser}
              onRetry={() => void load()}
              onAdd={() => setShowForm(true)}
            />
          </div>
        </div>
      </main>

      {showForm && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="admin-dialog-title"
          className="app-dialog-backdrop fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3 font-noto sm:p-6"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) bounceDialog();
          }}
        >
          <div
            ref={dialogRef}
            className="app-dialog-panel max-h-[95vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-6 shadow-sm"
            onAnimationEnd={(event) => {
              if (event.animationName === "app-dialog-attention")
                event.currentTarget.classList.remove("app-dialog-attention");
            }}
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-[var(--card)] p-2">
                  <UserPlusIcon className="h-5 w-5 text-gray-700" />
                </div>
                <h2
                  id="admin-dialog-title"
                  className="text-lg font-semibold text-gray-800"
                >
                  เพิ่มผู้ใช้
                </h2>
              </div>
              <button
                type="button"
                aria-label="ปิดหน้าต่าง"
                disabled={busy}
                onClick={() => setShowForm(false)}
                className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 disabled:opacity-50"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={(e) => void addUser(e)}>
              <div className="space-y-4 rounded-xl border border-gray-100 bg-[var(--card)] p-4">
                <div className="grid grid-cols-3 gap-3">
                  <input
                    required
                    placeholder="คำนำหน้า"
                    value={form.prefix}
                    onChange={(e) =>
                      setForm({ ...form, prefix: e.target.value })
                    }
                    className="form-input-card text-sm"
                  />

                  <input
                    required
                    placeholder="ชื่อ-นามสกุล"
                    value={form.fullname}
                    onChange={(e) =>
                      setForm({ ...form, fullname: e.target.value })
                    }
                    className="form-input-card col-span-2 text-sm"
                  />
                </div>

                <input
                  required
                  placeholder="ชื่อผู้ใช้"
                  value={form.username}
                  onChange={(e) =>
                    setForm({ ...form, username: e.target.value })
                  }
                  className="form-input-card w-full text-sm"
                />

                <input
                  required
                  type="email"
                  placeholder="อีเมล"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="form-input-card w-full text-sm"
                />

                <input
                  required
                  type="password"
                  minLength={8}
                  placeholder="รหัสผ่าน (อย่างน้อย 8 ตัวอักษร)"
                  value={form.password}
                  onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
                  }
                  className="form-input-card w-full text-sm"
                />

                <div ref={formRoleRef} className="relative">
                  <button
                    type="button"
                    aria-label="สิทธิ์ผู้ใช้ใหม่"
                    aria-expanded={openFormRole}
                    onClick={() => setOpenFormRole(!openFormRole)}
                    className="form-input-card flex min-h-10 cursor-pointer items-center justify-between gap-2 text-left text-sm text-gray-700"
                  >
                    <span>{form.role}</span>
                    <ChevronDownIcon className="h-4 w-4 text-gray-400" />
                  </button>

                  {openFormRole && (
                    <div className="absolute bottom-full left-0 z-30 mb-1 w-full overflow-hidden rounded-md border border-gray-200 bg-white shadow-lg">
                      {(
                        ["Teaching Assistant", "Teacher"] as AdministratorRole[]
                      ).map((role) => (
                        <button
                          key={role}
                          type="button"
                          onClick={() => {
                            setForm({ ...form, role });
                            setOpenFormRole(false);
                          }}
                          className={`block w-full cursor-pointer px-3 py-2 text-left text-sm hover:bg-gray-100 ${form.role === role ? "bg-blue-50 font-medium text-blue-600" : "text-gray-700"}`}
                        >
                          {role}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-2 border-t border-gray-100 pt-4">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="cursor-pointer rounded-md border border-gray-200 px-5 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  ยกเลิก
                </button>
                <button
                  disabled={busy}
                  type="submit"
                  className="cursor-pointer rounded-md bg-[var(--primary)] px-5 py-2 text-sm text-white hover:bg-[var(--primary-hover)] disabled:opacity-50"
                >
                  บันทึก
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ChevronDownIcon,
  CheckIcon,
  EyeIcon,
  EyeSlashIcon,
  PlusIcon,
  UserPlusIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { useAlert } from "@/context/AlertContext";
import { useConfirm } from "@/context/swal";
import AdministratorSelect from "@/components/administrators/Select";
import AdministratorTable from "@/components/administrators/Table";
import type { Administrator, AdministratorRole } from "@/types/administrators";
import { USER_PREFIXES, validEmail, validPassword } from "@/lib/user-validation";

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
  const formPrefixRef = useRef<HTMLDivElement>(null);
  const [users, setUsers] = useState<Administrator[]>([]);
  const [currentUserId, setCurrentUserId] = useState("");
  const [canManage, setCanManage] = useState(false);
  const [canCreate, setCanCreate] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [openFormRole, setOpenFormRole] = useState(false);
  const [openFormPrefix, setOpenFormPrefix] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof typeof emptyForm, string>>>({});
  const [showPassword, setShowPassword] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await request("GET");
      setUsers(data.data);
      setCurrentUserId(data.currentUserId);
      setCanManage(data.canManage === true);
      setCanCreate(data.canCreate === true);
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
      if (event.key === "Escape" && (openFormRole || openFormPrefix)) { setOpenFormRole(false); setOpenFormPrefix(false); }
      else if (event.key === "Escape" && !busy) setShowForm(false);
    };
    const onMouseDown = (event: MouseEvent) => {
      if (
        formRoleRef.current &&
        !formRoleRef.current.contains(event.target as Node)
      )
        setOpenFormRole(false);
      if (formPrefixRef.current && !formPrefixRef.current.contains(event.target as Node)) setOpenFormPrefix(false);
    };
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("mousedown", onMouseDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("mousedown", onMouseDown);
    };
  }, [showForm, busy, openFormRole, openFormPrefix]);

  function bounceDialog() {
    const dialog = dialogRef.current;
    if (!dialog) return;
    dialog.classList.remove("app-dialog-attention");
    void dialog.offsetWidth;
    dialog.classList.add("app-dialog-attention");
  }

  async function addUser(event: React.FormEvent) {
    event.preventDefault();
    if (!canCreate) return;
    const username = form.username.trim();
    const email = form.email.trim();
    const errors: typeof formErrors = {};
    if (!USER_PREFIXES.some((prefix) => prefix === form.prefix)) errors.prefix = "กรุณาเลือกคำนำหน้า";
    if (!form.fullname.trim()) errors.fullname = "กรุณากรอกชื่อ-นามสกุล";
    if (!username) errors.username = "กรุณากรอกชื่อผู้ใช้";
    else if (users.some((user) => user.username.toLowerCase() === username.toLowerCase())) errors.username = "ชื่อผู้ใช้นี้มีอยู่แล้ว";
    if (!validEmail(email)) errors.email = "กรุณากรอกอีเมลที่ถูกต้อง";
    else if (users.some((user) => user.email.toLowerCase() === email.toLowerCase())) errors.email = "อีเมลนี้มีอยู่แล้ว";
    if (!validPassword(form.password)) errors.password = "อย่างน้อย 8 ตัวอักษร มีตัวอักษรอังกฤษและตัวเลข";
    setFormErrors(errors);
    if (Object.keys(errors).length) return;
    setBusy(true);
    try {
      await request("POST", { ...form, username, email, role: canManage ? form.role : "Teaching Assistant" });
      setShowForm(false);
      setForm(emptyForm);
      setFormErrors({});
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

  function updateForm(key: keyof typeof emptyForm, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
    setFormErrors((current) => ({ ...current, [key]: "" }));
  }
  function changeRole(user: Administrator, role: AdministratorRole) {
    if (!canManage || busy || role === user.role) return;
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
    if (!canManage) return;
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
      <main className="relative min-h-0 min-w-0 flex-1 overflow-y-auto p-6 pt-[80px] lg:pt-6">
        {loading && <div role="status" className="absolute inset-0 z-10 flex items-center justify-center bg-gray-300"><div className="flex flex-col items-center gap-4"><div className="h-14 w-14 animate-spin rounded-full border-4 border-white border-t-transparent" /><p className="text-base text-white">กำลังโหลด...</p></div></div>}
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
            
            {canCreate && (loading || error || users.length > 0) && <button
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
              canManage={canManage}
              canCreate={canCreate}
              currentUserId={currentUserId}
              busy={busy}
              loading={loading}
              error={error}
              filterKey={keyword + "|" + roleFilter}
              onChangeRole={(user, role) => void changeRole(user, role)}
              onDelete={removeUser}
              onRetry={() => void load()}
              onAdd={() => { if (canCreate) setShowForm(true); }}
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
            <div className="mb-5 flex items-center justify-between gap-3 border-b border-gray-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-blue-50 p-2.5">
                  <UserPlusIcon className="h-5 w-5 text-blue-600" />
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
            <form noValidate onSubmit={(e) => void addUser(e)}>
              <p className="mb-5 text-sm text-gray-500">กรอกข้อมูลเพื่อสร้างบัญชีให้ผู้ใช้ใหม่</p>
              <div className="space-y-4 rounded-xl border border-gray-100 bg-[var(--card)] p-4 sm:p-5">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-[150px_minmax(0,1fr)]">
                  <div ref={formPrefixRef} className="relative text-sm font-medium text-gray-700">คำนำหน้า
                    <button type="button" aria-label="เลือกคำนำหน้า" aria-expanded={openFormPrefix} onClick={() => setOpenFormPrefix(!openFormPrefix)} className={`form-input-card mt-1 flex min-h-11 cursor-pointer items-center justify-between gap-2 text-left text-sm font-normal text-gray-700 ${formErrors.prefix ? "!border-red-400" : ""}`}>
                      <span className="truncate">{form.prefix || "เลือกคำนำหน้า"}</span><ChevronDownIcon className="h-4 w-4 shrink-0 text-gray-400" />
                    </button>
                    {openFormPrefix && <div className="absolute left-0 top-full z-30 mt-1 w-full overflow-hidden rounded-md border border-gray-200 bg-white shadow-lg">
                      {USER_PREFIXES.map((prefix) => <button key={prefix} type="button" onClick={() => { updateForm("prefix", prefix); setOpenFormPrefix(false); }} className={`flex w-full cursor-pointer items-center justify-between px-4 py-2 text-left text-sm ${form.prefix === prefix ? "bg-blue-50 font-medium text-blue-600" : "text-gray-700 hover:bg-gray-100"}`}>{prefix}{form.prefix === prefix && <CheckIcon className="h-4 w-4" />}</button>)}
                    </div>}
                    {formErrors.prefix && <span className="mt-1 block text-xs text-red-600">{formErrors.prefix}</span>}
                  </div>
                  <label className="block text-sm font-medium text-gray-700">ชื่อ-นามสกุล
                    <input required autoComplete="name" value={form.fullname} onChange={(event) => updateForm("fullname", event.target.value)} placeholder="ชื่อ-นามสกุล" className={`form-input-card mt-1 h-11 w-full text-sm ${formErrors.fullname ? "!border-red-400" : ""}`} />
                    {formErrors.fullname && <span className="mt-1 block text-xs text-red-600">{formErrors.fullname}</span>}
                  </label>
                </div>

                <label className="block text-sm font-medium text-gray-700">ชื่อผู้ใช้
                  <input required autoComplete="off" value={form.username} onChange={(event) => updateForm("username", event.target.value)} placeholder="ชื่อผู้ใช้สำหรับเข้าสู่ระบบ" className={`form-input-card mt-1 h-11 w-full text-sm ${formErrors.username ? "!border-red-400" : ""}`} />
                  {formErrors.username && <span className="mt-1 block text-xs text-red-600">{formErrors.username}</span>}
                </label>

                <label className="block text-sm font-medium text-gray-700">อีเมล
                  <input required type="email" autoComplete="off" value={form.email} onChange={(event) => updateForm("email", event.target.value)} placeholder="name@example.com" className={`form-input-card mt-1 h-11 w-full text-sm ${formErrors.email ? "!border-red-400" : ""}`} />
                  {formErrors.email && <span className="mt-1 block text-xs text-red-600">{formErrors.email}</span>}
                </label>

                <label className="block text-sm font-medium text-gray-700">รหัสผ่าน
                  <span className="relative mt-1 block">
                    <input required type={showPassword ? "text" : "password"} autoComplete="new-password" value={form.password} onChange={(event) => updateForm("password", event.target.value)} placeholder="อย่างน้อย 8 ตัวอักษร" className={`form-input-card h-11 w-full pr-11 text-sm ${formErrors.password ? "!border-red-400" : ""}`} />
                    <button type="button" aria-label={showPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"} onClick={() => setShowPassword((value) => !value)} className="absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer text-gray-400 hover:text-gray-600">{showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}</button>
                  </span>
                  <span className={`mt-1 block text-xs ${formErrors.password ? "text-red-600" : "text-gray-400"}`}>{formErrors.password || "อย่างน้อย 8 ตัวอักษร มีตัวอักษรอังกฤษและตัวเลข"}</span>
                </label>

                <div ref={formRoleRef} className="relative text-sm font-medium text-gray-700">สิทธิ์
                  <button
                    type="button"
                    aria-label="สิทธิ์ผู้ใช้ใหม่"
                    aria-expanded={openFormRole}
                    disabled={!canManage}
                    onClick={() => setOpenFormRole(!openFormRole)}
                    className="form-input-card mt-1 flex min-h-11 cursor-pointer items-center justify-between gap-2 text-left text-sm font-normal text-gray-700 disabled:cursor-default"
                  >
                    <span>{canManage ? form.role : "Teaching Assistant"}</span>
                    {canManage && <ChevronDownIcon className="h-4 w-4 text-gray-400" />}
                  </button>

                  {canManage && openFormRole && (
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
                          className={`flex w-full cursor-pointer items-center justify-between px-4 py-2 text-left text-sm ${form.role === role ? "bg-blue-50 font-medium text-blue-600" : "text-gray-700 hover:bg-gray-100"}`}
                        >
                          {role}
                          {form.role === role && <CheckIcon className="h-4 w-4" />}
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

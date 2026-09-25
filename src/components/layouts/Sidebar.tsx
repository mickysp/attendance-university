"use client";

import { authApi } from "@/services/api/auth";
import {
  HomeIcon,
  UserGroupIcon,
  IdentificationIcon,
  BookOpenIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  ClipboardDocumentCheckIcon,
  Cog6ToothIcon,
  CalendarDaysIcon,
  AcademicCapIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";
import { ReactNode, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import NotificationCenter from "@/components/notifications/NotificationCenter";

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();

  const [desktopCollapsed, setDesktopCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [logoutLoading, setLogoutLoading] = useState(false);

  const [user, setUser] = useState({
    fullname: "",
    role: "",
    avatarUrl: null as string | null,
  });

  const touchStartX = useRef(0);
  const touchCurrentX = useRef(0);

  const SWIPE_DISTANCE = 60;

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    touchStartX.current = e.touches[0].clientX;
    touchCurrentX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    touchCurrentX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    const distance = touchCurrentX.current - touchStartX.current;

    if (touchStartX.current < 30 && distance > SWIPE_DISTANCE) {
      setMobileOpen(true);
    }

    if (mobileOpen && distance < -SWIPE_DISTANCE) {
      setMobileOpen(false);
    }
  };

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await authApi.getUser();

        const data = await res.json();

        if (data.success) {
          setUser(data.user);
        }
      } catch {
      } finally {
        setLoading(false);
      }
    };

    void fetchUser();
    window.addEventListener("profile-updated", fetchUser);
    return () => window.removeEventListener("profile-updated", fetchUser);
  }, [router]);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (mobileOpen || logoutLoading) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen, logoutLoading]);

  const handleLogout = async () => {
    if (logoutLoading) return;

    setLogoutLoading(true);
    setMobileOpen(false);

    try {
      await authApi.logout();
    } catch {
    } finally {
      router.replace("/login");
    }
  };

  const handleNavigate = (path: string) => {
    router.push(path);
    setMobileOpen(false);
  };

  const userInitial = user.fullname
    ? user.fullname.charAt(0).toUpperCase()
    : "?";

  return (
    <>
      {logoutLoading && (
        <div
          className="
            fixed
            inset-0
            z-[9999]
            flex
            items-center
            justify-center
            bg-gray-500/40
            backdrop-blur-sm
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

            <p
              className="
                text-base
                font-medium
                text-white
              "
            >
              กำลังออกจากระบบ...
            </p>
          </div>
        </div>
      )}

      {/* =====================================================
          Mobile
      ===================================================== */}

      <header
        className="
          absolute
          left-0
          right-0
          top-0
          z-[40]
          flex
          h-[75px]
          items-center
          justify-between
          bg-blue-50
          px-6
          lg:hidden
        "
      >
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="
            flex
            h-10
            w-10
            shrink-0
            cursor-pointer
            items-center
            justify-center
            rounded-lg
            bg-white
            shadow-sm
            transition-all
            duration-200
            hover:bg-blue-50
            active:scale-95
          "
          aria-label="Open menu"
        >
          <Bars3Icon className="h-6 w-6 text-blue-700" />
        </button>

        <button
          type="button"
          className="
            relative
            flex
            h-10
            w-10
            shrink-0
            cursor-pointer
            items-center
            justify-center
            rounded-lg
            transition-all
            duration-200
            hover:bg-white/60
            active:scale-95
          "
          aria-label="Notifications"
        ></button>
      </header>

      <div
        className="
          fixed
          left-0
          top-[64px]
          z-[45]
          h-[calc(100vh-64px)]
          w-[25px]
          lg:hidden
        "
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      />

      {mobileOpen && (
        <div
          className="
            fixed
            inset-0
            z-[50]
            bg-black/40
            lg:hidden
          "
          onClick={() => setMobileOpen(false)}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        />
      )}

      <aside
        className={`
          fixed
          left-0
          top-0
          z-[60]
          flex
          h-screen
          w-[280px]
          max-w-[85vw]
          flex-col
          justify-between
          bg-white
          px-4
          pt-4
          pb-0
          font-noto
          shadow-xl
          transition-transform
          duration-300
          ease-out
          lg:hidden

          ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
        `}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="min-h-0 w-full">
          <div
            className="
              mb-6
              flex
              items-center
              justify-between
              pb-4
            "
          >
            <div className="flex items-center gap-3">
              <div
                className="
                  flex
                  h-10
                  w-10
                  shrink-0
                  items-center
                  justify-center
                  rounded-xl
                  bg-gradient-to-br
                  from-emerald-500
                  to-blue-600
                  shadow-sm
                "
              >
                <CalendarDaysIcon className="h-5 w-5 text-white" />
              </div>

              <div>
                <h1 className="text-lg font-semibold text-gray-900">Classora</h1>

                <p className="text-xs text-gray-500">Management System</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="
                flex
                h-9
                w-9
                shrink-0
                cursor-pointer
                items-center
                justify-center
                rounded-lg
                bg-gray-50
                text-gray-600
                transition
                hover:bg-gray-100
                hover:text-gray-900
              "
              aria-label="Close menu"
            >
              <Bars3Icon className="h-5 w-5 rotate-180" />
            </button>
          </div>

          <SidebarMenu
            pathname={pathname}
            collapsed={false}
            onNavigate={handleNavigate}
          />
        </div>

        <div className="mb-8 w-full shrink-0">
          <UserSection
            user={user}
            loading={loading}
            userInitial={userInitial}
            collapsed={false}
            onLogout={handleLogout}
            logoutLoading={logoutLoading}
          />
        </div>
      </aside>

      <aside
        className={`
          hidden
          h-screen
          shrink-0
          flex-col
          justify-between
          overflow-y-auto
          bg-white
          p-4
          font-noto
          shadow-lg
          transition-all
          duration-300
          lg:flex

          ${desktopCollapsed ? "w-[70px]" : "w-[280px]"}
        `}
      >
        <div>
          <div
            className={`
              mb-6
              flex
              items-center
              border-b
              border-gray-200
              pb-4

              ${desktopCollapsed ? "justify-center" : "justify-between"}
            `}
          >
            {!desktopCollapsed && (
              <div className="flex items-center gap-3">
                <div
                  className="
                    flex
                    h-10
                    w-10
                    shrink-0
                    items-center
                    justify-center
                    rounded-xl
                    bg-gradient-to-br
                    from-emerald-500
                    to-blue-600
                    shadow-sm
                  "
                >
                  <CalendarDaysIcon className="h-5 w-5 text-white" />
                </div>

                <div>
                  <h1 className="text-lg font-semibold text-gray-900">
                    Classora
                  </h1>

                  <p className="text-xs text-gray-500">Management System</p>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={() => setDesktopCollapsed(!desktopCollapsed)}
              className="
                cursor-pointer
                rounded-lg
                p-2
                transition
                hover:bg-gray-100
              "
              aria-label="Toggle sidebar"
            >
              <Bars3Icon className="h-5 w-5 text-gray-700" />
            </button>
          </div>

          <SidebarMenu
            pathname={pathname}
            collapsed={desktopCollapsed}
            onNavigate={handleNavigate}
          />
        </div>

        <UserSection
          user={user}
          loading={loading}
          userInitial={userInitial}
          collapsed={desktopCollapsed}
          onLogout={handleLogout}
          logoutLoading={logoutLoading}
        />
      </aside>
    </>
  );
}

type SidebarMenuProps = {
  pathname: string;
  collapsed: boolean;
  onNavigate: (path: string) => void;
};

function SidebarMenu({ pathname, collapsed, onNavigate }: SidebarMenuProps) {
  return (
    <nav className="flex flex-col gap-6 text-sm font-medium">
      {!collapsed && (
        <p className="px-3 text-xs uppercase text-gray-400">เมนู</p>
      )}

      <div className="flex flex-col gap-2">
        <SidebarItem
          icon={<HomeIcon />}
          label="แดชบอร์ด"
          collapsed={collapsed}
          active={pathname === "/dashboard"}
          onClick={() => onNavigate("/dashboard")}
        />

        <SidebarItem
          icon={<BookOpenIcon />}
          label="ชั้นเรียน"
          collapsed={collapsed}
          active={pathname.startsWith("/classes")}
          onClick={() => onNavigate("/classes")}
        />

        <SidebarItem
          icon={<UserGroupIcon />}
          label="นักศึกษา"
          collapsed={collapsed}
          active={pathname.startsWith("/students")}
          onClick={() => onNavigate("/students")}
        />

        <SidebarItem
          icon={<AcademicCapIcon />}
          label="อาจารย์"
          collapsed={collapsed}
          active={pathname.startsWith("/teachers")}
          onClick={() => onNavigate("/teachers")}
        />

        <SidebarItem
          icon={<IdentificationIcon />}
          label="เวลาเข้าเรียน"
          collapsed={collapsed}
          active={pathname.startsWith("/attendance")}
          onClick={() => onNavigate("/attendance")}
        />

        <SidebarItem
          icon={<ClipboardDocumentCheckIcon />}
          label="ตั้งค่าแบบฟอร์มเช็คชื่อ"
          collapsed={collapsed}
          active={pathname.startsWith("/check-in/configform")}
          onClick={() => onNavigate("/check-in/configform")}
        />
      </div>

      {!collapsed && (
        <p className="mt-2 px-3 text-xs uppercase text-gray-400">การจัดการ</p>
      )}

      <div className="flex flex-col gap-2">
        <SidebarItem
          icon={<UserCircleIcon />}
          label="ผู้ดูแลระบบ"
          collapsed={collapsed}
          active={pathname.startsWith("/administrators")}
          onClick={() => onNavigate("/administrators")}
        />

        <SidebarItem
          icon={<Cog6ToothIcon />}
          label="ตั้งค่า"
          collapsed={collapsed}
          active={pathname.startsWith("/setting")}
          onClick={() => onNavigate("/setting")}
        />
      </div>
    </nav>
  );
}

type SidebarItemProps = {
  icon: ReactNode;
  label: string;
  collapsed?: boolean;
  active?: boolean;
  onClick?: () => void;
};

function SidebarItem({
  icon,
  label,
  collapsed = false,
  active = false,
  onClick,
}: SidebarItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={collapsed ? label : undefined}
      className={`
        flex
        shrink-0
        items-center
        ${collapsed ? "justify-center px-2" : "gap-3 px-3"}
        cursor-pointer
        rounded-lg
        py-3
        text-left
        whitespace-nowrap
        transition-all
        duration-200

        ${collapsed ? "lg:w-full" : "w-auto lg:w-full"}

        ${
          active
            ? "bg-blue-100 font-medium text-blue-600"
            : "text-gray-700 hover:bg-gray-100"
        }
      `}
    >
      <span
        className={`
          shrink-0
          ${collapsed ? "h-6 w-6" : "h-5 w-5"}
        `}
      >
        {icon}
      </span>

      {!collapsed && <span className="whitespace-nowrap">{label}</span>}
    </button>
  );
}

type UserSectionProps = {
  user: {
    fullname: string;
    role: string;
    avatarUrl: string | null;
  };
  loading: boolean;
  userInitial: string;
  collapsed: boolean;
  onLogout: () => void;
  logoutLoading: boolean;
};

function UserSection({
  user,
  loading,
  userInitial,
  collapsed,
  onLogout,
  logoutLoading,
}: UserSectionProps) {
  return (
    <div
      className={`
        pt-1
      `}
    >
      <div className="mb-3 border-b border-gray-200 pb-3">
        <NotificationCenter collapsed={collapsed} />
      </div>
      <div
        className={`
          flex
          items-center
          ${collapsed ? "justify-center" : "justify-between"}
          rounded-lg
          bg-gray-50
          px-3
          py-2
        `}
      >
        <div
          className={`
            flex
            items-center
            ${collapsed ? "justify-center" : "gap-3"}
          `}
        >
          <div
            className="
              flex
              h-9
              w-9
              shrink-0
              items-center
              justify-center
              rounded-full
              bg-gray-300
              overflow-hidden
              text-sm
              font-semibold
              text-gray-700
            "
          >
            {user.avatarUrl ? (
              <Image
                unoptimized
                loading="eager"
                src={user.avatarUrl}
                alt="รูปโปรไฟล์"
                width={36}
                height={36}
                className="h-full w-full object-cover"
              />
            ) : (
              userInitial
            )}
          </div>

          {!collapsed && (
            <div
              className="
                flex
                min-w-0
                flex-col
                leading-tight
              "
            >
              <span
                className="
                  max-w-[150px]
                  truncate
                  text-sm
                  font-medium
                "
              >
                {loading ? "กำลังโหลด..." : user.fullname || "ไม่ระบุชื่อ"}
              </span>

              <span
                className="
                  max-w-[150px]
                  truncate
                  text-xs
                  text-gray-500
                "
              >
                {loading ? "" : user.role || "ไม่ระบุ Role"}
              </span>
            </div>
          )}
        </div>

        {!collapsed && (
          <button
            type="button"
            onClick={onLogout}
            disabled={logoutLoading}
            className="
              shrink-0
              cursor-pointer
              rounded-md
              p-2
              transition
              hover:bg-red-100
              hover:text-red-600
              disabled:opacity-50
            "
            title={logoutLoading ? "กำลังออกจากระบบ..." : "ออกจากระบบ"}
          >
            {logoutLoading ? (
              <div
                className="
                  h-5
                  w-5
                  animate-spin
                  rounded-full
                  border-2
                  border-gray-400
                  border-t-transparent
                "
              />
            ) : (
              <ArrowRightOnRectangleIcon className="h-5 w-5" />
            )}
          </button>
        )}
      </div>
    </div>
  );
}

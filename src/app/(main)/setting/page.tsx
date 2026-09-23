import AppearanceSection from "@/components/setting/AppearanceSection";
import ProfileSection from "@/components/setting/ProfileSection";
import Footer from "@/components/layouts/Footer";

export default function SettingPage() {
  return (
    <div className="flex h-screen overflow-hidden bg-blue-50 font-noto">
      <main className="min-w-0 flex-1 overflow-y-auto p-4 pt-[80px] sm:p-6 sm:pt-[80px] lg:pt-6">
        <div className="flex min-h-full flex-col gap-5 sm:gap-6">
          <header className="rounded-2xl border border-gray-200 bg-white px-5 py-4 sm:px-6 sm:py-5">
            <h1 className="text-[26px] font-semibold text-gray-800">ตั้งค่า</h1>
            <p className="mt-1 text-sm text-gray-500">
              จัดการข้อมูลส่วนตัวและรูปแบบการแสดงผล
            </p>
          </header>

          <ProfileSection />
          <AppearanceSection />
          <div className="mt-aut">
            <Footer />
          </div>
        </div>
      </main>
    </div>
  );
}

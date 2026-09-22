import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-blue-50 px-4 py-12 font-noto">
      <div className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white px-6 py-10 text-center shadow-sm sm:px-10">
        <h1 className="mt-3 text-2xl font-semibold text-gray-900 sm:text-3xl">
          ไม่พบหน้าที่คุณกำลังค้นหา
        </h1>

        <Link
          href="/dashboard"
          className="mt-8 inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[var(--primary)] px-5 text-sm font-medium text-white transition hover:bg-[var(--primary-hover)]"
        >
          กลับไปหน้าแรก
        </Link>
      </div>
    </main>
  );
}

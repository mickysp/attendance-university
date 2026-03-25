"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/layouts/Sidebar";

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const res = await fetch("/api/dashboard");
        const data = await res.json();

        console.log(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />

      <div className="flex-1 p-6 relative font-noto">
        {loading && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-white">
            <div className="flex flex-col items-center gap-4">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-500 border-t-transparent"></div>
              <p className="text-gray-600 text-sm">กำลังโหลด...</p>
            </div>
          </div>
        )}

        <h1 className="text-2xl font-semibold">Dashboard</h1>
      </div>
    </div>
  );
}

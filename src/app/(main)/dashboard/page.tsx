"use client";
import { useLanguage, getLocale } from "@/lib/language";


import {
  BookOpenIcon,
  ChartBarIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ShieldCheckIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";
import { useEffect, useMemo, useState } from "react";
import AttendanceDropdown from "@/components/attendance/Dropdown";
import { dashboardApi } from "@/services/api/dashboard";
import type {
  DashboardOverview,
  DashboardRanking,
  DashboardWeeklyItem,
} from "@/types/dashboard";

export default function DashboardPage() {
  const { tr } = useLanguage();

  const [years, setYears] = useState<number[]>([]);
  const [selectedYear, setSelectedYear] = useState(getCurrentAcademicYear);
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [ranking, setRanking] = useState<DashboardRanking | null>(null);
  const [weekly, setWeekly] = useState<DashboardWeeklyItem[]>([]);
  const [loadingDashboard, setLoadingDashboard] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    async function loadDashboard() {
      setLoadingDashboard(true);
      setError("");
      setOverview(null);
      setRanking(null);
      setWeekly([]);
      try {
        const query = { year: selectedYear };
        const responses = await Promise.all([
          dashboardApi.overview(query, {
            signal: controller.signal,
            cache: "no-store",
          }),
          dashboardApi.ranking(query, {
            signal: controller.signal,
            cache: "no-store",
          }),
          dashboardApi.weekly(query, {
            signal: controller.signal,
            cache: "no-store",
          }),
        ]);
        const [overviewData, rankingData, weeklyData] = await Promise.all(
          responses.map((response) => response.json()),
        );
        const failedIndex = responses.findIndex((response) => !response.ok);
        if (
          failedIndex >= 0 ||
          !overviewData.success ||
          !rankingData.success ||
          !weeklyData.success
        ) {
          throw new Error(
            overviewData.message ||
              rankingData.message ||
              weeklyData.message ||
              "โหลดแดชบอร์ดไม่สำเร็จ",
          );
        }
        if (!controller.signal.aborted) {
          setOverview(overviewData);
          setYears(
            Array.isArray(overviewData.years)
              ? overviewData.years
              : [selectedYear],
          );
          setRanking(rankingData);
          setWeekly(Array.isArray(weeklyData.data) ? weeklyData.data : []);
        }
      } catch (cause) {
        if (!controller.signal.aborted)
          setError(
            cause instanceof Error ? cause.message : "โหลดแดชบอร์ดไม่สำเร็จ",
          );
      } finally {
        if (!controller.signal.aborted) setLoadingDashboard(false);
      }
    }
    void loadDashboard();
    return () => controller.abort();
  }, [selectedYear]);

  const cards = useMemo(
    () => [
      {
        label: "ชั้นเรียนทั้งหมด",
        value: overview?.totalClasses ?? 0,
        suffix: "วิชา",
        icon: BookOpenIcon,
        color: "text-blue-600",
        background: "bg-blue-50",
      },
      {
        label: "นักศึกษาทั้งหมด",
        value: overview?.totalStudents ?? 0,
        suffix: "คน",
        icon: UserGroupIcon,
        color: "text-violet-600",
        background: "bg-violet-50",
      },
      {
        label: "เช็กชื่อทั้งหมด",
        value: overview?.totalRecords ?? 0,
        suffix: "รายการ",
        icon: CheckCircleIcon,
        color: "text-emerald-600",
        background: "bg-emerald-50",
      },
    ],
    [overview],
  );

  return (
    <div className="app-page" aria-busy={loadingDashboard}>
      {loadingDashboard && <PageLoading />}
      <div className="flex min-h-full flex-col gap-5 sm:gap-6">
        <header className="app-page-header">
          <div>
            <h1 className="app-page-title">{tr("แดชบอร์ด")}</h1>
            <p className="app-page-description">{tr("ภาพรวมการเข้าเรียนและนักศึกษาที่ควรติดตาม")}</p>
          </div>
          <div className="w-full sm:w-40">
            <span className="mb-1.5 block text-xs font-medium text-gray-500">{tr("ปีการศึกษา")}</span>
            <AttendanceDropdown
              value={String(selectedYear)}
              options={years.map((year) => ({
                value: String(year),
                label: String(year),
              }))}
              placeholder={tr("เลือกปี")}
              ariaLabel={tr("เลือกปีการศึกษา")}
              allowEmpty={false}
              onChange={(value) => value && setSelectedYear(Number(value))}
            />
          </div>
        </header>

        {error && (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {tr(error)}
          </div>
        )}

        {overview ? (
          <>
            <section
              className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
              aria-label={tr("ข้อมูลสรุป")}
            >
              {cards.map((card) => {
                const Icon = card.icon;
                return (
                  <article
                    key={card.label}
                    className="app-card flex items-center gap-4 p-5"
                  >
                    <span
                      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${card.background} ${card.color}`}
                    >
                      <Icon className="h-6 w-6" />
                    </span>
                    <div>
                      <p className="text-sm text-gray-500">{tr(card.label)}</p>
                      <p className="mt-1 text-2xl font-semibold text-gray-800">
                        {card.value.toLocaleString(getLocale())}{" "}
                        <span className="text-sm font-normal text-gray-400">
                          {tr(card.suffix)}
                        </span>
                      </p>
                    </div>
                  </article>
                );
              })}
              <RiskSummaryCard
                count={overview.riskStudents.length}
                total={overview.totalStudents}
              />
            </section>

            <AttendanceDistribution overview={overview} />

            <div className="grid gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,1fr)]">
              <MonthlyChart data={weekly} />
              <RecentActivity data={overview.recentActivity} />
            </div>

            <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,1fr)]">
              <RiskTable data={overview.riskStudents} />
              <RankingList data={ranking?.ranking.percent.top ?? []} />
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}

function RiskSummaryCard({ count, total }: { count: number; total: number }) {
  const { tr } = useLanguage();

  const rate = total > 0 ? Math.round((count / total) * 100) : 0;
  const hasRisk = count > 0;

  return (
    <article
      className={`relative overflow-hidden rounded-2xl border p-5 ${hasRisk ? "border-amber-200 bg-gradient-to-br from-amber-50 via-white to-orange-50" : "border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-teal-50"}`}
    >
      <div
        className={`absolute -top-8 -right-8 h-28 w-28 rounded-full opacity-50 ${hasRisk ? "bg-amber-100" : "bg-emerald-100"}`}
        aria-hidden="true"
      />
      <div className="relative flex items-start justify-between gap-4">
        <div>
          <span
            className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium ${hasRisk ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}
          >
            {hasRisk ? tr("ควรตรวจสอบ") : tr("สถานะปกติ")}
          </span>
          <p className="mt-3 text-sm font-medium text-gray-600">{tr("นักศึกษาที่ควรติดตาม")}</p>
          <p className="mt-1 text-3xl font-semibold text-gray-900">
            {count.toLocaleString(getLocale())}{" "}
            <span className="text-sm font-normal text-gray-500">{tr("คน")}</span>
          </p>
        </div>
        <span
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${hasRisk ? "bg-amber-100 text-amber-600" : "bg-emerald-100 text-emerald-600"}`}
        >
          {hasRisk ? (
            <ExclamationTriangleIcon className="h-6 w-6" />
          ) : (
            <ShieldCheckIcon className="h-6 w-6" />
          )}
        </span>
      </div>
      <div className="relative mt-4 flex items-center gap-3">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/80">
          <div
            className={`h-full rounded-full ${hasRisk ? "bg-amber-500" : "bg-emerald-500"}`}
            style={{ width: `${Math.min(rate, 100)}%` }}
          />
        </div>
        <span
          className={`text-xs font-semibold ${hasRisk ? "text-amber-700" : "text-emerald-700"}`}
        >
          {rate}%
        </span>
      </div>
    </article>
  );
}

function AttendanceDistribution({ overview }: { overview: DashboardOverview }) {
  const { tr } = useLanguage();

  const items = [
    {
      label: "มาเรียน",
      value: overview.summary.present,
      color: "bg-emerald-500",
      text: "text-emerald-700",
    },
    {
      label: "มาสาย",
      value: overview.summary.late,
      color: "bg-amber-400",
      text: "text-amber-700",
    },
    {
      label: "ลา",
      value: overview.summary.leave,
      color: "bg-sky-400",
      text: "text-sky-700",
    },
  ];

  return (
    <section className="app-card overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-gray-100 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">{tr("สถานะการเข้าเรียนทั้งระบบ")}</h2>
          <p className="mt-1 text-sm text-gray-500">{tr("สัดส่วนจากรายการเช็กชื่อทั้งหมดในปีการศึกษานี้")}</p>
        </div>
        <div className="rounded-xl bg-blue-50 px-4 py-2 text-right">
          <p className="text-xs text-blue-600">{tr("อัตราเข้าเรียนเฉลี่ย")}</p>
          <p className="text-xl font-semibold text-blue-700">
            {overview.average.percent.toFixed(0)}%
          </p>
        </div>
      </div>
      {overview.totalRecords === 0 ? (
        <SmallEmpty text="ยังไม่มีข้อมูลสถานะการเข้าเรียน" />
      ) : (
        <div className="grid gap-4 p-5 sm:grid-cols-3 sm:p-6">
          {items.map((item) => {
            const rate = (item.value / overview.totalRecords) * 100;
            return (
              <div
                key={item.label}
                className="rounded-xl border border-gray-100 bg-gray-50/60 p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <span
                      className={`h-2.5 w-2.5 rounded-full ${item.color}`}
                    />
                    {tr(item.label)}
                  </span>
                  <span className={`text-sm font-semibold ${item.text}`}>
                    {rate.toFixed(0)}%
                  </span>
                </div>
                <p className="mt-3 text-2xl font-semibold text-gray-800">
                  {item.value.toLocaleString(getLocale())}{" "}
                  <span className="text-xs font-normal text-gray-400">{tr("ครั้ง")}</span>
                </p>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-gray-200">
                  <div
                    className={`h-full rounded-full ${item.color}`}
                    style={{ width: `${rate}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

function PageLoading() {
  const { tr } = useLanguage();

  return (
    <div
      className="absolute inset-0 z-10 flex items-center justify-center bg-gray-300"
      role="status"
    >
      <div className="flex flex-col items-center gap-4">
        <div className="h-14 w-14 animate-spin rounded-full border-4 border-white border-t-transparent" />
        <p className="text-base text-white">{tr("กำลังโหลด...")}</p>
      </div>
    </div>
  );
}

function MonthlyChart({ data }: { data: DashboardWeeklyItem[] }) {
  const { tr } = useLanguage();

  const maximum = Math.max(
    1,
    ...data.map((item) => item.present + item.late + item.leave),
  );
  return (
    <section className="app-card overflow-hidden">
      <div className="border-b border-gray-100 px-5 py-5 sm:px-6">
        <h2 className="text-lg font-semibold text-gray-800">{tr("แนวโน้มการเข้าเรียน")}</h2>
        <p className="mt-1 text-sm text-gray-500">{tr("จำนวนการเช็คชื่อแยกตามเดือน")}</p>
      </div>
      {data.length === 0 ? (
        <SmallEmpty text="ยังไม่มีข้อมูลแนวโน้ม" />
      ) : (
        <div className="space-y-5 p-5 sm:p-6">
          {data.map((item) => {
            const total = item.present + item.late + item.leave;
            return (
              <div key={item.week}>
                <div className="mb-2 flex justify-between text-sm">
                  <span className="font-medium text-gray-700">
                    {formatMonth(item.week)}
                  </span>
                  <span className="text-gray-500">
                    {total.toLocaleString(getLocale())}{" "}{tr("รายการ")}</span>
                </div>
                <div className="flex h-3 overflow-hidden rounded-full bg-gray-100">
                  <span
                    className="bg-emerald-500"
                    style={{ width: `${(item.present / maximum) * 100}%` }}
                  />
                  <span
                    className="bg-amber-400"
                    style={{ width: `${(item.late / maximum) * 100}%` }}
                  />
                  <span
                    className="bg-sky-400"
                    style={{ width: `${(item.leave / maximum) * 100}%` }}
                  />
                </div>
              </div>
            );
          })}
          <div className="flex flex-wrap gap-4 border-t border-gray-100 pt-4 text-xs text-gray-500">
            <Legend color="bg-emerald-500" label={tr("มาเรียน")} />
            <Legend color="bg-amber-400" label={tr("มาสาย")} />
            <Legend color="bg-sky-400" label={tr("ลา")} />
          </div>
        </div>
      )}
    </section>
  );
}

function RankingList({
  data,
}: {
  data: DashboardRanking["ranking"]["percent"]["top"];
}) {
  const { tr } = useLanguage();

  return (
    <section className="app-card overflow-hidden">
      <div className="border-b border-gray-100 px-5 py-5 sm:px-6">
        <h2 className="text-lg font-semibold text-gray-800">{tr("เข้าเรียนสม่ำเสมอ")}</h2>
        <p className="mt-1 text-sm text-gray-500">{tr("5 อันดับตามอัตราการเข้าเรียน")}</p>
      </div>
      {data.length === 0 ? (
        <SmallEmpty text="ยังไม่มีข้อมูลอันดับ" />
      ) : (
        <ol className="divide-y divide-gray-100 px-5 sm:px-6">
          {data.map((student, index) => (
            <li
              key={student.studentId}
              className="flex items-center gap-3 py-4"
            >
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${index < 3 ? "bg-blue-50 text-blue-600" : "bg-gray-100 text-gray-500"}`}
              >
                {index + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gray-800">
                  {student.name || tr("ไม่ระบุชื่อ")}
                </p>
                <p className="text-xs text-gray-500">{student.studentId}</p>
              </div>
              <span className="text-sm font-semibold text-emerald-600">
                {student.percent.toFixed(0)}%
              </span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

function RecentActivity({
  data,
}: {
  data: DashboardOverview["recentActivity"];
}) {
  const { tr } = useLanguage();

  return (
    <section className="app-card overflow-hidden">
      <div className="border-b border-gray-100 px-5 py-5 sm:px-6">
        <h2 className="text-lg font-semibold text-gray-800">{tr("การเช็กชื่อล่าสุด")}</h2>
        <p className="mt-1 text-sm text-gray-500">{tr("ความเคลื่อนไหวล่าสุดจากทุกวิชา")}</p>
      </div>
      {data.length === 0 ? (
        <SmallEmpty text="ยังไม่มีกิจกรรมการเช็กชื่อ" />
      ) : (
        <ul className="divide-y divide-gray-100 px-5 sm:px-6">
          {data.map((item, index) => (
            <li
              key={`${item.studentId}-${item.date}-${index}`}
              className="flex items-start gap-3 py-4"
            >
              <span
                className={`mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full ${item.status === "มาเรียน" ? "bg-emerald-500" : item.status === "มาสาย" ? "bg-amber-400" : "bg-sky-400"}`}
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <p className="truncate text-sm font-medium text-gray-800">
                    {item.name}
                  </p>
                  <span className="shrink-0 text-xs text-gray-400">
                    {formatShortDate(item.date)}
                  </span>
                </div>
                <p className="mt-0.5 truncate text-xs text-gray-500">
                  {item.className} · {item.time}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function RiskTable({ data }: { data: DashboardOverview["riskStudents"] }) {
  const { tr } = useLanguage();

  return (
    <section className="overflow-hidden rounded-2xl border border-amber-100 bg-white">
      <div className="flex flex-col gap-3 border-b border-amber-100 bg-gradient-to-r from-amber-50/80 to-white px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
            <ExclamationTriangleIcon className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-lg font-semibold text-gray-800">{tr("นักศึกษาที่ควรติดตาม")}</h2>
            <p className="mt-1 text-sm text-gray-500">{tr("อัตราการเข้าเรียนต่ำกว่า 60% ควรตรวจสอบและให้คำแนะนำ")}</p>
          </div>
        </div>
        <span className="w-fit rounded-full border border-amber-200 bg-white px-3 py-1.5 text-xs font-semibold text-amber-700">
          {data.length.toLocaleString(getLocale())}{" "}{tr("คน")}</span>
      </div>
      {data.length === 0 ? (
        <div className="flex min-h-48 flex-col items-center justify-center p-6 text-center">
          <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <ShieldCheckIcon className="h-6 w-6" />
          </span>
          <p className="text-sm font-medium text-gray-700">{tr("นักศึกษาทุกคนอยู่ในเกณฑ์ปกติ")}</p>
          <p className="mt-1 text-xs text-gray-500">{tr("ยังไม่มีรายชื่อที่ต้องติดตามในปีการศึกษานี้")}</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[620px] text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="px-6 py-3 text-left font-medium">{tr("รหัสนักศึกษา")}</th>
                <th className="px-6 py-3 text-left font-medium">{tr("ชื่อ-นามสกุล")}</th>
                <th className="px-6 py-3 text-center font-medium">{tr("เข้าเรียน")}</th>
                <th className="px-6 py-3 text-center font-medium">{tr("อัตราการเข้าเรียน")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.map((student) => (
                <tr key={student.studentId} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-gray-600">
                    {student.studentId}
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-800">
                    {student.name || "-"}
                  </td>
                  <td className="px-6 py-4 text-center text-gray-600">
                    {student.present}/{student.total}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="mx-auto flex max-w-36 items-center gap-3">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-red-100">
                        <div
                          className="h-full rounded-full bg-red-500"
                          style={{ width: `${Math.max(student.percent, 4)}%` }}
                        />
                      </div>
                      <span className="w-9 text-right text-xs font-semibold text-red-600">
                        {student.percent.toFixed(0)}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function SmallEmpty({ text }: { text: string }) {
  const { tr } = useLanguage();

  return (
    <div className="flex min-h-48 flex-col items-center justify-center p-6 text-center text-gray-400">
      <ChartBarIcon className="mb-3 h-9 w-9" />
      <p className="text-sm">{tr(text)}</p>
    </div>
  );
}
function Legend({ color, label }: { color: string; label: string }) {
  const { tr } = useLanguage();

  return (
    <span className="flex items-center gap-1.5">
      <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
      {tr(label)}
    </span>
  );
}
function formatMonth(value: string) {
  const [year, month] = value.split("-").map(Number);
  return new Intl.DateTimeFormat(getLocale(), {
    month: "short",
    year: "numeric",
  }).format(new Date(year, month - 1, 1));
}

function formatShortDate(value: string) {
  const date = new Date(`${value}T00:00:00+07:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(getLocale(), {
    day: "numeric",
    month: "short",
  }).format(date);
}

function getCurrentAcademicYear() {
  return (
    Number(
      new Intl.DateTimeFormat("en-US", {
        year: "numeric",
        timeZone: "Asia/Bangkok",
      }).format(new Date()),
    ) + 543
  );
}

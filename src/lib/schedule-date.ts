export function getBangkokDateKey(now = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";
  return `${value("year")}-${value("month")}-${value("day")}`;
}

/** DatePicker uses local calendar fields, not UTC timestamps. */
export function formatCalendarDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function parseCalendarDate(value: unknown): Date | null {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return formatCalendarDate(date) === value ? date : null;
}

export function getScheduleDateError(value: unknown, now = new Date()): string | null {
  if (!parseCalendarDate(value)) return "วันที่ไม่ถูกต้อง";
  if ((value as string) < getBangkokDateKey(now)) {
    return "ไม่สามารถตั้งเวลาเช็กชื่อย้อนหลังได้ กรุณาเลือกวันนี้หรือวันในอนาคต";
  }
  return null;
}

export function getScheduleFormDate(value: unknown, now = new Date()) {
  const today = getBangkokDateKey(now);
  const parsed = parseCalendarDate(value);
  const reset = parsed !== null && (value as string) < today;
  return {
    date: parsed && !reset ? parsed : parseCalendarDate(today)!,
    reset,
  };
}

/** Prefer today's session, then the nearest future session, then the latest past one. */
export function selectScheduleForForm(schedules: unknown[], now = new Date()) {
  const valid = schedules.filter((item): item is Record<string, unknown> =>
    typeof item === "object" && item !== null &&
    parseCalendarDate((item as Record<string, unknown>).date) !== null,
  ).sort((a, b) => String(a.date).localeCompare(String(b.date)));
  return valid.find((item) => String(item.date) >= getBangkokDateKey(now)) ?? valid.at(-1);
}

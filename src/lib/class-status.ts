export type ClassStatus = "unused" | "scheduled" | "active" | "ended";

export type ClassSessionStatusSource = {
  date?: string;
  startTime?: string;
  endTime?: string;
  allowCheckIn?: boolean;
  isOpen?: boolean;
};

const getBangkokNow = () => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());

  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";

  return {
    date: `${value("year")}-${value("month")}-${value("day")}`,
    time: `${value("hour")}:${value("minute")}`,
  };
};

export const getClassStatus = (
  session?: ClassSessionStatusSource | null,
): ClassStatus => {
  if (!session?.date || !session.startTime || !session.endTime) {
    return "unused";
  }

  if (session.isOpen === false || session.allowCheckIn === false) {
    return "ended";
  }

  const now = getBangkokNow();

  if (session.date > now.date) return "scheduled";
  if (session.date < now.date) return "ended";
  if (now.time < session.startTime) return "scheduled";
  if (now.time > session.endTime) return "ended";

  return "active";
};

export const getClassStatusForSessions = (
  sessions: ClassSessionStatusSource[],
): ClassStatus => {
  if (sessions.length === 0) return "unused";

  const statuses = sessions.map(getClassStatus);
  if (statuses.includes("active")) return "active";
  if (statuses.includes("scheduled")) return "scheduled";

  return "ended";
};

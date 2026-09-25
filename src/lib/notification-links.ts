type ActivityTarget = {
  [key: string]: unknown;
  category?: unknown;
  action?: unknown;
  target?: unknown;
  targetId?: unknown;
  targetType?: unknown;
  message?: unknown;
};

type ExistingClass = { _id: unknown; className?: unknown };

export function notificationHref(
  log: ActivityTarget,
  classes: ExistingClass[] = [],
) {
  if (log.category === "classes") {
    if (log.action === "delete") return "/classes";

    const batchTarget =
      typeof log.target === "string" && log.target.includes("รายการ");
    if (log.action === "create" && batchTarget) return "/classes";

    // Legacy logs only contain a name. Resolve it only when it is unambiguous.
    const matches = classes.filter((item) =>
      log.targetId
        ? String(item._id) === log.targetId
        : typeof log.target === "string" && item.className === log.target,
    );
    const id = matches.length === 1 ? String(matches[0]._id) : "";
    return /^[a-f\d]{24}$/i.test(id) ? `/classes/form/${id}` : "/classes";
  }
  if (log.category === "accounts") {
    // Older teacher activities share the accounts category with administrators.
    const legacyTeacherActivity =
      !log.targetType &&
      typeof log.message === "string" &&
      /^(เพิ่ม|แก้ไข|ลบ)อาจารย์(?:\s|$)/u.test(log.message.trim());
    return log.targetType === "teachers" || legacyTeacherActivity
      ? "/teachers"
      : "/administrators";
  }
  if (log.category === "students") return "/students";
  return "/attendance";
}

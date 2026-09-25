export const sessionMessages = {
  role_changed: "สิทธิ์การใช้งานของคุณถูกเปลี่ยนแปลง",
  password_changed: "รหัสผ่านของคุณถูกเปลี่ยนแปลง",
  credentials_changed: "ข้อมูลเข้าสู่ระบบของคุณถูกเปลี่ยนแปลง",
  account_deleted: "บัญชีของคุณถูกลบออกจากระบบ",
  account_disabled: "บัญชีของคุณถูกระงับการใช้งาน",
  session_expired: "เซสชันของคุณหมดอายุ กรุณาเข้าสู่ระบบใหม่",
  session_revoked: "เซสชันของคุณถูกยกเลิก กรุณาเข้าสู่ระบบใหม่",
} as const;

export type SessionReason = keyof typeof sessionMessages;

export function isSessionReason(value: unknown): value is SessionReason {
  return typeof value === "string" && Object.hasOwn(sessionMessages, value);
}

type SessionAccount = {
  role?: unknown;
  sessionVersion?: number;
  sessionRevokedReason?: unknown;
  disabled?: boolean;
};

export function sessionInvalidReason(
  payload: { role?: unknown; sessionVersion?: unknown },
  user: SessionAccount | null,
): SessionReason | null {
  if (!user) return "account_deleted";
  if (user.disabled) return "account_disabled";
  if (payload.role !== user.role) return "role_changed";
  // Legacy tokens have version zero, until the first security change.
  if ((payload.sessionVersion ?? 0) !== (user.sessionVersion ?? 0)) {
    return isSessionReason(user.sessionRevokedReason)
      ? user.sessionRevokedReason
      : "session_revoked";
  }
  return null;
}

export type NotificationCategory =
  "accounts" | "classes" | "students" | "attendance";

export type NotificationPreferences = Record<NotificationCategory, boolean>;

export type ActivityNotification = {
  id: string;
  actorId: string;
  actorName: string;
  category: NotificationCategory;
  action: "create" | "update" | "delete";
  message: string;
  target?: string;
  createdAt: string;
  unread: boolean;
  href: string;
};

export type NotificationsResponse = {
  success: true;
  data: ActivityNotification[];
  unreadCount: number;
  settings: NotificationPreferences;
  readThrough: string;
  readCount: number;
  totalCount: number;
  page: number;
  hasMore: boolean;
};

export type NotificationFilter = "all" | "unread" | "read";

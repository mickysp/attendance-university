import type { Teacher } from "@/types/teachers";

export interface CheckInConfigFields {
  prefix: boolean;
  firstname: boolean;
  lastname: boolean;
  studentId: boolean;
  email: boolean;
  section: boolean;
  photo: boolean;
  note: boolean;
  location: boolean;
}

export interface CheckInConfigDocument {
  type: "global_config" | "class_config";
  classId?: string;
  config: CheckInConfigFields;
  updatedAt: Date;
}

export interface UpdateCheckInConfigBody {
  classId: string;
  config: CheckInConfigFields;
}

export interface CheckInFormData {
  prefix?: string;
  firstname?: string;
  lastname?: string;
  studentId?: string;
  section?: string;
  email?: string;
  note?: string;
  photo?: string;
  location?: {
    lat: number;
    lng: number;
  };
}

export interface CheckInClassInfo {
  className: string;
  classCodes: string[];
  teachers?: Teacher[];
  description?: string;
  teacher?: string;
}

export const defaultCheckInConfig: CheckInConfigFields = {
  prefix: true,
  firstname: true,
  lastname: true,
  studentId: true,
  email: true,
  section: true,
  photo: true,
  note: true,
  location: true,
};

import type { ObjectId } from "mongodb";
import type { ClassStatus } from "@/lib/class-status";
import type { Teacher } from "@/types/teachers";

export type { Teacher } from "@/types/teachers";

export interface ClassFormValue {
  className: string;
  classCodes: string[];
  teachers: Teacher[];
  description: string;
}

export type ClassApiData = Partial<ClassFormValue>;
export interface IncomingClass {
  className: string;
  classCodes: string[];
  teachers: Teacher[];
  description?: string;
}
export interface ClassDocument {
  className: string;
  classCodes: string[];
  teachers: Teacher[];
  description?: string;
  createdAt: Date;
  updatedAt?: Date;
}
export interface MongoClassDocument {
  _id: ObjectId;
  className: string;
  classCodes: string[];
  teachers: Teacher[];
  description?: string;
  createdAt: Date;
  updatedAt?: Date;
}
export interface ClassResponse {
  _id: string;
  className: string;
  classCodes: string[];
  teachers: Teacher[];
  description?: string;
  studentCount: number;
  isOpened: boolean;
  status: ClassStatus;
  createdAt?: Date;
  updatedAt?: Date;
}

export type ClassDetails = Pick<
  ClassResponse,
  "_id" | "className" | "classCodes" | "teachers" | "description" | "isOpened"
>;

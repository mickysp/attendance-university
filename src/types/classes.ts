import type { ObjectId } from "mongodb";
import type { ClassStatus } from "@/lib/class-status";

export interface Teacher {
  _id: string;
  name: string;
}
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

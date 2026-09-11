import type { ObjectId } from "mongodb";
export interface IncomingStudent {
  studentId?: string;
  fullName?: string;
  email?: string;
}
export interface UploadStudentsBody {
  offeringId?: string;
  students?: IncomingStudent[];
}
export interface StudentDocument {
  _id?: ObjectId;
  studentId: string;
  fullName: string;
  email?: string;
  createdAt: Date;
  updatedAt?: Date;
}
export interface StudentAcademicDocument {
  _id?: ObjectId;
  studentId: ObjectId | string;
  academicYear: number;
  majorId: ObjectId | string;
  createdAt?: Date;
  updatedAt?: Date;
}
export interface StudentClassDocument {
  _id?: ObjectId;
  studentId: ObjectId | string;
  classId: ObjectId | string;
  offeringId: ObjectId | string;
  createdAt?: Date;
  updatedAt?: Date;
}
export interface StudentResultItem {
  studentId: string;
  fullName: string;
  email?: string;
  status: "created" | "duplicate";
  relation: "added" | "exists";
}
export interface StudentErrorItem {
  student?: IncomingStudent;
  message: string;
}
export interface StudentClassUpdate {
  offeringId: string;
}
export interface UpdateStudentBody {
  _id: string;

  studentId: string;
  fullName: string;
  email?: string;
}

export type ExcelRow = Record<
  string,
  string | number | undefined
>;
export interface StudentImportErrorItem {
  student?: IncomingStudent;
  message: string;
}
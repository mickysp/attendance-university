import type { ObjectId } from "mongodb";
export interface IncomingStudent {
  studentId?: string;
  fullName?: string;
  email?: string;
  section?: string;
}
export interface UploadStudentsBody {
  offeringId?: string;
  classId?: string;
  section?: string;
  major?: string;
  students?: IncomingStudent[];
}
export interface StudentDocument {
  _id?: ObjectId;
  studentId: string;
  fullName: string;
  email?: string;
  section?: string;
  major?: string;
  academicYear?: number;
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
  offeringId?: ObjectId | string;
  className?: string;
  section?: string;
  academicYear?: number;
  createdAt?: Date;
  updatedAt?: Date;
}
export interface StudentResultItem {
  studentId: string;
  fullName: string;
  email?: string;
  section?: string;
  major?: string;
  className?: string;
  status: "created" | "duplicate";
  relation: "added" | "exists";
}
export interface MajorDocument {
  _id?: ObjectId;
  name: string;
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
  classes?: {
    className: string;
    section: string;
    academicYear: number;
  }[];
}

export type ExcelRow = Record<string, string | number | undefined>;
export interface StudentImportErrorItem {
  student?: IncomingStudent;
  message: string;
}

/** Payloads used by the current student API routes. */
export interface UploadStudentsRequest {
  classId: string;
  major: string;
  section?: string;
  students: IncomingStudent[];
}

export interface UpdateStudentRequest extends UpdateStudentBody {
  section?: string;
  classes?: {
    className: string;
    section: string;
    academicYear: number;
  }[];
}

export interface WithdrawCourseRequest {
  studentId: string;
  className: string;
  section: string;
}

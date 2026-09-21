import type { ObjectId } from "mongodb";

export interface Teacher {
  _id: string;
  name: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface TeacherDocument {
  _id?: ObjectId;
  name: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface CreateTeacherBody {
  name: string;
}

export interface TeacherResponse {
  success: boolean;
  message?: string;
  data?: TeacherDocument[];
}

import { ObjectId, type Db } from "mongodb";
import type { TeacherDocument } from "@/types/teachers";

/** Resolve current names by ID, keeping saved names for deleted teachers. */
export async function getTeacherNames(db: Db, ids: string[]) {
  const objectIds = [...new Set(ids)]
    .filter((id) => /^[a-f\d]{24}$/i.test(id))
    .map((id) => new ObjectId(id));

  if (!objectIds.length) return new Map<string, string>();

  const teachers = await db.collection<TeacherDocument>("teachers")
    .find({ _id: { $in: objectIds } })
    .project<{ _id: ObjectId; name: string }>({ _id: 1, name: 1 })
    .toArray();

  return new Map(teachers.map((teacher) => [String(teacher._id), teacher.name]));
}

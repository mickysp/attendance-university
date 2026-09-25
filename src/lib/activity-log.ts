import type { Document } from "mongodb";
import clientPromise from "@/lib/mongodb";
import type { NotificationCategory } from "@/types/notifications";

type ActivityInput = {
  actor: Document;
  category: NotificationCategory;
  action: "create" | "update" | "delete";
  message: string;
  target?: string;
  targetId?: string;
};

export async function recordActivity(input: ActivityInput) {
  try {
    const db = (await clientPromise).db("attendance");
    const logs = db.collection("activity_logs");
    await logs.createIndex({ createdAt: -1 });
    await logs.insertOne({
      actorId: input.actor._id,
      actorName:
        typeof input.actor.fullname === "string"
          ? input.actor.fullname
          : typeof input.actor.username === "string"
            ? input.actor.username
            : "ผู้ดูแลระบบ",
      category: input.category,
      action: input.action,
      message: input.message,
      ...(input.target ? { target: input.target } : {}),
      ...(input.targetId ? { targetId: input.targetId } : {}),
      createdAt: new Date(),
    });
  } catch (error) {
    console.error("Unable to record activity", error);
  }
}

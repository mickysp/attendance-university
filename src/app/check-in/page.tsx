import { redirect } from "next/navigation";
import CheckInContent from "./CheckInStudent";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ classId?: string | string[] }>;
}) {
  const { classId } = await searchParams;
  const id = Array.isArray(classId) ? classId[0] : classId;

  if (id) redirect(`/checkin/${encodeURIComponent(id)}`);

  return <CheckInContent classId={null} />;
}

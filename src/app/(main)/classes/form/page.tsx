import { redirect } from "next/navigation";
import QRContent from "./formContent";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ classId?: string | string[] }>;
}) {
  const { classId } = await searchParams;
  const id = Array.isArray(classId) ? classId[0] : classId;

  if (id) {
    redirect(`/classes/form/${encodeURIComponent(id)}`);
  }

  return <QRContent classId={null} />;
}

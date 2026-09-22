import CheckInContent from "@/app/check-in/CheckInStudent";

export default async function Page({
  params,
}: {
  params: Promise<{ classId: string }>;
}) {
  const { classId } = await params;
  return <CheckInContent classId={classId} />;
}

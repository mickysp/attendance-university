import TeacherForm from "@/components/teachers/Form";

export default async function UpdateTeacherPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <TeacherForm id={id} />;
}

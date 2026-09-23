import {
  AcademicCapIcon,
  BookOpenIcon,
  MagnifyingGlassIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";

type EmptyStateIconProps = {
  kind?: "search" | "classes" | "students" | "teachers";
};

const icons = {
  search: MagnifyingGlassIcon,
  classes: BookOpenIcon,
  students: UserGroupIcon,
  teachers: AcademicCapIcon,
};

export default function EmptyStateIcon({
  kind = "search",
}: EmptyStateIconProps) {
  const Icon = icons[kind];

  return (
    <div className="mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-blue-50 text-blue-600 sm:h-28 sm:w-28">
      <Icon className="h-12 w-12 sm:h-14 sm:w-14" aria-hidden="true" />
    </div>
  );
}

import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function SchoolList({ schools }: { schools: Array<{ id: number; name: string }> }) {
  return (
    <ul className="space-y-2">
      {schools?.map((school) => (
        <li
          key={school.id}
          className="flex items-center justify-between border-b border-border py-2"
        >
          <Link href={`/dashboard?school=${school.id}`} className="hover:underline">
            {school.name}
          </Link>
          <Link
            href={`/schools/${school.id}/edit`}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            Edit
          </Link>
        </li>
      ))}
    </ul>
  );
}
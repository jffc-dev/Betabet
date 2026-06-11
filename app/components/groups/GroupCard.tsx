import Link from "next/link";
import { ListChecks, Users } from "lucide-react";
import type { GroupSummary } from "../../lib/data/groups";

export function GroupCard({ group }: { group: GroupSummary }) {
  return (
    <Link
      href={`/groups/${group.slug}`}
      className="block rounded-3xl border border-neutral-800 bg-neutral-900 p-4 shadow-lg transition-colors hover:border-neutral-700 active:bg-neutral-800/60"
    >
      <h3 className="text-base font-semibold text-neutral-100">{group.name}</h3>
      {group.description ? (
        <p className="mt-1 line-clamp-2 text-sm text-neutral-400">{group.description}</p>
      ) : null}
      <div className="mt-3 flex items-center gap-4 text-xs text-neutral-500">
        <span className="inline-flex items-center gap-1.5">
          <Users className="size-3.5" />
          {group._count.members} miembros
        </span>
        <span className="inline-flex items-center gap-1.5">
          <ListChecks className="size-3.5" />
          {group._count.rounds} rondas
        </span>
      </div>
    </Link>
  );
}

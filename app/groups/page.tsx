import Link from "next/link";
import { Plus, Users2 } from "lucide-react";
import type { Metadata } from "next";
import { listGroupSummaries } from "../lib/data/groups";
import { GroupCard } from "../components/groups/GroupCard";
import { Button } from "../components/ui/button";

export const metadata: Metadata = { title: "Grupos · BetaBet" };

export default async function GroupsPage() {
  const groups = await listGroupSummaries();

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-4 py-6">
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-neutral-100">Grupos</h1>
        <Button asChild size="sm">
          <Link href="/groups/new">
            <Plus className="size-4" />
            Crear
          </Link>
        </Button>
      </div>

      {groups.length === 0 ? (
        <div className="mt-12 flex flex-col items-center gap-3 text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-neutral-900 text-neutral-500">
            <Users2 className="size-7" />
          </div>
          <p className="text-sm text-neutral-400">
            Todavía no tienes grupos.
            <br />
            Crea uno para empezar a competir.
          </p>
          <Button asChild className="mt-2">
            <Link href="/groups/new">
              <Plus className="size-4" />
              Crear grupo
            </Link>
          </Button>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {groups.map((group) => (
            <li key={group.id}>
              <GroupCard group={group} />
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

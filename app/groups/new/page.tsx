import type { Metadata } from "next";
import { GroupForm } from "../../components/groups/GroupForm";
import { BackLink } from "../../components/BackLink";
import { createGroupAction } from "../../lib/actions/groups";

export const metadata: Metadata = { title: "Nuevo grupo · BetaBet" };

export default function NewGroupPage() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-4 py-6">
      <BackLink href="/groups" label="Grupos" />
      <h1 className="mb-1 text-2xl font-bold tracking-tight text-neutral-100">Nuevo grupo</h1>
      <p className="mb-6 text-sm text-neutral-400">
        Crea un grupo para competir con tus amigos.
      </p>
      <GroupForm action={createGroupAction} submitLabel="Crear grupo" />
    </main>
  );
}

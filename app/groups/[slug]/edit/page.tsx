import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getGroupBySlug } from "../../../lib/data/groups";
import { updateGroupAction } from "../../../lib/actions/groups";
import { GroupForm } from "../../../components/groups/GroupForm";
import { BackLink } from "../../../components/BackLink";

export const metadata: Metadata = { title: "Editar grupo · BetaBet" };

export default async function EditGroupPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const group = await getGroupBySlug(slug);
  if (!group) notFound();

  const action = updateGroupAction.bind(null, { id: group.id, slug: group.slug });

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-4 py-6">
      <BackLink href={`/groups/${group.slug}`} label={group.name} />
      <h1 className="mb-6 text-2xl font-bold tracking-tight text-neutral-100">Editar grupo</h1>
      <GroupForm
        action={action}
        submitLabel="Guardar cambios"
        defaultValues={{
          name: group.name,
          description: group.description,
          defaultMatchPoints: group.defaultMatchPoints,
        }}
      />
    </main>
  );
}

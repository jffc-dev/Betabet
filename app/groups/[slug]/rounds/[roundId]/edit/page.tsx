import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getRoundForEdit } from "../../../../../lib/data/rounds";
import { updateRoundAction } from "../../../../../lib/actions/rounds";
import { RoundForm } from "../../../../../components/rounds/RoundForm";
import { BackLink } from "../../../../../components/BackLink";

export const metadata: Metadata = { title: "Editar ronda · BetaBet" };

export default async function EditRoundPage({
  params,
}: {
  params: Promise<{ slug: string; roundId: string }>;
}) {
  const { slug, roundId } = await params;
  const round = await getRoundForEdit(roundId);
  if (!round || round.group.slug !== slug) notFound();

  const action = updateRoundAction.bind(null, { id: round.id, slug });

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-4 py-6">
      <BackLink href={`/groups/${slug}/rounds/${round.id}`} label={round.title} />
      <h1 className="mb-6 text-2xl font-bold tracking-tight text-neutral-100">Editar ronda</h1>
      <RoundForm
        action={action}
        submitLabel="Guardar cambios"
        defaultValues={{ title: round.title, scoringMode: round.scoringMode }}
      />
    </main>
  );
}

import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getRoundForResults } from "../../../../lib/data/rounds";
import { saveMatchResultAction } from "../../../../lib/actions/results";
import { RoundResultsForm } from "../../../../components/rounds/RoundResultsForm";
import { BackLink } from "../../../../components/BackLink";
import { Button } from "../../../../components/ui/button";

export const metadata: Metadata = { title: "Resultados · BetaBet" };

export default async function RoundResultsPage({
  params,
}: {
  params: Promise<{ slug: string; roundId: string }>;
}) {
  const { slug, roundId } = await params;
  const round = await getRoundForResults(roundId);
  if (!round || round.group.slug !== slug) notFound();

  const members = round.group.members;
  const matches = round.roundMatches.map((rm) => {
    const predicted = new Set(rm.predictions.map((p) => p.memberId));
    return {
      matchId: rm.match.id,
      kickoff: rm.match.kickoff.toISOString(),
      home: { name: rm.match.homeTeam.name, crest: rm.match.homeTeam.crestUrl },
      away: { name: rm.match.awayTeam.name, crest: rm.match.awayTeam.crestUrl },
      homeScore: rm.match.homeScore,
      awayScore: rm.match.awayScore,
      hasResult: rm.match.homeScore !== null && rm.match.awayScore !== null,
      // Group members with no prediction for this match (warned about, non-blocking).
      missingBettors: members.filter((m) => !predicted.has(m.id)).map((m) => m.name),
    };
  });

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-4 py-6">
      <BackLink href={`/groups/${slug}`} label={round.group.name} />
      <div className="flex items-start justify-between gap-2">
        <h1 className="min-w-0 text-2xl font-bold tracking-tight text-neutral-100">{round.title}</h1>
        <Button asChild variant="outline" size="sm" className="shrink-0">
          <Link href={`/groups/${slug}/leaderboard?round=${round.id}`}>Clasificación</Link>
        </Button>
      </div>
      <p className="mb-5 mt-1 text-sm text-neutral-400">
        Anota el marcador final de cada partido.
      </p>

      {matches.length === 0 ? (
        <p className="text-sm text-neutral-500">Esta ronda no tiene partidos.</p>
      ) : (
        <RoundResultsForm
          action={saveMatchResultAction.bind(null, { roundId: round.id, slug })}
          matches={matches}
        />
      )}
    </main>
  );
}

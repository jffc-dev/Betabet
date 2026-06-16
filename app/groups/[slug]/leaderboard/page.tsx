import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "../../../lib/prisma";
import {
  getGroupLeaderboard,
  getRoundLeaderboard,
  listGroupRounds,
  type LeaderboardRow,
} from "../../../lib/data/leaderboard";
import { getSessionMember } from "../../../lib/session";
import { LeaderboardTable } from "../../../components/leaderboard/LeaderboardTable";
import { RoundSelect } from "../../../components/leaderboard/RoundSelect";
import { BackLink } from "../../../components/BackLink";

export const metadata: Metadata = { title: "Clasificación · BetaBet" };

export default async function LeaderboardPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ round?: string }>;
}) {
  const { slug } = await params;
  const { round: roundParam } = await searchParams;

  const group = await prisma.group.findUnique({
    where: { slug },
    select: { id: true, name: true, slug: true },
  });
  if (!group) notFound();

  const [rounds, member] = await Promise.all([listGroupRounds(group.id), getSessionMember()]);
  const selectedRound = roundParam && rounds.some((r) => r.id === roundParam) ? roundParam : null;
  const highlightMemberId = member && member.groupId === group.id ? member.id : null;

  let rows: LeaderboardRow[] = [];
  let scopeLabel = "General";
  if (selectedRound) {
    const result = await getRoundLeaderboard(selectedRound);
    rows = result?.rows ?? [];
    scopeLabel = result?.round.title ?? "Ronda";
  } else {
    rows = await getGroupLeaderboard(group.id);
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-4 py-6">
      <BackLink href={`/groups/${group.slug}`} label={group.name} />
      <h1 className="text-2xl font-bold tracking-tight text-neutral-100">Clasificación</h1>
      <p className="mb-4 mt-1 text-sm text-neutral-400">{scopeLabel}</p>

      {rounds.length > 0 ? (
        <div className="mb-4">
          <RoundSelect slug={group.slug} rounds={rounds} current={selectedRound} />
        </div>
      ) : null}

      <LeaderboardTable rows={rows} highlightMemberId={highlightMemberId} />
    </main>
  );
}

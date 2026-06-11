import { cache } from "react";
import { prisma } from "../prisma";

// All predictable matches for a group (its round-matches), ordered by kickoff,
// merged with the member's existing predictions. A match is "locked" once it
// kicks off or is no longer scheduled.
export const getPlayBoard = cache(async (memberId: string, groupId: string) => {
  const [roundMatches, predictions] = await Promise.all([
    prisma.roundMatch.findMany({
      where: { round: { groupId } },
      orderBy: { match: { kickoff: "asc" } },
      select: {
        id: true,
        match: {
          select: {
            kickoff: true,
            competition: true,
            status: true,
            homeTeam: { select: { name: true, shortName: true, crestUrl: true } },
            awayTeam: { select: { name: true, shortName: true, crestUrl: true } },
          },
        },
      },
    }),
    prisma.prediction.findMany({
      where: { memberId, roundMatch: { round: { groupId } } },
      select: { roundMatchId: true, outcome: true },
    }),
  ]);

  const pickByRoundMatch = new Map(predictions.map((p) => [p.roundMatchId, p.outcome]));
  const now = Date.now();

  return roundMatches.map((rm) => ({
    roundMatchId: rm.id,
    kickoff: rm.match.kickoff.toISOString(),
    competition: rm.match.competition,
    home: {
      name: rm.match.homeTeam.name,
      short: rm.match.homeTeam.shortName,
      crest: rm.match.homeTeam.crestUrl,
    },
    away: {
      name: rm.match.awayTeam.name,
      short: rm.match.awayTeam.shortName,
      crest: rm.match.awayTeam.crestUrl,
    },
    locked: rm.match.kickoff.getTime() <= now || rm.match.status !== "SCHEDULED",
    pick: pickByRoundMatch.get(rm.id) ?? null,
  }));
});

export type PlayItem = Awaited<ReturnType<typeof getPlayBoard>>[number];

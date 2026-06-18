import { cache } from "react";
import { prisma } from "../prisma";

/** Minimal round shape for the edit form (title + scoring config). */
export const getRoundForEdit = cache(async (roundId: string) => {
  return prisma.round.findUnique({
    where: { id: roundId },
    select: {
      id: true,
      title: true,
      scoringMode: true,
      group: { select: { slug: true, name: true } },
    },
  });
});

/** A round with its matches + teams + current scores, for the result-entry page. */
export const getRoundForResults = cache(async (roundId: string) => {
  return prisma.round.findUnique({
    where: { id: roundId },
    select: {
      id: true,
      title: true,
      status: true,
      groupId: true,
      group: {
        select: {
          slug: true,
          name: true,
          members: { select: { id: true, name: true }, orderBy: { name: "asc" } },
        },
      },
      roundMatches: {
        orderBy: { match: { kickoff: "asc" } },
        select: {
          id: true,
          points: true,
          predictions: { select: { memberId: true } },
          match: {
            select: {
              id: true,
              kickoff: true,
              status: true,
              homeScore: true,
              awayScore: true,
              result: true,
              homeTeam: { select: { name: true, shortName: true, crestUrl: true } },
              awayTeam: { select: { name: true, shortName: true, crestUrl: true } },
            },
          },
        },
      },
    },
  });
});

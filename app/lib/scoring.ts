import type { PrismaClient } from "../generated/prisma/client";

// 1X2 outcome values, matching the Prisma `Outcome` enum string values.
export type OutcomeValue = "HOME" | "DRAW" | "AWAY";

/** Derive the 1X2 result of a finished match from its final score. */
export function deriveOutcome(homeScore: number, awayScore: number): OutcomeValue {
  if (homeScore > awayScore) return "HOME";
  if (homeScore < awayScore) return "AWAY";
  return "DRAW";
}

/**
 * Score a single prediction. v1 awards the match's points for a correct 1X2
 * pick. An exact-score bonus can be layered on here later (the predicted and
 * actual scores are both stored) without any schema change.
 */
export function scorePrediction(
  predicted: OutcomeValue,
  actual: OutcomeValue,
  matchPoints: number,
): { isCorrect: boolean; pointsAwarded: number } {
  const isCorrect = predicted === actual;
  return { isCorrect, pointsAwarded: isCorrect ? matchPoints : 0 };
}

export interface LeaderboardEntry {
  memberId: string;
  memberName: string;
  points: number;
  correct: number;
  total: number;
  rank: number;
}

/** Aggregate settled predictions into a ranked, standalone-round leaderboard. */
export function buildLeaderboard(
  rows: Array<{ memberId: string; memberName: string; pointsAwarded: number | null; isCorrect: boolean | null }>,
): LeaderboardEntry[] {
  const byMember = new Map<string, LeaderboardEntry>();

  for (const row of rows) {
    const entry =
      byMember.get(row.memberId) ??
      { memberId: row.memberId, memberName: row.memberName, points: 0, correct: 0, total: 0, rank: 0 };
    entry.points += row.pointsAwarded ?? 0;
    entry.correct += row.isCorrect ? 1 : 0;
    entry.total += 1;
    byMember.set(row.memberId, entry);
  }

  const sorted = [...byMember.values()].sort(
    (a, b) => b.points - a.points || b.correct - a.correct || a.memberName.localeCompare(b.memberName),
  );
  sorted.forEach((entry, i) => {
    entry.rank = i + 1;
  });
  return sorted;
}

/**
 * Settle a round: derive each finished match's result, award points to every
 * prediction, mark the round SETTLED, and return the ranked leaderboard.
 * Reusable from server actions and the seed. Runs in one transaction.
 */
export async function settleRound(client: PrismaClient, roundId: string): Promise<LeaderboardEntry[]> {
  const round = await client.round.findUniqueOrThrow({
    where: { id: roundId },
    include: {
      roundMatches: {
        include: {
          match: true,
          predictions: { include: { member: { select: { id: true, name: true } } } },
        },
      },
    },
  });

  const leaderboardRows: Array<{
    memberId: string;
    memberName: string;
    pointsAwarded: number | null;
    isCorrect: boolean | null;
  }> = [];

  await client.$transaction(async (tx) => {
    for (const rm of round.roundMatches) {
      const { match } = rm;
      if (match.homeScore == null || match.awayScore == null) {
        throw new Error(`Cannot settle round: match ${match.id} has no final score.`);
      }

      const result = deriveOutcome(match.homeScore, match.awayScore);
      if (match.result !== result || match.status !== "FINISHED") {
        await tx.match.update({
          where: { id: match.id },
          data: { result, status: "FINISHED" },
        });
      }

      for (const prediction of rm.predictions) {
        const { isCorrect, pointsAwarded } = scorePrediction(
          prediction.outcome as OutcomeValue,
          result,
          rm.points,
        );
        await tx.prediction.update({
          where: { id: prediction.id },
          data: { isCorrect, pointsAwarded },
        });
        leaderboardRows.push({
          memberId: prediction.member.id,
          memberName: prediction.member.name,
          pointsAwarded,
          isCorrect,
        });
      }
    }

    await tx.round.update({ where: { id: roundId }, data: { status: "SETTLED" } });
  });

  return buildLeaderboard(leaderboardRows);
}

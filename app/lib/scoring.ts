import type { PrismaClient } from "../generated/prisma/client";

// 1X2 outcome values, matching the Prisma `Outcome` enum string values.
export type OutcomeValue = "HOME" | "DRAW" | "AWAY";

// Scoring strategy values, matching the Prisma `ScoringMode` enum string values.
export type ScoringModeValue = "FLAT" | "UNIQUE_BONUS";

/** Per-match scoring config, resolved from the round + round-match columns. */
export interface RoundMatchScoring {
  mode: ScoringModeValue;
  points: number; // shared/correct award
  uniqueHitPoints: number; // award for a lone correct pick (UNIQUE_BONUS only)
}

/** Outcome of scoring one prediction. */
export interface PredictionScore {
  memberId: string;
  isCorrect: boolean;
  pointsAwarded: number;
}

/** Derive the 1X2 result of a finished match from its final score. */
export function deriveOutcome(homeScore: number, awayScore: number): OutcomeValue {
  if (homeScore > awayScore) return "HOME";
  if (homeScore < awayScore) return "AWAY";
  return "DRAW";
}

/**
 * Score every prediction for one match within one round. The "lone hit" count
 * is scoped to the predictions passed in — these must be exactly one round's
 * predictions for one match (the `@@unique([roundMatchId, memberId])` set).
 *
 * UNIQUE_BONUS: a single correct member earns `uniqueHitPoints`; two or more
 * correct members each earn the shared `points`. FLAT always awards `points`
 * per correct pick.
 */
export function scoreRoundMatch(
  actual: OutcomeValue,
  predictions: Array<{ memberId: string; outcome: OutcomeValue }>,
  scoring: RoundMatchScoring,
): PredictionScore[] {
  const correctCount = predictions.reduce((n, p) => n + (p.outcome === actual ? 1 : 0), 0);
  const award =
    scoring.mode === "UNIQUE_BONUS" && correctCount === 1
      ? scoring.uniqueHitPoints
      : scoring.points;

  return predictions.map((p) => {
    const isCorrect = p.outcome === actual;
    return { memberId: p.memberId, isCorrect, pointsAwarded: isCorrect ? award : 0 };
  });
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

      const scores = scoreRoundMatch(
        result,
        rm.predictions.map((p) => ({ memberId: p.memberId, outcome: p.outcome as OutcomeValue })),
        {
          mode: round.scoringMode as ScoringModeValue,
          points: rm.points,
          uniqueHitPoints: rm.uniqueHitPoints,
        },
      );
      const scoreByMember = new Map(scores.map((s) => [s.memberId, s]));

      for (const prediction of rm.predictions) {
        const score = scoreByMember.get(prediction.memberId)!;
        await tx.prediction.update({
          where: { id: prediction.id },
          data: { isCorrect: score.isCorrect, pointsAwarded: score.pointsAwarded },
        });
        leaderboardRows.push({
          memberId: prediction.member.id,
          memberName: prediction.member.name,
          pointsAwarded: score.pointsAwarded,
          isCorrect: score.isCorrect,
        });
      }
    }

    await tx.round.update({ where: { id: roundId }, data: { status: "SETTLED" } });
  });

  return buildLeaderboard(leaderboardRows);
}

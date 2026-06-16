import { cache } from "react";
import { prisma } from "../prisma";
import { deriveOutcome, scoreRoundMatch, type OutcomeValue, type ScoringModeValue } from "../scoring";

export interface LeaderboardRow {
  memberId: string;
  name: string;
  points: number;
  correct: number;
  played: number; // predicted matches that already have a result
  rank: number;
}

interface ScoredPrediction {
  roundMatchId: string;
  memberId: string;
  outcome: OutcomeValue;
  pointsAwarded: number | null;
  isCorrect: boolean | null;
  scoringMode: ScoringModeValue;
  matchPoints: number; // shared/correct award
  uniqueHitPoints: number;
  homeScore: number | null;
  awayScore: number | null;
  result: OutcomeValue | null;
}

/**
 * Rank members by points. Predictions are grouped per round-match so the
 * unique-hit bonus can see how many members got each match right. A match
 * counts once it has a final score: trust the persisted `pointsAwarded` when a
 * round was settled, otherwise compute live. Ties share a rank (competition
 * ranking: 1, 2, 2, 4).
 */
export function computeLeaderboard(
  members: Array<{ id: string; name: string }>,
  predictions: ScoredPrediction[],
): LeaderboardRow[] {
  const rows = new Map<string, LeaderboardRow>();
  for (const m of members) {
    rows.set(m.id, { memberId: m.id, name: m.name, points: 0, correct: 0, played: 0, rank: 0 });
  }

  // Group by round-match: the bonus depends on the full set of picks per match.
  const byMatch = new Map<string, ScoredPrediction[]>();
  for (const p of predictions) {
    const group = byMatch.get(p.roundMatchId);
    if (group) group.push(p);
    else byMatch.set(p.roundMatchId, [p]);
  }

  for (const group of byMatch.values()) {
    const sample = group[0];
    if (sample.homeScore == null || sample.awayScore == null) continue; // no result yet
    const actual = sample.result ?? deriveOutcome(sample.homeScore, sample.awayScore);

    // A settled round persists per-prediction points (bonus already applied);
    // trust them. Otherwise score the whole match live so the bonus can count
    // correct picks across members.
    const settled = group.some((p) => p.pointsAwarded != null);
    const scoreByMember = new Map<string, { points: number; correct: boolean }>();
    if (settled) {
      for (const p of group) {
        scoreByMember.set(p.memberId, { points: p.pointsAwarded ?? 0, correct: p.isCorrect ?? false });
      }
    } else {
      const scores = scoreRoundMatch(actual, group, {
        mode: sample.scoringMode,
        points: sample.matchPoints,
        uniqueHitPoints: sample.uniqueHitPoints,
      });
      for (const s of scores) {
        scoreByMember.set(s.memberId, { points: s.pointsAwarded, correct: s.isCorrect });
      }
    }

    for (const p of group) {
      const row = rows.get(p.memberId);
      const score = scoreByMember.get(p.memberId);
      if (!row || !score) continue;
      row.points += score.points;
      row.correct += score.correct ? 1 : 0;
      row.played += 1;
    }
  }

  const sorted = [...rows.values()].sort(
    (a, b) => b.points - a.points || b.correct - a.correct || a.name.localeCompare(b.name),
  );
  let rank = 0;
  let prevKey: string | null = null;
  sorted.forEach((row, i) => {
    const key = `${row.points}|${row.correct}`;
    if (key !== prevKey) {
      rank = i + 1;
      prevKey = key;
    }
    row.rank = rank;
  });
  return sorted;
}

const predictionSelect = {
  memberId: true,
  roundMatchId: true,
  outcome: true,
  pointsAwarded: true,
  isCorrect: true,
  roundMatch: {
    select: {
      points: true,
      uniqueHitPoints: true,
      round: { select: { scoringMode: true } },
      match: { select: { homeScore: true, awayScore: true, result: true } },
    },
  },
} as const;

type RawPrediction = {
  memberId: string;
  roundMatchId: string;
  outcome: OutcomeValue;
  pointsAwarded: number | null;
  isCorrect: boolean | null;
  roundMatch: {
    points: number;
    uniqueHitPoints: number;
    round: { scoringMode: ScoringModeValue };
    match: { homeScore: number | null; awayScore: number | null; result: OutcomeValue | null };
  };
};

function toScored(p: RawPrediction): ScoredPrediction {
  return {
    memberId: p.memberId,
    roundMatchId: p.roundMatchId,
    outcome: p.outcome,
    pointsAwarded: p.pointsAwarded,
    isCorrect: p.isCorrect,
    scoringMode: p.roundMatch.round.scoringMode,
    matchPoints: p.roundMatch.points,
    uniqueHitPoints: p.roundMatch.uniqueHitPoints,
    homeScore: p.roundMatch.match.homeScore,
    awayScore: p.roundMatch.match.awayScore,
    result: p.roundMatch.match.result,
  };
}

export const getGroupLeaderboard = cache(async (groupId: string): Promise<LeaderboardRow[]> => {
  const [members, predictions] = await Promise.all([
    prisma.member.findMany({ where: { groupId }, select: { id: true, name: true } }),
    prisma.prediction.findMany({
      where: { roundMatch: { round: { groupId } } },
      select: predictionSelect,
    }),
  ]);
  return computeLeaderboard(members, (predictions as RawPrediction[]).map(toScored));
});

export const getRoundLeaderboard = cache(async (roundId: string) => {
  const round = await prisma.round.findUnique({
    where: { id: roundId },
    select: { id: true, title: true, groupId: true },
  });
  if (!round) return null;

  const [members, predictions] = await Promise.all([
    prisma.member.findMany({ where: { groupId: round.groupId }, select: { id: true, name: true } }),
    prisma.prediction.findMany({
      where: { roundMatch: { roundId } },
      select: predictionSelect,
    }),
  ]);
  return { round, rows: computeLeaderboard(members, (predictions as RawPrediction[]).map(toScored)) };
});

export const listGroupRounds = cache(async (groupId: string) => {
  return prisma.round.findMany({
    where: { groupId },
    orderBy: { createdAt: "asc" },
    select: { id: true, title: true, status: true },
  });
});

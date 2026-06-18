import { cache } from "react";
import { prisma } from "../prisma";
import { deriveOutcome, scoreRoundMatch, type OutcomeValue, type ScoringModeValue } from "../scoring";

export interface LeaderboardRow {
  memberId: string;
  name: string;
  points: number;
  correct: number;
  played: number; // finished matches the member has faced (whether they bet or not)
  rank: number;
}

interface ScoredRoundMatch {
  scoringMode: ScoringModeValue;
  points: number; // shared/correct award
  uniqueHitPoints: number;
  homeScore: number | null;
  awayScore: number | null;
  result: OutcomeValue | null;
  predictions: Array<{
    memberId: string;
    outcome: OutcomeValue;
    pointsAwarded: number | null;
    isCorrect: boolean | null;
  }>;
}

/**
 * Rank members by points. Scoring is driven by finished round-matches, not by
 * predictions: every group member "faces" each finished match, so a member who
 * didn't bet still counts it as played and scores 0 — the standings reflect the
 * result the moment it's entered, even with no bets. Per-prediction points are
 * trusted when persisted (settled at result entry); otherwise computed live so
 * the unique-hit bonus can count correct picks. Ties share a rank (competition
 * ranking: 1, 2, 2, 4).
 */
export function computeLeaderboard(
  members: Array<{ id: string; name: string }>,
  roundMatches: ScoredRoundMatch[],
): LeaderboardRow[] {
  const rows = new Map<string, LeaderboardRow>();
  for (const m of members) {
    rows.set(m.id, { memberId: m.id, name: m.name, points: 0, correct: 0, played: 0, rank: 0 });
  }

  for (const rm of roundMatches) {
    if (rm.homeScore == null || rm.awayScore == null) continue; // not finished yet
    const actual = rm.result ?? deriveOutcome(rm.homeScore, rm.awayScore);

    // Trust persisted per-prediction points (bonus already applied at settle);
    // otherwise score the whole match live so the bonus can count correct picks.
    const settled = rm.predictions.length > 0 && rm.predictions.every((p) => p.pointsAwarded != null);
    const scoreByMember = new Map<string, { points: number; correct: boolean }>();
    if (settled) {
      for (const p of rm.predictions) {
        scoreByMember.set(p.memberId, { points: p.pointsAwarded ?? 0, correct: p.isCorrect ?? false });
      }
    } else {
      const scores = scoreRoundMatch(actual, rm.predictions, {
        mode: rm.scoringMode,
        points: rm.points,
        uniqueHitPoints: rm.uniqueHitPoints,
      });
      for (const s of scores) {
        scoreByMember.set(s.memberId, { points: s.pointsAwarded, correct: s.isCorrect });
      }
    }

    // Every group member faces this finished match; non-bettors score 0.
    for (const row of rows.values()) {
      const score = scoreByMember.get(row.memberId);
      row.points += score?.points ?? 0;
      row.correct += score?.correct ? 1 : 0;
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

const roundMatchSelect = {
  points: true,
  uniqueHitPoints: true,
  round: { select: { scoringMode: true } },
  match: { select: { homeScore: true, awayScore: true, result: true } },
  predictions: {
    select: { memberId: true, outcome: true, pointsAwarded: true, isCorrect: true },
  },
} as const;

type RawRoundMatch = {
  points: number;
  uniqueHitPoints: number;
  round: { scoringMode: ScoringModeValue };
  match: { homeScore: number | null; awayScore: number | null; result: OutcomeValue | null };
  predictions: Array<{
    memberId: string;
    outcome: OutcomeValue;
    pointsAwarded: number | null;
    isCorrect: boolean | null;
  }>;
};

function toScored(rm: RawRoundMatch): ScoredRoundMatch {
  return {
    scoringMode: rm.round.scoringMode,
    points: rm.points,
    uniqueHitPoints: rm.uniqueHitPoints,
    homeScore: rm.match.homeScore,
    awayScore: rm.match.awayScore,
    result: rm.match.result,
    predictions: rm.predictions,
  };
}

export const getGroupLeaderboard = cache(async (groupId: string): Promise<LeaderboardRow[]> => {
  const [members, roundMatches] = await Promise.all([
    prisma.member.findMany({ where: { groupId }, select: { id: true, name: true } }),
    prisma.roundMatch.findMany({
      where: { round: { groupId } },
      select: roundMatchSelect,
    }),
  ]);
  return computeLeaderboard(members, (roundMatches as RawRoundMatch[]).map(toScored));
});

export const getRoundLeaderboard = cache(async (roundId: string) => {
  const round = await prisma.round.findUnique({
    where: { id: roundId },
    select: { id: true, title: true, groupId: true },
  });
  if (!round) return null;

  const [members, roundMatches] = await Promise.all([
    prisma.member.findMany({ where: { groupId: round.groupId }, select: { id: true, name: true } }),
    prisma.roundMatch.findMany({
      where: { roundId },
      select: roundMatchSelect,
    }),
  ]);
  return { round, rows: computeLeaderboard(members, (roundMatches as RawRoundMatch[]).map(toScored)) };
});

export const listGroupRounds = cache(async (groupId: string) => {
  return prisma.round.findMany({
    where: { groupId },
    orderBy: { createdAt: "asc" },
    select: { id: true, title: true, status: true },
  });
});

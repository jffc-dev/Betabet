"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "../prisma";
import { getGroupLeaderboard } from "../data/leaderboard";
import { deriveOutcome, settleMatches, type OutcomeValue } from "../scoring";
import { scoreSchema } from "../validation/result";
import type { ActionState } from "./types";

// Per-member scoring line for the match that was just saved.
export interface MatchScoreLine {
  memberName: string;
  outcome: OutcomeValue;
  isCorrect: boolean;
  points: number;
}

export interface ResultSummary {
  match: {
    home: string;
    away: string;
    homeScore: number;
    awayScore: number;
    result: OutcomeValue;
  };
  // Scoring for this match (only members who placed a bet), best first.
  lines: MatchScoreLine[];
  // Running group standings after this result.
  leaderboard: Array<{ rank: number; name: string; points: number; correct: number; played: number }>;
}

// Result action returns the standard state plus a summary to drive the modal.
export interface ResultActionState extends ActionState {
  summary?: ResultSummary;
}

// NOTE(auth): result entry should later be gated to group admins.
//
// Save the final score of a single match in a round (the one-by-one result flow).
// The match id travels in the form so a single bound action can serve every match.
export async function saveMatchResultAction(
  ref: { roundId: string; slug: string },
  _prev: ResultActionState,
  formData: FormData,
): Promise<ResultActionState> {
  const matchId = String(formData.get("matchId") ?? "").trim();
  const homeRaw = String(formData.get("home") ?? "").trim();
  const awayRaw = String(formData.get("away") ?? "").trim();

  if (homeRaw === "" || awayRaw === "") {
    return { ok: false, message: "Completa ambos marcadores." };
  }
  const home = scoreSchema.safeParse(homeRaw);
  const away = scoreSchema.safeParse(awayRaw);
  if (!home.success || !away.success) {
    return { ok: false, message: "Marcadores inválidos (0–99)." };
  }

  // Confirm the match really belongs to this round before mutating it.
  const roundMatch = await prisma.roundMatch.findFirst({
    where: { roundId: ref.roundId, matchId },
    select: { id: true },
  });
  if (!roundMatch) return { ok: false, message: "Partido no encontrado." };

  await prisma.$transaction(async (tx) => {
    await tx.match.update({
      where: { id: matchId },
      data: {
        homeScore: home.data,
        awayScore: away.data,
        status: "FINISHED",
        result: deriveOutcome(home.data, away.data),
      },
    });
    await settleMatches(tx, [matchId]);
  });

  revalidatePath(`/groups/${ref.slug}/rounds/${ref.roundId}`);
  revalidatePath(`/groups/${ref.slug}/leaderboard`);
  revalidatePath("/");

  // Build the post-save summary: this match's scoring + the running standings.
  const saved = await prisma.roundMatch.findFirst({
    where: { roundId: ref.roundId, matchId },
    select: {
      round: { select: { groupId: true } },
      match: {
        select: {
          homeScore: true,
          awayScore: true,
          result: true,
          homeTeam: { select: { name: true } },
          awayTeam: { select: { name: true } },
        },
      },
      predictions: {
        select: {
          outcome: true,
          pointsAwarded: true,
          isCorrect: true,
          member: { select: { name: true } },
        },
      },
    },
  });

  if (!saved || saved.match.result == null) {
    return { ok: true, message: "Resultado guardado" };
  }

  const lines: MatchScoreLine[] = saved.predictions
    .map((p) => ({
      memberName: p.member.name,
      outcome: p.outcome as OutcomeValue,
      isCorrect: p.isCorrect ?? false,
      points: p.pointsAwarded ?? 0,
    }))
    .sort((a, b) => b.points - a.points || a.memberName.localeCompare(b.memberName));

  const leaderboard = (await getGroupLeaderboard(saved.round.groupId)).map((r) => ({
    rank: r.rank,
    name: r.name,
    points: r.points,
    correct: r.correct,
    played: r.played,
  }));

  return {
    ok: true,
    message: "Resultado guardado",
    summary: {
      match: {
        home: saved.match.homeTeam.name,
        away: saved.match.awayTeam.name,
        homeScore: saved.match.homeScore!,
        awayScore: saved.match.awayScore!,
        result: saved.match.result as OutcomeValue,
      },
      lines,
      leaderboard,
    },
  };
}

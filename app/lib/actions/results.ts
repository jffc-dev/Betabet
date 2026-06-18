"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "../prisma";
import { deriveOutcome, settleMatches } from "../scoring";
import { scoreSchema } from "../validation/result";
import type { ActionState } from "./types";

// NOTE(auth): result entry should later be gated to group admins.
//
// Save the final score of a single match in a round (the one-by-one result flow).
// The match id travels in the form so a single bound action can serve every match.
export async function saveMatchResultAction(
  ref: { roundId: string; slug: string },
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
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
  return { ok: true, message: "Resultado guardado" };
}

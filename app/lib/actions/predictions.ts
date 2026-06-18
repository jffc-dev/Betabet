"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "../prisma";
import { getSessionMember } from "../session";
import { predictionPicksSchema, type PredictionPick } from "../validation/play";
import type { ActionState } from "./types";

/**
 * Upsert the current member's predictions. Picks for matches that don't belong
 * to the member's group, or that have already kicked off, are ignored — never
 * trust the client list.
 */
export async function savePredictionsAction(
  _prev: ActionState,
  picks: PredictionPick[],
): Promise<ActionState> {
  const member = await getSessionMember();
  if (!member) {
    return { ok: false, message: "Tu sesión expiró. Abre tu enlace de invitación otra vez." };
  }

  const parsed = predictionPicksSchema.safeParse(picks);
  if (!parsed.success) return { ok: false, message: "No se pudieron leer tus predicciones." };

  const validRoundMatches = await prisma.roundMatch.findMany({
    where: { round: { groupId: member.groupId } },
    select: { id: true, match: { select: { kickoff: true, status: true } } },
  });
  const validById = new Map(validRoundMatches.map((v) => [v.id, v]));
  const now = Date.now();

  const toSave = parsed.data.filter((p) => {
    const rm = validById.get(p.roundMatchId);
    return rm != null && rm.match.kickoff.getTime() > now && rm.match.status === "SCHEDULED";
  });

  if (toSave.length > 0) {
    await prisma.$transaction(
      toSave.map((p) =>
        prisma.prediction.upsert({
          where: {
            roundMatchId_memberId: { roundMatchId: p.roundMatchId, memberId: member.id },
          },
          update: { outcome: p.outcome },
          create: { roundMatchId: p.roundMatchId, memberId: member.id, outcome: p.outcome },
        }),
      ),
    );
  }

  revalidatePath("/");
  return {
    ok: true,
    message: `Guardado · ${toSave.length} ${toSave.length === 1 ? "predicción" : "predicciones"}`,
  };
}

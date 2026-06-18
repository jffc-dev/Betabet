"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "../prisma";
import { getSessionMember } from "../session";
import { predictionPicksSchema, type PredictionPick } from "../validation/play";
import type { ActionState } from "./types";

/**
 * Sync the current member's predictions with the picks the client submitted.
 * Picks for matches that don't belong to the member's group, or that have
 * already kicked off, are ignored — never trust the client list.
 *
 * Any open match in the group that the member previously predicted but is no
 * longer in the submitted list is treated as "undone" and its prediction is
 * deleted. This is how a cleared pick is persisted. Locked matches are left
 * untouched so a deadline can't be sidestepped by omitting them.
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
  const now = Date.now();
  const isOpen = (rm: { match: { kickoff: Date; status: string } }) =>
    rm.match.kickoff.getTime() > now && rm.match.status === "SCHEDULED";

  const openIds = new Set(validRoundMatches.filter(isOpen).map((rm) => rm.id));

  const toSave = parsed.data.filter((p) => openIds.has(p.roundMatchId));
  const submittedIds = new Set(toSave.map((p) => p.roundMatchId));
  // Open matches the member is no longer picking -> clear any saved prediction.
  const toClear = [...openIds].filter((id) => !submittedIds.has(id));

  const ops = [
    ...toSave.map((p) =>
      prisma.prediction.upsert({
        where: { roundMatchId_memberId: { roundMatchId: p.roundMatchId, memberId: member.id } },
        update: { outcome: p.outcome },
        create: { roundMatchId: p.roundMatchId, memberId: member.id, outcome: p.outcome },
      }),
    ),
    ...(toClear.length > 0
      ? [prisma.prediction.deleteMany({ where: { memberId: member.id, roundMatchId: { in: toClear } } })]
      : []),
  ];

  if (ops.length > 0) await prisma.$transaction(ops);

  revalidatePath("/");
  return {
    ok: true,
    message: `Guardado · ${toSave.length} ${toSave.length === 1 ? "predicción" : "predicciones"}`,
  };
}

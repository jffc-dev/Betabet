"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "../prisma";
import { deriveOutcome } from "../scoring";
import { scoreSchema } from "../validation/result";
import type { ActionState } from "./types";

// NOTE(auth): result entry should later be gated to group admins.
export async function saveRoundResultsAction(
  ref: { roundId: string; slug: string },
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const round = await prisma.round.findUnique({
    where: { id: ref.roundId },
    select: { roundMatches: { select: { match: { select: { id: true } } } } },
  });
  if (!round) return { ok: false, message: "Ronda no encontrada." };

  const updates: Array<{ id: string; home: number; away: number }> = [];
  for (const { match } of round.roundMatches) {
    const homeRaw = String(formData.get(`home_${match.id}`) ?? "").trim();
    const awayRaw = String(formData.get(`away_${match.id}`) ?? "").trim();

    if (homeRaw === "" && awayRaw === "") continue; // not entered yet
    if (homeRaw === "" || awayRaw === "") {
      return { ok: false, message: "Completa ambos marcadores o deja el partido vacío." };
    }
    const home = scoreSchema.safeParse(homeRaw);
    const away = scoreSchema.safeParse(awayRaw);
    if (!home.success || !away.success) {
      return { ok: false, message: "Marcadores inválidos (0–99)." };
    }
    updates.push({ id: match.id, home: home.data, away: away.data });
  }

  if (updates.length === 0) return { ok: false, message: "No hay marcadores para guardar." };

  await prisma.$transaction(
    updates.map((u) =>
      prisma.match.update({
        where: { id: u.id },
        data: {
          homeScore: u.home,
          awayScore: u.away,
          status: "FINISHED",
          result: deriveOutcome(u.home, u.away),
        },
      }),
    ),
  );

  revalidatePath(`/groups/${ref.slug}/rounds/${ref.roundId}`);
  revalidatePath(`/groups/${ref.slug}/leaderboard`);
  revalidatePath("/play");
  return {
    ok: true,
    message: `Guardado · ${updates.length} ${updates.length === 1 ? "resultado" : "resultados"}`,
  };
}

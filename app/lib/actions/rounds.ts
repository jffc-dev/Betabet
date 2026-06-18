"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "../prisma";
import { settleMatches } from "../scoring";
import { roundInputSchema } from "../validation/round";
import type { ActionState } from "./types";

// NOTE(auth): Server Actions are public POST endpoints. Once a sign-in flow
// exists, gate this with `auth()` and verify the caller may manage the group.

function toFieldErrors(error: z.ZodError): Record<string, string[]> {
  const fieldErrors: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    (fieldErrors[key] ??= []).push(issue.message);
  }
  return fieldErrors;
}

export async function updateRoundAction(
  ref: { id: string; slug: string },
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = roundInputSchema.safeParse({
    title: formData.get("title"),
    scoringMode: formData.get("scoringMode"),
  });
  if (!parsed.success) {
    return { ok: false, message: "Revisa los campos marcados.", fieldErrors: toFieldErrors(parsed.error) };
  }
  const { title, scoringMode } = parsed.data;

  // Changing the scoring mode must recompute points for matches already settled,
  // so we update and re-settle the round's finished matches in one transaction.
  await prisma.$transaction(async (tx) => {
    await tx.round.update({ where: { id: ref.id }, data: { title, scoringMode } });

    const roundMatches = await tx.roundMatch.findMany({
      where: { roundId: ref.id, match: { status: "FINISHED" } },
      select: { matchId: true },
    });
    await settleMatches(tx, roundMatches.map((rm) => rm.matchId));
  });

  revalidatePath(`/groups/${ref.slug}`);
  revalidatePath(`/groups/${ref.slug}/rounds/${ref.id}`);
  revalidatePath(`/groups/${ref.slug}/leaderboard`);
  revalidatePath("/");
  redirect(`/groups/${ref.slug}/rounds/${ref.id}`);
}

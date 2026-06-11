"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "../prisma";
import { applyTemplateToGroup, type TemplateGroupBy } from "../templates";
import type { ActionState } from "./types";

const GROUP_BY_VALUES: TemplateGroupBy[] = ["NONE", "GROUP", "MATCHDAY"];

// NOTE(auth): applying a template should later be gated to group admins.
export async function applyTemplateAction(
  ref: { templateId: string; groupId: string; slug: string },
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const raw = String(formData.get("groupBy") ?? "GROUP");
  const groupBy = (
    GROUP_BY_VALUES.includes(raw as TemplateGroupBy) ? raw : "GROUP"
  ) as TemplateGroupBy;

  const alreadyApplied = await prisma.round.count({
    where: { groupId: ref.groupId, templateId: ref.templateId },
  });
  if (alreadyApplied > 0) {
    return { ok: false, message: "Esta plantilla ya está aplicada a este grupo." };
  }

  const rounds = await applyTemplateToGroup(prisma, {
    templateId: ref.templateId,
    groupId: ref.groupId,
    groupBy,
  });

  revalidatePath(`/groups/${ref.slug}`);
  const totalMatches = rounds.reduce((sum, r) => sum + r.matchCount, 0);
  return {
    ok: true,
    message: `Plantilla aplicada · ${rounds.length} ${rounds.length === 1 ? "ronda" : "rondas"}, ${totalMatches} partidos.`,
  };
}

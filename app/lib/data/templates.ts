import { cache } from "react";
import { prisma } from "../prisma";

// Available templates plus whether each is already applied to the given group
// (a group shouldn't apply the same template twice).
export const listTemplatesForGroup = cache(async (groupId: string) => {
  const [templates, appliedRounds] = await Promise.all([
    prisma.template.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        season: true,
        kind: true,
        _count: { select: { matches: true } },
      },
    }),
    prisma.round.findMany({
      where: { groupId, templateId: { not: null } },
      select: { templateId: true },
      distinct: ["templateId"],
    }),
  ]);

  const appliedIds = new Set(appliedRounds.map((r) => r.templateId));
  return templates.map((template) => ({ ...template, applied: appliedIds.has(template.id) }));
});

export type GroupTemplate = Awaited<ReturnType<typeof listTemplatesForGroup>>[number];

import type { PrismaClient } from "../generated/prisma/client";

// How a template's matches are split into rounds when applied to a group.
export type TemplateGroupBy = "NONE" | "GROUP" | "MATCHDAY";

export interface ApplyTemplateOptions {
  templateId: string;
  groupId: string;
  groupBy?: TemplateGroupBy;
}

export interface AppliedRound {
  id: string;
  title: string;
  matchCount: number;
}

/**
 * Instantiate a Template into a group as one or more Rounds. Because matches are
 * shared globally, the created RoundMatches point at the template's canonical
 * Match rows — so entering a result once settles every group that applied it.
 * Runs in a single transaction; returns the rounds created.
 */
export async function applyTemplateToGroup(
  client: PrismaClient,
  { templateId, groupId, groupBy = "GROUP" }: ApplyTemplateOptions,
): Promise<AppliedRound[]> {
  const template = await client.template.findUniqueOrThrow({
    where: { id: templateId },
    include: {
      matches: {
        orderBy: { position: "asc" },
        include: { match: { select: { kickoff: true } } },
      },
    },
  });

  // Partition template matches into buckets keyed by the chosen grouping.
  // Insertion order follows `position` (chronological), so rounds and their
  // matches keep a sensible order.
  const buckets = new Map<string, typeof template.matches>();
  for (const tm of template.matches) {
    const key =
      groupBy === "GROUP"
        ? tm.groupName ?? "Round"
        : groupBy === "MATCHDAY"
          ? `Matchday ${tm.matchday ?? "?"}`
          : "all";
    const bucket = buckets.get(key) ?? [];
    bucket.push(tm);
    buckets.set(key, bucket);
  }

  const applied: AppliedRound[] = [];

  await client.$transaction(async (tx) => {
    for (const [label, items] of buckets) {
      const lockAt = items.reduce<Date | null>(
        (earliest, tm) =>
          earliest && earliest <= tm.match.kickoff ? earliest : tm.match.kickoff,
        null,
      );
      const title = groupBy === "NONE" ? template.name : `${template.name} — ${label}`;

      const round = await tx.round.create({
        data: {
          groupId,
          templateId: template.id,
          title,
          status: "OPEN",
          lockAt,
          roundMatches: {
            create: items.map((tm, i) => ({
              matchId: tm.matchId,
              points: tm.points,
              position: tm.position ?? i + 1,
            })),
          },
        },
      });
      applied.push({ id: round.id, title, matchCount: items.length });
    }
  });

  return applied;
}

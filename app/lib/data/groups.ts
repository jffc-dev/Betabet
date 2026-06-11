import { cache } from "react";
import { prisma } from "../prisma";

// Read queries for groups. Wrapped in React `cache` so multiple calls within a
// single request (e.g. a layout and a page) reuse one query.

export const listGroupSummaries = cache(async () => {
  return prisma.group.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { members: true, rounds: true } } },
  });
});

export type GroupSummary = Awaited<ReturnType<typeof listGroupSummaries>>[number];

export const getGroupBySlug = cache(async (slug: string) => {
  return prisma.group.findUnique({
    where: { slug },
    include: {
      _count: { select: { members: true, rounds: true, invitations: true } },
      members: {
        take: 8,
        orderBy: { createdAt: "asc" },
        select: { id: true, name: true, role: true },
      },
      rounds: {
        take: 5,
        orderBy: { createdAt: "desc" },
        select: { id: true, title: true, status: true },
      },
      invitations: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          code: true,
          redeemedAt: true,
          redeemedByMember: { select: { name: true } },
        },
      },
    },
  });
});

export type GroupDetail = NonNullable<Awaited<ReturnType<typeof getGroupBySlug>>>;

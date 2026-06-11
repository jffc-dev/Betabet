import "dotenv/config";
import { prisma } from "../app/lib/prisma";
import { generateAccessToken, generateInvitationCode } from "../app/lib/tokens";
import { settleRound, type OutcomeValue } from "../app/lib/scoring";

// Exercises the full data-flow: group -> invitation -> guest member (redeemed)
// -> round of 2 matches -> predictions -> enter scores -> settle -> leaderboard.

async function reset() {
  // FK-safe order.
  await prisma.prediction.deleteMany();
  await prisma.roundMatch.deleteMany();
  await prisma.round.deleteMany();
  await prisma.invitation.deleteMany();
  await prisma.member.deleteMany();
  await prisma.match.deleteMany();
  await prisma.team.deleteMany();
  await prisma.group.deleteMany();
}

/** Mirrors the real single-use invitation redemption flow. */
async function redeemInvitation(code: string, name: string) {
  return prisma.$transaction(async (tx) => {
    const invite = await tx.invitation.findUnique({ where: { code } });
    if (!invite) throw new Error(`Invitation ${code} not found`);
    if (invite.redeemedByMemberId) throw new Error(`Invitation ${code} already used`);
    if (invite.expiresAt && invite.expiresAt < new Date()) throw new Error(`Invitation ${code} expired`);

    const member = await tx.member.create({
      data: {
        groupId: invite.groupId,
        name,
        role: invite.role,
        accessToken: generateAccessToken(),
      },
    });

    await tx.invitation.update({
      where: { id: invite.id },
      data: { redeemedByMemberId: member.id, redeemedAt: new Date() },
    });

    return member;
  });
}

async function main() {
  await reset();

  // 1. Group
  const group = await prisma.group.create({
    data: { name: "Office League", slug: "office-league", defaultMatchPoints: 1 },
  });

  // 2 & 3. Three guests join via single-use invitation codes
  const guests = ["Ana", "Beto", "Caro"];
  const members = [];
  for (const name of guests) {
    const invite = await prisma.invitation.create({
      data: { groupId: group.id, code: generateInvitationCode(), label: `for ${name}` },
    });
    members.push(await redeemInvitation(invite.code, name));
  }
  const [ana, beto, caro] = members;

  // 4. Teams + matches (manual entry)
  const [barca, madrid, liverpool, chelsea] = await Promise.all(
    ["Barcelona", "Real Madrid", "Liverpool", "Chelsea"].map((name) =>
      prisma.team.create({ data: { name } }),
    ),
  );
  const match1 = await prisma.match.create({
    data: { homeTeamId: barca.id, awayTeamId: madrid.id, kickoff: new Date("2026-06-13T18:00:00Z"), competition: "Friendly" },
  });
  const match2 = await prisma.match.create({
    data: { homeTeamId: liverpool.id, awayTeamId: chelsea.id, kickoff: new Date("2026-06-13T20:00:00Z"), competition: "Friendly" },
  });

  // 5. A round bundling both matches. Match 2 is weighted 2x to show weighting.
  const round = await prisma.round.create({
    data: {
      groupId: group.id,
      title: "Matchweek 1",
      status: "OPEN",
      lockAt: match1.kickoff,
      roundMatches: {
        create: [
          { matchId: match1.id, points: 1, position: 1 },
          { matchId: match2.id, points: 2, position: 2 },
        ],
      },
    },
    include: { roundMatches: true },
  });
  const rm1 = round.roundMatches.find((rm) => rm.matchId === match1.id)!;
  const rm2 = round.roundMatches.find((rm) => rm.matchId === match2.id)!;

  // 6 & 7. Predictions (actual results will be M1=HOME 2-1, M2=DRAW 1-1)
  const picks: Array<[string, OutcomeValue, OutcomeValue]> = [
    [ana.id, "HOME", "DRAW"], // both correct -> 1 + 2 = 3
    [beto.id, "HOME", "HOME"], // only M1 -> 1
    [caro.id, "AWAY", "DRAW"], // only M2 -> 2
  ];
  for (const [memberId, p1, p2] of picks) {
    await prisma.prediction.createMany({
      data: [
        { roundMatchId: rm1.id, memberId, outcome: p1 },
        { roundMatchId: rm2.id, memberId, outcome: p2 },
      ],
    });
  }

  // 8. Admin enters final scores
  await prisma.match.update({ where: { id: match1.id }, data: { homeScore: 2, awayScore: 1 } });
  await prisma.match.update({ where: { id: match2.id }, data: { homeScore: 1, awayScore: 1 } });

  // 9. Settle + print leaderboard
  const leaderboard = await settleRound(prisma, round.id);

  console.log(`\nLeaderboard — "${round.title}" (${group.name}):`);
  for (const e of leaderboard) {
    console.log(`  #${e.rank}  ${e.memberName.padEnd(6)} ${e.points} pts  (${e.correct}/${e.total} correct)`);
  }
  console.log("\nGuest access links (no auth needed):");
  for (const m of members) {
    console.log(`  ${m.name.padEnd(6)} /m/${m.accessToken}`);
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (err) => {
    console.error(err);
    await prisma.$disconnect();
    process.exit(1);
  });

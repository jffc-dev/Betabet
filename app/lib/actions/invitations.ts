"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "../prisma";
import { generateAccessToken, generateInvitationCode } from "../tokens";
import { setSessionToken } from "../session";
import { joinNameSchema } from "../validation/play";
import type { ActionState } from "./types";

// NOTE(auth): invitation generation should later be gated to group admins.
export async function createInvitationAction(ref: { groupId: string; slug: string }) {
  await prisma.invitation.create({
    data: { groupId: ref.groupId, code: generateInvitationCode() },
  });
  revalidatePath(`/groups/${ref.slug}`);
}

export async function deleteInvitationAction(ref: { id: string; slug: string }) {
  // Only unredeemed invitations can be revoked (a redeemed one owns a member).
  await prisma.invitation.deleteMany({ where: { id: ref.id, redeemedByMemberId: null } });
  revalidatePath(`/groups/${ref.slug}`);
}

/**
 * Redeem an invitation with the visitor's name. First use creates a guest
 * Member; if the link was already redeemed we just resume that member. Either
 * way the session cookie is set and we land on /play.
 */
export async function joinWithNameAction(
  code: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = joinNameSchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) {
    return {
      ok: false,
      message: "Revisa tu nombre.",
      fieldErrors: { name: parsed.error.issues.map((i) => i.message) },
    };
  }

  const invitation = await prisma.invitation.findUnique({ where: { code } });
  if (!invitation) return { ok: false, message: "Esta invitación no es válida." };

  // Create-or-resume in a transaction so a double submit can't create two members.
  const accessToken = await prisma.$transaction(async (tx) => {
    const fresh = await tx.invitation.findUnique({
      where: { id: invitation.id },
      include: { redeemedByMember: { select: { accessToken: true } } },
    });
    if (fresh?.redeemedByMember) return fresh.redeemedByMember.accessToken;

    const token = generateAccessToken();
    const member = await tx.member.create({
      data: { groupId: invitation.groupId, name: parsed.data.name, accessToken: token },
    });
    await tx.invitation.update({
      where: { id: invitation.id },
      data: { redeemedByMemberId: member.id, redeemedAt: new Date() },
    });
    return token;
  });

  await setSessionToken(accessToken);
  redirect("/play");
}

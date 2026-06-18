import { NextResponse } from "next/server";
import { prisma } from "../../lib/prisma";
import { SESSION_COOKIE, sessionCookieOptions } from "../../lib/session";

// Entry point for an invitation link. Sets the session and redirects:
// - invalid code  -> /join/invalid
// - already used   -> resume that member's session -> /
// - first use      -> /join/[code]/name to capture the visitor's name
export async function GET(req: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;

  const invitation = await prisma.invitation.findUnique({
    where: { code },
    include: { redeemedByMember: { select: { accessToken: true } } },
  });

  if (!invitation) {
    return NextResponse.redirect(new URL("/join/invalid", req.url));
  }

  if (invitation.redeemedByMember) {
    const res = NextResponse.redirect(new URL("/", req.url));
    res.cookies.set(
      SESSION_COOKIE,
      invitation.redeemedByMember.accessToken,
      sessionCookieOptions(),
    );
    return res;
  }

  return NextResponse.redirect(new URL(`/join/${code}/name`, req.url));
}

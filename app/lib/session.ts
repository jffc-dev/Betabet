import { cookies } from "next/headers";
import { cache } from "react";
import { prisma } from "./prisma";

// Invitation-code "auth": the session is just the current Member's accessToken
// stored in an httpOnly cookie. There is no password/user — the cookie (set when
// an invitation link is used) is what identifies the guest on later visits.

export const SESSION_COOKIE = "bb_member";

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 60 * 24 * 365, // 1 year
    secure: process.env.NODE_ENV === "production",
  };
}

/** Set the current session to a member's access token (Server Actions only). */
export async function setSessionToken(accessToken: string) {
  const store = await cookies();
  store.set(SESSION_COOKIE, accessToken, sessionCookieOptions());
}

/** Clear the session cookie (Server Actions only). */
export async function clearSession() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

/** Resolve the Member for the current session, or null. Memoized per request. */
export const getSessionMember = cache(async () => {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return prisma.member.findUnique({
    where: { accessToken: token },
    include: { group: true },
  });
});

export type SessionMember = NonNullable<Awaited<ReturnType<typeof getSessionMember>>>;

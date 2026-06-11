import { randomBytes } from "node:crypto";

// URL-safe, unguessable tokens for invitation codes and guest member links.
// These are intentionally NOT sequential ids — they appear in shareable URLs.

function randomUrlSafe(byteLength: number): string {
  return randomBytes(byteLength).toString("base64url");
}

// ~16 chars — short enough to share, large enough to be unguessable.
export function generateInvitationCode(): string {
  return randomUrlSafe(12);
}

// ~32 chars — persistent guest access token (e.g. /m/{accessToken}).
export function generateAccessToken(): string {
  return randomUrlSafe(24);
}

import { redirect } from "next/navigation";
import { getSessionMember } from "../lib/session";

// Atajo: redirige a la clasificación del grupo del miembro actual.
// Sin sesión, lleva al listado de grupos para elegir o unirse a uno.
export default async function LeaderboardRedirectPage() {
  const member = await getSessionMember();
  if (member) {
    redirect(`/groups/${member.group.slug}/leaderboard`);
  }
  redirect("/groups");
}

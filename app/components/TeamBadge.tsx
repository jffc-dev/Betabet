import Image from "next/image";
import type { Team } from "../lib/types";

interface TeamBadgeProps {
  team: Team;
}

/**
 * Team crest. Renders the real logo image when available, otherwise a colored
 * badge with the team initials as a placeholder.
 */
export default function TeamBadge({ team }: TeamBadgeProps) {
  if (team.logo) {
    return (
      <Image
        src={team.logo}
        alt={team.name}
        width={40}
        height={40}
        className="size-10 shrink-0 rounded-full object-contain"
      />
    );
  }

  return (
    <span
      aria-hidden
      style={{ backgroundColor: team.crestColor }}
      className="flex size-10 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
    >
      {team.shortName}
    </span>
  );
}

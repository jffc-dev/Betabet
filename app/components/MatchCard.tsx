import type { Match, Outcome } from "../lib/types";
import OutcomeButton from "./OutcomeButton";
import TeamBadge from "./TeamBadge";

interface MatchCardProps {
  match: Match;
  pick: Outcome | null;
  onPick: (outcome: Outcome) => void;
}

function formatKickoff(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function MatchCard({ match, pick, onPick }: MatchCardProps) {
  return (
    <section className="rounded-3xl border border-neutral-800 bg-neutral-900 p-4 shadow-lg">
      <header className="mb-4 flex items-center justify-between text-xs text-neutral-400">
        <span className="font-medium uppercase tracking-wide">{match.league}</span>
        <time dateTime={match.kickoff}>{formatKickoff(match.kickoff)}</time>
      </header>

      <div className="flex flex-col gap-2">
        <OutcomeButton
          label={match.home.name}
          tag="Gana A"
          leading={<TeamBadge team={match.home} />}
          selected={pick === "HOME"}
          onSelect={() => onPick("HOME")}
        />
        <OutcomeButton
          label="Empate"
          tag="X"
          leading={
            <span
              aria-hidden
              className="flex size-10 shrink-0 items-center justify-center rounded-full bg-neutral-700 text-xs font-bold text-neutral-200"
            >
              X
            </span>
          }
          selected={pick === "DRAW"}
          onSelect={() => onPick("DRAW")}
        />
        <OutcomeButton
          label={match.away.name}
          tag="Gana B"
          leading={<TeamBadge team={match.away} />}
          selected={pick === "AWAY"}
          onSelect={() => onPick("AWAY")}
        />
      </div>
    </section>
  );
}

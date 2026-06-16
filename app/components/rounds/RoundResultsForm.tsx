"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { initialActionState, type ActionState } from "../../lib/actions/types";

export interface ResultMatch {
  matchId: string;
  kickoff: string;
  home: { name: string; crest: string | null };
  away: { name: string; crest: string | null };
  homeScore: number | null;
  awayScore: number | null;
}

export function RoundResultsForm({
  action,
  matches,
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  matches: ResultMatch[];
}) {
  const [state, formAction, pending] = useActionState(action, initialActionState);

  useEffect(() => {
    if (!state.message) return;
    (state.ok ? toast.success : toast.error)(state.message);
  }, [state]);

  return (
    <form action={formAction} className="flex flex-col gap-3 pb-24">
      {matches.map((match) => (
        <div key={match.matchId} className="rounded-2xl border border-neutral-800 bg-neutral-900 p-3">
          <p className="mb-2 text-xs text-neutral-500">{formatKickoff(match.kickoff)}</p>
          <div className="flex items-center gap-2">
            <TeamSide crest={match.home.crest} name={match.home.name} />
            <ScoreInput name={`home_${match.matchId}`} defaultValue={match.homeScore} />
            <span className="text-neutral-600">-</span>
            <ScoreInput name={`away_${match.matchId}`} defaultValue={match.awayScore} />
            <TeamSide crest={match.away.crest} name={match.away.name} align="right" />
          </div>
        </div>
      ))}

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-neutral-800 bg-neutral-950/90 backdrop-blur">
        <div className="mx-auto w-full max-w-md px-4 py-3">
          <Button type="submit" disabled={pending} className="w-full">
            {pending ? "Guardando…" : "Guardar resultados"}
          </Button>
        </div>
      </div>
    </form>
  );
}

function TeamSide({
  crest,
  name,
  align = "left",
}: {
  crest: string | null;
  name: string;
  align?: "left" | "right";
}) {
  return (
    <div
      className={`flex min-w-0 flex-1 items-center gap-2 ${align === "right" ? "flex-row-reverse text-right" : ""}`}
    >
      {crest ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={crest} alt="" className="size-6 shrink-0 rounded-sm object-cover" />
      ) : (
        <span className="size-6 shrink-0 rounded-sm bg-neutral-700" />
      )}
      <span className="truncate text-sm text-neutral-100">{name}</span>
    </div>
  );
}

function ScoreInput({ name, defaultValue }: { name: string; defaultValue: number | null }) {
  return (
    <Input
      type="number"
      name={name}
      min={0}
      max={99}
      inputMode="numeric"
      defaultValue={defaultValue ?? ""}
      aria-label={name.startsWith("home") ? "Marcador local" : "Marcador visitante"}
      className="h-10 w-11 shrink-0 bg-neutral-950 px-0 text-center [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
    />
  );
}

function formatKickoff(iso: string): string {
  return new Date(iso).toLocaleString("es-MX", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

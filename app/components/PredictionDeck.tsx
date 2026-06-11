"use client";

import { useState } from "react";
import type { Match, Outcome } from "../lib/types";
import MatchCard from "./MatchCard";

interface PredictionDeckProps {
  matches: Match[];
}

export default function PredictionDeck({ matches }: PredictionDeckProps) {
  const [index, setIndex] = useState(0);
  const [picks, setPicks] = useState<Record<string, Outcome>>({});
  const [saved, setSaved] = useState(false);

  const match = matches[index];
  const total = matches.length;
  const isFirst = index === 0;
  const isLast = index === total - 1;
  const predictedCount = Object.keys(picks).length;

  function pick(outcome: Outcome) {
    setPicks((prev) => ({ ...prev, [match.id]: outcome }));
    setSaved(false);
  }

  function goTo(next: number) {
    setIndex(Math.min(Math.max(next, 0), total - 1));
  }

  function save() {
    // UI only for now — persistence gets wired up later.
    console.log("Predicciones guardadas", picks);
    setSaved(true);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-neutral-400">
          Partido {index + 1} de {total}
        </span>
        <span className="text-xs text-neutral-500">
          {predictedCount}/{total} predichos
        </span>
      </div>

      <div className="flex justify-center gap-1.5">
        {matches.map((m, i) => (
          <button
            key={m.id}
            type="button"
            aria-label={`Ir al partido ${i + 1}`}
            aria-current={i === index}
            onClick={() => goTo(i)}
            className={[
              "size-2 rounded-full transition-colors",
              i === index
                ? "bg-emerald-400"
                : picks[m.id]
                  ? "bg-emerald-700"
                  : "bg-neutral-700",
            ].join(" ")}
          />
        ))}
      </div>

      <MatchCard match={match} pick={picks[match.id] ?? null} onPick={pick} />

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => goTo(index - 1)}
          disabled={isFirst}
          className="flex-1 rounded-2xl border border-neutral-700 px-4 py-3 text-sm font-semibold text-neutral-100 transition-colors active:bg-neutral-800 disabled:opacity-40"
        >
          Anterior
        </button>
        <button
          type="button"
          onClick={() => goTo(index + 1)}
          disabled={isLast}
          className="flex-1 rounded-2xl border border-neutral-700 px-4 py-3 text-sm font-semibold text-neutral-100 transition-colors active:bg-neutral-800 disabled:opacity-40"
        >
          Siguiente
        </button>
      </div>

      <button
        type="button"
        onClick={save}
        className="rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-bold text-emerald-950 transition-colors active:bg-emerald-400"
      >
        Guardar predicciones
      </button>

      {saved ? (
        <p className="text-center text-sm font-medium text-emerald-400" role="status">
          Predicciones guardadas ✓
        </p>
      ) : null}
    </div>
  );
}

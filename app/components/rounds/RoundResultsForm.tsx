"use client";

import { useActionState, useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight, CircleCheck, TriangleAlert } from "lucide-react";
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
  hasResult: boolean;
  missingBettors: string[];
}

export function RoundResultsForm({
  action,
  matches,
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  matches: ResultMatch[];
}) {
  const [state, formAction, pending] = useActionState(action, initialActionState);

  // Start on the first match still missing a result; fall back to the first.
  const [index, setIndex] = useState(() => {
    const i = matches.findIndex((m) => !m.hasResult);
    return i === -1 ? 0 : i;
  });
  const [home, setHome] = useState("");
  const [away, setAway] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  // Matches saved during this session, on top of those already finished server-side.
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

  const current = matches[index];
  const isDone = (m: ResultMatch) => m.hasResult || savedIds.has(m.matchId);
  const remaining = matches.filter((m) => !isDone(m)).length;

  // Load the current match's stored scores into the inputs whenever we navigate.
  useEffect(() => {
    setHome(current.homeScore?.toString() ?? "");
    setAway(current.awayScore?.toString() ?? "");
  }, [current]);

  // React to a completed save: toast, mark saved, and jump to the next pending match.
  const handledRef = useRef(state);
  useEffect(() => {
    if (handledRef.current === state || !state.message) return;
    handledRef.current = state;

    if (!state.ok) {
      toast.error(state.message);
      return;
    }
    toast.success(state.message);
    setConfirmOpen(false);

    const savedId = current.matchId;
    setSavedIds((prev) => new Set(prev).add(savedId));

    const isPending = (m: ResultMatch) => !(m.hasResult || savedIds.has(m.matchId) || m.matchId === savedId);
    const next =
      matches.findIndex((m, i) => i > index && isPending(m)) !== -1
        ? matches.findIndex((m, i) => i > index && isPending(m))
        : matches.findIndex((m) => isPending(m));
    if (next !== -1) setIndex(next);
  }, [state, current, index, matches, savedIds]);

  function openConfirm() {
    if (home.trim() === "" || away.trim() === "") {
      toast.error("Completa ambos marcadores.");
      return;
    }
    setConfirmOpen(true);
  }

  const total = matches.length;

  return (
    <form action={formAction} className="flex flex-1 flex-col pb-24">
      <input type="hidden" name="matchId" value={current.matchId} />

      {/* Progress + manual navigation */}
      <div className="mb-3 flex items-center justify-between gap-2">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Partido anterior"
          disabled={index === 0}
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
        >
          <ChevronLeft />
        </Button>
        <div className="text-center">
          <p className="text-sm font-medium text-neutral-200">
            Partido {index + 1} de {total}
          </p>
          <p className="text-xs text-neutral-500">
            {remaining === 0 ? "Todos los resultados guardados" : `${remaining} por guardar`}
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Partido siguiente"
          disabled={index === total - 1}
          onClick={() => setIndex((i) => Math.min(total - 1, i + 1))}
        >
          <ChevronRight />
        </Button>
      </div>

      {/* Current match */}
      <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs text-neutral-500">{formatKickoff(current.kickoff)}</p>
          {isDone(current) ? (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-400">
              <CircleCheck className="size-3.5" /> Guardado
            </span>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          <TeamSide crest={current.home.crest} name={current.home.name} />
          <ScoreInput
            name="home"
            value={home}
            onChange={setHome}
            ariaLabel="Marcador local"
          />
          <span className="text-neutral-600">-</span>
          <ScoreInput
            name="away"
            value={away}
            onChange={setAway}
            ariaLabel="Marcador visitante"
          />
          <TeamSide crest={current.away.crest} name={current.away.name} align="right" />
        </div>
      </div>

      {current.missingBettors.length > 0 ? (
        <p className="mt-3 text-xs text-neutral-500">
          {current.missingBettors.length}{" "}
          {current.missingBettors.length === 1 ? "participante no apostó" : "participantes no apostaron"}{" "}
          en este partido.
        </p>
      ) : null}

      {/* Save bar */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-neutral-800 bg-neutral-950/90 backdrop-blur">
        <div className="mx-auto w-full max-w-md px-4 py-3">
          <Button type="button" className="w-full" onClick={openConfirm} disabled={pending}>
            {isDone(current) ? "Actualizar resultado" : "Guardar resultado"}
          </Button>
        </div>
      </div>

      <ConfirmDialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <h2 className="text-lg font-bold text-neutral-100">Confirmar resultado</h2>
        <div className="mt-4 flex items-center justify-center gap-3 rounded-2xl border border-neutral-800 bg-neutral-900 p-3">
          <span className="min-w-0 flex-1 truncate text-right text-sm text-neutral-100">
            {current.home.name}
          </span>
          <span className="shrink-0 text-lg font-bold tabular-nums text-neutral-100">
            {home || "0"} - {away || "0"}
          </span>
          <span className="min-w-0 flex-1 truncate text-sm text-neutral-100">{current.away.name}</span>
        </div>

        {current.missingBettors.length > 0 ? (
          <div className="mt-4 rounded-2xl border border-amber-900/60 bg-amber-950/30 p-3">
            <p className="flex items-center gap-1.5 text-sm font-medium text-amber-300">
              <TriangleAlert className="size-4" />
              {current.missingBettors.length}{" "}
              {current.missingBettors.length === 1
                ? "participante no apostó"
                : "participantes no apostaron"}
            </p>
            <p className="mt-1 text-xs text-amber-200/70">{current.missingBettors.join(", ")}</p>
          </div>
        ) : null}

        <div className="mt-5 flex gap-2">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={() => setConfirmOpen(false)}
            disabled={pending}
          >
            Cancelar
          </Button>
          <Button type="submit" className="flex-1" disabled={pending}>
            {pending ? "Guardando…" : "Confirmar"}
          </Button>
        </div>
      </ConfirmDialog>
    </form>
  );
}

function ConfirmDialog({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose(); // click on backdrop
      }}
      className="m-auto w-[calc(100%-2rem)] max-w-sm rounded-3xl border border-neutral-800 bg-neutral-950 p-5 text-neutral-100 backdrop:bg-black/60"
    >
      {children}
    </dialog>
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

function ScoreInput({
  name,
  value,
  onChange,
  ariaLabel,
}: {
  name: string;
  value: string;
  onChange: (value: string) => void;
  ariaLabel: string;
}) {
  return (
    <Input
      type="number"
      name={name}
      min={0}
      max={99}
      inputMode="numeric"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label={ariaLabel}
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

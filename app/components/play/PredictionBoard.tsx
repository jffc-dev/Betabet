"use client";

import { useActionState, useEffect, useMemo, useState, startTransition } from "react";
import { Check } from "lucide-react";
import { toast } from "sonner";
import { cn } from "../../lib/utils";
import { Button } from "../ui/button";
import { initialActionState, type ActionState } from "../../lib/actions/types";
import type { PlayItem } from "../../lib/data/play";

type Outcome = "HOME" | "DRAW" | "AWAY";
type SaveAction = (
  state: ActionState,
  picks: { roundMatchId: string; outcome: Outcome }[],
) => Promise<ActionState>;

export function PredictionBoard({ items, action }: { items: PlayItem[]; action: SaveAction }) {
  const [picks, setPicks] = useState<Record<string, Outcome>>(() => {
    const initial: Record<string, Outcome> = {};
    for (const item of items) if (item.pick) initial[item.roundMatchId] = item.pick;
    return initial;
  });
  const [state, formAction, pending] = useActionState(action, initialActionState);

  useEffect(() => {
    if (!state.message) return;
    (state.ok ? toast.success : toast.error)(state.message);
  }, [state]);

  const groups = useMemo(() => groupByDate(items), [items]);
  const predicted = Object.keys(picks).length;
  const openCount = items.filter((i) => !i.locked).length;

  function save() {
    const payload = Object.entries(picks).map(([roundMatchId, outcome]) => ({
      roundMatchId,
      outcome,
    }));
    startTransition(() => formAction(payload));
  }

  return (
    <>
      <div className="flex flex-col gap-6">
        {groups.map((group) => (
          <section key={group.key}>
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">
              {group.label}
            </h2>
            <ul className="flex flex-col gap-3">
              {group.items.map((item) => (
                <li key={item.roundMatchId}>
                  <MatchPicker
                    item={item}
                    pick={picks[item.roundMatchId] ?? null}
                    onPick={(outcome) =>
                      setPicks((prev) => ({ ...prev, [item.roundMatchId]: outcome }))
                    }
                  />
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-neutral-800 bg-neutral-950/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-md items-center justify-between gap-3 px-4 py-3">
          <span className="text-sm text-neutral-400">
            {predicted}/{items.length} predichos
          </span>
          <Button onClick={save} disabled={pending || openCount === 0} className="min-w-32">
            {pending ? "Guardando…" : "Guardar"}
          </Button>
        </div>
      </div>
    </>
  );
}

function MatchPicker({
  item,
  pick,
  onPick,
}: {
  item: PlayItem;
  pick: Outcome | null;
  onPick: (outcome: Outcome) => void;
}) {
  const time = new Date(item.kickoff).toLocaleTimeString("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <section className="rounded-3xl border border-neutral-800 bg-neutral-900 p-3">
      <header className="mb-2 flex items-center justify-between px-1 text-xs text-neutral-400">
        <span className="truncate">{item.competition ?? "Partido"}</span>
        <span className={item.locked ? "text-neutral-500" : ""}>
          {item.locked ? "Cerrado" : time}
        </span>
      </header>
      <div className="flex flex-col gap-1.5">
        <OutcomeRow
          crest={item.home.crest}
          label={item.home.name}
          tag="Local"
          selected={pick === "HOME"}
          disabled={item.locked}
          onSelect={() => onPick("HOME")}
        />
        <OutcomeRow
          label="Empate"
          tag="X"
          draw
          selected={pick === "DRAW"}
          disabled={item.locked}
          onSelect={() => onPick("DRAW")}
        />
        <OutcomeRow
          crest={item.away.crest}
          label={item.away.name}
          tag="Visitante"
          selected={pick === "AWAY"}
          disabled={item.locked}
          onSelect={() => onPick("AWAY")}
        />
      </div>
    </section>
  );
}

function OutcomeRow({
  crest,
  label,
  tag,
  selected,
  disabled,
  draw,
  onSelect,
}: {
  crest?: string | null;
  label: string;
  tag: string;
  selected: boolean;
  disabled?: boolean;
  draw?: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      aria-pressed={selected}
      onClick={onSelect}
      className={cn(
        "flex items-center gap-3 rounded-2xl border px-3 py-2.5 text-left transition-colors",
        selected
          ? "border-emerald-500 bg-emerald-500/10"
          : "border-neutral-800 bg-neutral-950/40",
        disabled ? "cursor-not-allowed opacity-50" : "active:bg-neutral-800",
      )}
    >
      {draw ? (
        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-neutral-700 text-xs font-bold text-neutral-200">
          X
        </span>
      ) : crest ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={crest} alt="" className="size-7 shrink-0 rounded-sm object-cover" />
      ) : (
        <span className="size-7 shrink-0 rounded-sm bg-neutral-700" />
      )}
      <span className="flex-1 truncate text-sm font-medium text-neutral-100">{label}</span>
      <span
        className={cn(
          "text-[10px] uppercase tracking-wide",
          selected ? "text-emerald-400" : "text-neutral-500",
        )}
      >
        {tag}
      </span>
      {selected ? <Check className="size-4 shrink-0 text-emerald-400" /> : null}
    </button>
  );
}

function groupByDate(items: PlayItem[]) {
  const map = new Map<string, { key: string; label: string; items: PlayItem[] }>();
  for (const item of items) {
    const date = new Date(item.kickoff);
    const key = date.toISOString().slice(0, 10);
    const label = date.toLocaleDateString("es-MX", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
    const group = map.get(key) ?? { key, label, items: [] };
    group.items.push(item);
    map.set(key, group);
  }
  return [...map.values()];
}

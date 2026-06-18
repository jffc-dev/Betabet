"use client";

import type React from "react";
import { useActionState, useEffect, useMemo, useRef, useState, startTransition } from "react";
import { Check, CalendarDays, ListFilter, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "../../lib/utils";
import { Button } from "../ui/button";
import { initialActionState, type ActionState } from "../../lib/actions/types";
import type { PlayItem } from "../../lib/data/play";

type Outcome = "HOME" | "DRAW" | "AWAY";
type Filter = "all" | "today";
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
  const [filter, setFilter] = useState<Filter>("all");

  useEffect(() => {
    if (!state.message) return;
    (state.ok ? toast.success : toast.error)(state.message);
  }, [state]);

  const todayCount = useMemo(() => items.filter((i) => isToday(i.kickoff)).length, [items]);
  const visibleItems = useMemo(
    () => (filter === "today" ? items.filter((i) => isToday(i.kickoff)) : items),
    [items, filter],
  );
  const groups = useMemo(() => groupByDate(visibleItems), [visibleItems]);
  const predicted = Object.keys(picks).length;
  const openCount = items.filter((i) => !i.locked).length;

  // Scroll the first live/upcoming match into view once, so the user lands on
  // the match that matters now instead of having to scroll past finished ones.
  const targetId = useMemo(() => findCurrentMatchId(items), [items]);
  const targetRef = useRef<HTMLLIElement>(null);
  useEffect(() => {
    const node = targetRef.current;
    if (!node) return;
    node.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [targetId]);

  function save() {
    const payload = Object.entries(picks).map(([roundMatchId, outcome]) => ({
      roundMatchId,
      outcome,
    }));
    startTransition(() => formAction(payload));
  }

  return (
    <>
      {visibleItems.length === 0 ? (
        <p className="mt-10 text-center text-sm text-neutral-500">
          No hay partidos hoy. Toca «Todos» para ver el resto.
        </p>
      ) : (
        <div className="flex flex-col gap-6">
          {groups.map((group) => (
            <section key={group.key}>
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                {group.label}
              </h2>
              <ul className="flex flex-col gap-3">
                {group.items.map((item) => (
                  <li
                    key={item.roundMatchId}
                    ref={item.roundMatchId === targetId ? targetRef : undefined}
                  >
                    <MatchPicker
                      item={item}
                      pick={picks[item.roundMatchId] ?? null}
                      onPick={(outcome) =>
                        setPicks((prev) => ({ ...prev, [item.roundMatchId]: outcome }))
                      }
                      onClear={() =>
                        setPicks((prev) => {
                          const next = { ...prev };
                          delete next[item.roundMatchId];
                          return next;
                        })
                      }
                    />
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      {/* Floating filter: toggles between all matches and just today's. Sits
          above the save bar so it stays reachable while scrolling the list. */}
      <div className="pointer-events-none fixed inset-x-0 bottom-20 z-30 flex justify-center px-4">
        <div className="pointer-events-auto flex items-center gap-1 rounded-full border border-neutral-700 bg-neutral-900/90 p-1 shadow-lg shadow-black/40 backdrop-blur">
          <FilterTab
            active={filter === "all"}
            onClick={() => setFilter("all")}
            icon={<ListFilter className="size-4" />}
            label="Todos"
            count={items.length}
          />
          <FilterTab
            active={filter === "today"}
            onClick={() => setFilter("today")}
            disabled={todayCount === 0}
            icon={<CalendarDays className="size-4" />}
            label="Hoy"
            count={todayCount}
          />
        </div>
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

function FilterTab({
  active,
  onClick,
  disabled,
  icon,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  disabled?: boolean;
  icon: React.ReactNode;
  label: string;
  count: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      className={cn(
        "flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition-colors",
        active
          ? "bg-emerald-500 text-emerald-950"
          : "text-neutral-300 hover:bg-neutral-800 active:bg-neutral-800",
        disabled && !active ? "cursor-not-allowed opacity-40 hover:bg-transparent" : "",
      )}
    >
      {icon}
      {label}
      <span
        className={cn(
          "rounded-full px-1.5 text-xs font-medium tabular-nums",
          active ? "bg-emerald-950/20 text-emerald-950" : "bg-neutral-800 text-neutral-400",
        )}
      >
        {count}
      </span>
    </button>
  );
}

function MatchPicker({
  item,
  pick,
  onPick,
  onClear,
}: {
  item: PlayItem;
  pick: Outcome | null;
  onPick: (outcome: Outcome) => void;
  onClear: () => void;
}) {
  const time = new Date(item.kickoff).toLocaleTimeString("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
  });

  // Tapping the already-selected outcome toggles it off; the header button is
  // the discoverable way to do the same. Both are no-ops once the match locks.
  const select = (outcome: Outcome) => (pick === outcome ? onClear() : onPick(outcome));
  const canClear = pick != null && !item.locked;

  return (
    <section className="rounded-3xl border border-neutral-800 bg-neutral-900 p-3">
      <header className="mb-2 flex items-center justify-between gap-2 px-1 text-xs text-neutral-400">
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
          onSelect={() => select("HOME")}
        />
        <OutcomeRow
          label="Empate"
          tag="X"
          draw
          selected={pick === "DRAW"}
          disabled={item.locked}
          onSelect={() => select("DRAW")}
        />
        <OutcomeRow
          crest={item.away.crest}
          label={item.away.name}
          tag="Visitante"
          selected={pick === "AWAY"}
          disabled={item.locked}
          onSelect={() => select("AWAY")}
        />
      </div>
      {canClear ? (
        <button
          type="button"
          onClick={onClear}
          className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-2xl border border-neutral-800 py-2.5 text-sm font-medium text-neutral-400 transition-colors hover:border-neutral-700 hover:text-neutral-100 active:bg-neutral-800"
        >
          <X className="size-4" />
          Quitar predicción
        </button>
      ) : null}
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

// Roughly how long a match stays "live" after kickoff. Used to decide whether
// a match that has already started should still be the scroll target.
const LIVE_WINDOW_MS = 2.5 * 60 * 60 * 1000;

// The match to scroll to: the first one still live or yet to start (items are
// kickoff-ordered). If every match has finished, target the most recent one.
// Returns null when there's nothing worth jumping to (only one match, or the
// first match is already the target and sits at the top of the list).
function findCurrentMatchId(items: PlayItem[]): string | null {
  if (items.length <= 1) return null;

  const now = Date.now();
  const index = items.findIndex(
    (item) => new Date(item.kickoff).getTime() + LIVE_WINDOW_MS > now,
  );
  const target = index === -1 ? items.length - 1 : index;

  // The first match is already in view on load — no need to scroll.
  return target === 0 ? null : items[target].roundMatchId;
}

// A YYYY-MM-DD key for a date in the viewer's local timezone. Kickoffs arrive
// as UTC ISO strings; keying on the local day (not the UTC day) is what keeps
// the "Hoy" filter and the date headers in agreement — a late-night kickoff can
// fall on a different UTC day than the one the user actually sees it under.
// Both isToday and groupByDate route through here so they can never drift.
function localDayKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// True when the match kicks off on the local calendar day we're currently in.
function isToday(kickoff: PlayItem["kickoff"]): boolean {
  return localDayKey(new Date(kickoff)) === localDayKey(new Date());
}

function groupByDate(items: PlayItem[]) {
  const map = new Map<string, { key: string; label: string; items: PlayItem[] }>();
  for (const item of items) {
    const date = new Date(item.kickoff);
    const key = localDayKey(date);
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

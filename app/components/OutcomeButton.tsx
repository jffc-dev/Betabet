import type { ReactNode } from "react";

interface OutcomeButtonProps {
  label: string;
  /** Short bet-type tag shown on the right, e.g. "Gana A". */
  tag?: string;
  /** Leading visual, e.g. a team crest. */
  leading?: ReactNode;
  selected: boolean;
  onSelect: () => void;
}

export default function OutcomeButton({
  label,
  tag,
  leading,
  selected,
  onSelect,
}: OutcomeButtonProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={[
        "flex min-h-16 w-full items-center gap-3 rounded-2xl px-4 py-3 text-left",
        "text-lg font-semibold transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400",
        selected
          ? "bg-emerald-500 text-emerald-950 ring-2 ring-emerald-300"
          : "border border-neutral-700 bg-neutral-800/60 text-neutral-100 active:bg-neutral-700",
      ].join(" ")}
    >
      {leading}
      <span className="flex-1">{label}</span>
      {tag ? (
        <span
          className={[
            "rounded-md px-2 py-1 text-xs font-medium",
            selected
              ? "bg-emerald-900/15 text-emerald-900"
              : "bg-neutral-700/60 text-neutral-300",
          ].join(" ")}
        >
          {tag}
        </span>
      ) : null}
    </button>
  );
}

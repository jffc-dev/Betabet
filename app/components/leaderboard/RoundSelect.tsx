"use client";

import { useRouter } from "next/navigation";

export function RoundSelect({
  slug,
  rounds,
  current,
}: {
  slug: string;
  rounds: Array<{ id: string; title: string }>;
  current: string | null;
}) {
  const router = useRouter();

  return (
    <select
      aria-label="Elegir ronda"
      value={current ?? ""}
      onChange={(e) => {
        const value = e.target.value;
        router.push(
          value
            ? `/groups/${slug}/leaderboard?round=${value}`
            : `/groups/${slug}/leaderboard`,
        );
      }}
      className="h-10 w-full rounded-xl border border-neutral-700 bg-neutral-900 px-3 text-sm text-neutral-200 focus-visible:border-emerald-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/30"
    >
      <option value="">General</option>
      {rounds.map((round) => (
        <option key={round.id} value={round.id}>
          {round.title}
        </option>
      ))}
    </select>
  );
}

import type { ReactNode } from "react";
import { cn } from "../../lib/utils";
import type { LeaderboardRow } from "../../lib/data/leaderboard";

export function LeaderboardTable({
  rows,
  highlightMemberId,
}: {
  rows: LeaderboardRow[];
  highlightMemberId?: string | null;
}) {
  if (rows.length === 0) return <Empty>Aún no hay miembros en este grupo.</Empty>;
  if (!rows.some((r) => r.played > 0)) return <Empty>Aún no hay resultados.</Empty>;

  return (
    <div className="overflow-hidden rounded-2xl border border-neutral-800">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-neutral-800 text-xs text-neutral-500">
            <th className="w-12 px-3 py-2 text-left font-medium">#</th>
            <th className="px-1 py-2 text-left font-medium">Jugador</th>
            <th className="w-16 px-2 py-2 text-right font-medium">Aciertos</th>
            <th className="w-12 px-3 py-2 text-right font-medium">Pts</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const isMe = row.memberId === highlightMemberId;
            return (
              <tr
                key={row.memberId}
                className={cn(
                  "border-b border-neutral-900 last:border-0",
                  isMe && "bg-emerald-500/10",
                )}
              >
                <td className="px-3 py-2.5">
                  <RankBadge rank={row.rank} />
                </td>
                <td className="px-1 py-2.5">
                  <span className="font-medium text-neutral-100">{row.name}</span>
                  {isMe ? (
                    <span className="ml-1.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-400">
                      Tú
                    </span>
                  ) : null}
                </td>
                <td className="px-2 py-2.5 text-right text-neutral-400">{row.correct}</td>
                <td className="px-3 py-2.5 text-right font-bold text-emerald-400">{row.points}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function RankBadge({ rank }: { rank: number }) {
  const medal =
    rank === 1
      ? "bg-amber-400/20 text-amber-300"
      : rank === 2
        ? "bg-neutral-400/20 text-neutral-100"
        : rank === 3
          ? "bg-orange-500/20 text-orange-300"
          : "text-neutral-500";
  return (
    <span
      className={cn(
        "inline-flex size-6 items-center justify-center rounded-full text-xs font-bold",
        medal,
      )}
    >
      {rank}
    </span>
  );
}

function Empty({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-900 px-4 py-10 text-center text-sm text-neutral-500">
      {children}
    </div>
  );
}

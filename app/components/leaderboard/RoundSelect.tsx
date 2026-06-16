"use client";

import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

// Radix Select reserves the empty string, so the "General" (all rounds) option
// uses a sentinel value mapped back to the base leaderboard URL.
const GENERAL = "__general__";

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
    <Select
      value={current ?? GENERAL}
      onValueChange={(value) => {
        router.push(
          value === GENERAL
            ? `/groups/${slug}/leaderboard`
            : `/groups/${slug}/leaderboard?round=${value}`,
        );
      }}
    >
      <SelectTrigger aria-label="Elegir ronda" className="text-sm">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={GENERAL}>General</SelectItem>
        {rounds.map((round) => (
          <SelectItem key={round.id} value={round.id}>
            {round.title}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

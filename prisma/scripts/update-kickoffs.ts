import "dotenv/config";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { prisma } from "../../app/lib/prisma";

// Updates Match.kickoff in place from the corrected fixtures JSON, WITHOUT
// re-running the full seed. Matches are located by their seed key
// (provider + externalId), so no rows are created or deleted — only kickoff
// is corrected on matches that already exist.
//
// Usage:
//   pnpm tsx prisma/scripts/update-kickoffs.ts            # dry run (default)
//   pnpm tsx prisma/scripts/update-kickoffs.ts --apply    # write changes

const PROVIDER = "fifa-wc-2026";
const APPLY = process.argv.includes("--apply");

interface Fixture {
  no: number;
  home: string;
  away: string;
  kickoffUtc: string;
}

const dataUrl = new URL("../seeds/worldcup2026.fixtures.json", import.meta.url);
const { fixtures } = JSON.parse(readFileSync(fileURLToPath(dataUrl), "utf8")) as {
  fixtures: Fixture[];
};

const limaTime = (d: Date) =>
  d.toLocaleString("es-PE", {
    timeZone: "America/Lima",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

async function main() {
  console.log(
    `${APPLY ? "APPLYING" : "DRY RUN (pass --apply to write)"} — ${fixtures.length} fixtures\n`,
  );

  let changed = 0;
  let unchanged = 0;
  const missing: number[] = [];

  for (const f of fixtures) {
    const externalId = String(f.no);
    const match = await prisma.match.findUnique({
      where: { provider_externalId: { provider: PROVIDER, externalId } },
      select: { id: true, kickoff: true },
    });

    if (!match) {
      missing.push(f.no);
      continue;
    }

    const next = new Date(f.kickoffUtc);
    if (match.kickoff.getTime() === next.getTime()) {
      unchanged++;
      continue;
    }

    changed++;
    console.log(
      `#${String(f.no).padStart(2)} ${`${f.home}-${f.away}`.padEnd(9)} ` +
        `${limaTime(match.kickoff)}  ->  ${limaTime(next)}  (Lima)`,
    );

    if (APPLY) {
      await prisma.match.update({
        where: { id: match.id },
        data: { kickoff: next },
      });
    }
  }

  console.log(
    `\n${APPLY ? "Updated" : "Would update"}: ${changed}   Unchanged: ${unchanged}` +
      (missing.length ? `   Missing (not seeded): ${missing.join(", ")}` : ""),
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());

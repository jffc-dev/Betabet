import type { PrismaClient } from "../../app/generated/prisma/client";

// FIFA World Cup 2026 group stage — real fixtures (post-draw, post-playoffs).
// Source: official schedule cross-checked against FIFA/ESPN (June 2026).
// Match #1 = Mexico vs South Africa, 2026-06-11, Estadio Azteca (Mexico City).

// 48 teams by FIFA 3-letter code.
const TEAMS: Record<string, string> = {
  MEX: "Mexico", RSA: "South Africa", KOR: "South Korea", CZE: "Czechia",
  CAN: "Canada", BIH: "Bosnia and Herzegovina", QAT: "Qatar", SUI: "Switzerland",
  BRA: "Brazil", MAR: "Morocco", HAI: "Haiti", SCO: "Scotland",
  USA: "United States", PAR: "Paraguay", AUS: "Australia", TUR: "Türkiye",
  GER: "Germany", CUW: "Curaçao", CIV: "Ivory Coast", ECU: "Ecuador",
  NED: "Netherlands", JPN: "Japan", SWE: "Sweden", TUN: "Tunisia",
  BEL: "Belgium", EGY: "Egypt", IRN: "Iran", NZL: "New Zealand",
  ESP: "Spain", CPV: "Cape Verde", KSA: "Saudi Arabia", URU: "Uruguay",
  FRA: "France", SEN: "Senegal", IRQ: "Iraq", NOR: "Norway",
  ARG: "Argentina", ALG: "Algeria", AUT: "Austria", JOR: "Jordan",
  POR: "Portugal", COD: "DR Congo", UZB: "Uzbekistan", COL: "Colombia",
  ENG: "England", CRO: "Croatia", GHA: "Ghana", PAN: "Panama",
};

// FIFA 3-letter code -> ISO 3166-1 alpha-2 (lowercase) for flag images.
// England/Scotland aren't ISO countries; flagcdn serves them as gb-eng / gb-sct.
const FLAG_ISO: Record<string, string> = {
  MEX: "mx", RSA: "za", KOR: "kr", CZE: "cz",
  CAN: "ca", BIH: "ba", QAT: "qa", SUI: "ch",
  BRA: "br", MAR: "ma", HAI: "ht", SCO: "gb-sct",
  USA: "us", PAR: "py", AUS: "au", TUR: "tr",
  GER: "de", CUW: "cw", CIV: "ci", ECU: "ec",
  NED: "nl", JPN: "jp", SWE: "se", TUN: "tn",
  BEL: "be", EGY: "eg", IRN: "ir", NZL: "nz",
  ESP: "es", CPV: "cv", KSA: "sa", URU: "uy",
  FRA: "fr", SEN: "sn", IRQ: "iq", NOR: "no",
  ARG: "ar", ALG: "dz", AUT: "at", JOR: "jo",
  POR: "pt", COD: "cd", UZB: "uz", COL: "co",
  ENG: "gb-eng", CRO: "hr", GHA: "gh", PAN: "pa",
};

// 80px-wide PNG flag from flagcdn.com (free, no key).
function flagUrl(code: string): string {
  const iso = FLAG_ISO[code];
  if (!iso) throw new Error(`No ISO flag mapping for team code "${code}"`);
  return `https://flagcdn.com/w80/${iso}.png`;
}

// Hours to ADD to a venue's local kickoff time to get UTC (June 2026 / DST).
// US & Canada observe DST; Mexico does not (standard time year-round).
const CITY_UTC_ADD: Record<string, number> = {
  "Mexico City": 6, "Zapopan": 6, "Guadalupe": 6, // Mexico (UTC-6)
  "Toronto": 4, "East Rutherford": 4, "Foxborough": 4, "Philadelphia": 4,
  "Miami Gardens": 4, "Atlanta": 4, // Eastern (UTC-4 EDT)
  "Houston": 5, "Arlington": 5, "Kansas City": 5, // Central (UTC-5 CDT)
  "Inglewood": 7, "Santa Clara": 7, "Seattle": 7, "Vancouver": 7, // Pacific (UTC-7 PDT)
};

interface Fixture {
  no: number;
  group: string; // "A".."L"
  date: string; // local calendar date, YYYY-MM-DD
  time: string; // local kickoff, HH:MM
  city: string;
  home: string; // 3-letter code
  away: string;
}

// prettier-ignore
const FIXTURES: Fixture[] = [
  { no: 1,  group: "A", date: "2026-06-11", time: "13:00", city: "Mexico City",     home: "MEX", away: "RSA" },
  { no: 2,  group: "A", date: "2026-06-11", time: "20:00", city: "Zapopan",         home: "KOR", away: "CZE" },
  { no: 3,  group: "B", date: "2026-06-12", time: "15:00", city: "Toronto",         home: "CAN", away: "BIH" },
  { no: 4,  group: "D", date: "2026-06-12", time: "18:00", city: "Inglewood",       home: "USA", away: "PAR" },
  { no: 5,  group: "B", date: "2026-06-13", time: "12:00", city: "Santa Clara",     home: "QAT", away: "SUI" },
  { no: 6,  group: "C", date: "2026-06-13", time: "18:00", city: "East Rutherford", home: "BRA", away: "MAR" },
  { no: 7,  group: "C", date: "2026-06-13", time: "21:00", city: "Foxborough",      home: "HAI", away: "SCO" },
  { no: 8,  group: "D", date: "2026-06-13", time: "21:00", city: "Vancouver",       home: "AUS", away: "TUR" },
  { no: 9,  group: "E", date: "2026-06-14", time: "12:00", city: "Houston",         home: "GER", away: "CUW" },
  { no: 10, group: "F", date: "2026-06-14", time: "15:00", city: "Arlington",       home: "NED", away: "JPN" },
  { no: 11, group: "E", date: "2026-06-14", time: "19:00", city: "Philadelphia",    home: "CIV", away: "ECU" },
  { no: 12, group: "F", date: "2026-06-14", time: "20:00", city: "Guadalupe",       home: "SWE", away: "TUN" },
  { no: 13, group: "H", date: "2026-06-15", time: "12:00", city: "Atlanta",         home: "ESP", away: "CPV" },
  { no: 14, group: "G", date: "2026-06-15", time: "15:00", city: "Seattle",         home: "BEL", away: "EGY" },
  { no: 15, group: "H", date: "2026-06-15", time: "18:00", city: "Miami Gardens",   home: "KSA", away: "URU" },
  { no: 16, group: "G", date: "2026-06-15", time: "21:00", city: "Inglewood",       home: "IRN", away: "NZL" },
  { no: 17, group: "I", date: "2026-06-16", time: "15:00", city: "East Rutherford", home: "FRA", away: "SEN" },
  { no: 18, group: "I", date: "2026-06-16", time: "18:00", city: "Foxborough",      home: "IRQ", away: "NOR" },
  { no: 19, group: "J", date: "2026-06-16", time: "20:00", city: "Kansas City",     home: "ARG", away: "ALG" },
  { no: 20, group: "J", date: "2026-06-16", time: "21:00", city: "Santa Clara",     home: "AUT", away: "JOR" },
  { no: 21, group: "K", date: "2026-06-17", time: "12:00", city: "Houston",         home: "POR", away: "COD" },
  { no: 22, group: "L", date: "2026-06-17", time: "15:00", city: "Arlington",       home: "ENG", away: "CRO" },
  { no: 23, group: "L", date: "2026-06-17", time: "19:00", city: "Toronto",         home: "GHA", away: "PAN" },
  { no: 24, group: "K", date: "2026-06-17", time: "20:00", city: "Mexico City",     home: "UZB", away: "COL" },
  { no: 25, group: "A", date: "2026-06-18", time: "12:00", city: "Atlanta",         home: "CZE", away: "RSA" },
  { no: 26, group: "B", date: "2026-06-18", time: "15:00", city: "Inglewood",       home: "SUI", away: "BIH" },
  { no: 27, group: "B", date: "2026-06-18", time: "18:00", city: "Vancouver",       home: "CAN", away: "QAT" },
  { no: 28, group: "A", date: "2026-06-18", time: "21:00", city: "Zapopan",         home: "MEX", away: "KOR" },
  { no: 29, group: "D", date: "2026-06-19", time: "15:00", city: "Seattle",         home: "USA", away: "AUS" },
  { no: 30, group: "C", date: "2026-06-19", time: "18:00", city: "Foxborough",      home: "SCO", away: "MAR" },
  { no: 31, group: "C", date: "2026-06-19", time: "21:00", city: "Philadelphia",    home: "BRA", away: "HAI" },
  { no: 32, group: "D", date: "2026-06-19", time: "21:00", city: "Santa Clara",     home: "TUR", away: "PAR" },
  { no: 33, group: "F", date: "2026-06-20", time: "13:00", city: "Houston",         home: "NED", away: "SWE" },
  { no: 34, group: "E", date: "2026-06-20", time: "16:00", city: "Toronto",         home: "GER", away: "CIV" },
  { no: 35, group: "E", date: "2026-06-20", time: "19:00", city: "Kansas City",     home: "ECU", away: "CUW" },
  { no: 36, group: "F", date: "2026-06-20", time: "22:00", city: "Guadalupe",       home: "TUN", away: "JPN" },
  { no: 37, group: "H", date: "2026-06-21", time: "12:00", city: "Atlanta",         home: "ESP", away: "KSA" },
  { no: 38, group: "G", date: "2026-06-21", time: "15:00", city: "Inglewood",       home: "BEL", away: "IRN" },
  { no: 39, group: "H", date: "2026-06-21", time: "18:00", city: "Miami Gardens",   home: "URU", away: "CPV" },
  { no: 40, group: "G", date: "2026-06-21", time: "21:00", city: "Vancouver",       home: "NZL", away: "EGY" },
  { no: 41, group: "J", date: "2026-06-22", time: "13:00", city: "Arlington",       home: "ARG", away: "AUT" },
  { no: 42, group: "I", date: "2026-06-22", time: "17:00", city: "Philadelphia",    home: "FRA", away: "IRQ" },
  { no: 43, group: "I", date: "2026-06-22", time: "20:00", city: "East Rutherford", home: "NOR", away: "SEN" },
  { no: 44, group: "J", date: "2026-06-22", time: "20:00", city: "Santa Clara",     home: "JOR", away: "ALG" },
  { no: 45, group: "K", date: "2026-06-23", time: "13:00", city: "Houston",         home: "POR", away: "UZB" },
  { no: 46, group: "L", date: "2026-06-23", time: "16:00", city: "Foxborough",      home: "ENG", away: "GHA" },
  { no: 47, group: "L", date: "2026-06-23", time: "19:00", city: "Toronto",         home: "PAN", away: "CRO" },
  { no: 48, group: "K", date: "2026-06-23", time: "20:00", city: "Zapopan",         home: "COL", away: "COD" },
  { no: 49, group: "B", date: "2026-06-24", time: "15:00", city: "Vancouver",       home: "SUI", away: "CAN" },
  { no: 50, group: "B", date: "2026-06-24", time: "15:00", city: "Seattle",         home: "BIH", away: "QAT" },
  { no: 51, group: "C", date: "2026-06-24", time: "18:00", city: "Miami Gardens",   home: "SCO", away: "BRA" },
  { no: 52, group: "C", date: "2026-06-24", time: "18:00", city: "Atlanta",         home: "MAR", away: "HAI" },
  { no: 53, group: "A", date: "2026-06-24", time: "21:00", city: "Mexico City",     home: "CZE", away: "MEX" },
  { no: 54, group: "A", date: "2026-06-24", time: "21:00", city: "Guadalupe",       home: "RSA", away: "KOR" },
  { no: 55, group: "E", date: "2026-06-25", time: "16:00", city: "East Rutherford", home: "ECU", away: "GER" },
  { no: 56, group: "E", date: "2026-06-25", time: "16:00", city: "Philadelphia",    home: "CUW", away: "CIV" },
  { no: 57, group: "F", date: "2026-06-25", time: "19:00", city: "Arlington",       home: "JPN", away: "SWE" },
  { no: 58, group: "F", date: "2026-06-25", time: "19:00", city: "Kansas City",     home: "TUN", away: "NED" },
  { no: 59, group: "D", date: "2026-06-25", time: "22:00", city: "Inglewood",       home: "TUR", away: "USA" },
  { no: 60, group: "D", date: "2026-06-25", time: "22:00", city: "Santa Clara",     home: "PAR", away: "AUS" },
  { no: 61, group: "I", date: "2026-06-26", time: "15:00", city: "Foxborough",      home: "NOR", away: "FRA" },
  { no: 62, group: "I", date: "2026-06-26", time: "15:00", city: "Toronto",         home: "SEN", away: "IRQ" },
  { no: 63, group: "H", date: "2026-06-26", time: "20:00", city: "Houston",         home: "CPV", away: "KSA" },
  { no: 64, group: "H", date: "2026-06-26", time: "20:00", city: "Zapopan",         home: "URU", away: "ESP" },
  { no: 65, group: "G", date: "2026-06-26", time: "23:00", city: "Seattle",         home: "EGY", away: "IRN" },
  { no: 66, group: "G", date: "2026-06-26", time: "23:00", city: "Vancouver",       home: "NZL", away: "BEL" },
  { no: 67, group: "L", date: "2026-06-27", time: "17:00", city: "East Rutherford", home: "PAN", away: "ENG" },
  { no: 68, group: "L", date: "2026-06-27", time: "17:00", city: "Philadelphia",    home: "CRO", away: "GHA" },
  { no: 69, group: "K", date: "2026-06-27", time: "19:30", city: "Miami Gardens",   home: "COL", away: "POR" },
  { no: 70, group: "K", date: "2026-06-27", time: "19:30", city: "Atlanta",         home: "COD", away: "UZB" },
  { no: 71, group: "J", date: "2026-06-27", time: "22:00", city: "Kansas City",     home: "ALG", away: "AUT" },
  { no: 72, group: "J", date: "2026-06-27", time: "22:00", city: "Arlington",       home: "JOR", away: "ARG" },
];

const PROVIDER = "fifa-wc-2026";

function kickoffUtc(f: Fixture): Date {
  const [y, m, d] = f.date.split("-").map(Number);
  const [hh, mm] = f.time.split(":").map(Number);
  const add = CITY_UTC_ADD[f.city];
  if (add === undefined) throw new Error(`Unknown venue offset for "${f.city}"`);
  return new Date(Date.UTC(y, m - 1, d, hh + add, mm));
}

// Matches 1-24 = matchday 1, 25-48 = matchday 2, 49-72 = matchday 3.
const matchdayOf = (no: number) => (no <= 24 ? 1 : no <= 48 ? 2 : 3);

export interface WorldCupSeedResult {
  templateId: string;
  teams: number;
  matches: number;
  groups: number;
}

/** Idempotently seed the WC2026 group-stage template, teams and matches. */
export async function seedWorldCup2026(client: PrismaClient): Promise<WorldCupSeedResult> {
  const teamIdByCode = new Map<string, string>();
  for (const [code, name] of Object.entries(TEAMS)) {
    const team = await client.team.upsert({
      where: { provider_externalId: { provider: "fifa", externalId: code } },
      update: { name, crestUrl: flagUrl(code) },
      create: { name, shortName: code, crestUrl: flagUrl(code), provider: "fifa", externalId: code },
    });
    teamIdByCode.set(code, team.id);
  }

  const template = await client.template.upsert({
    where: { provider_externalId: { provider: PROVIDER, externalId: "group-stage" } },
    update: {},
    create: {
      name: "FIFA World Cup 2026 — Group Stage",
      slug: "world-cup-2026-group-stage",
      description: "All 72 group-stage matches across Groups A–L (June 11–27, 2026).",
      kind: "TOURNAMENT",
      season: "2026",
      provider: PROVIDER,
      externalId: "group-stage",
    },
  });

  for (const f of FIXTURES) {
    const homeTeamId = teamIdByCode.get(f.home);
    const awayTeamId = teamIdByCode.get(f.away);
    if (!homeTeamId || !awayTeamId) throw new Error(`Unknown team code in match ${f.no}`);

    const match = await client.match.upsert({
      where: { provider_externalId: { provider: PROVIDER, externalId: String(f.no) } },
      update: { kickoff: kickoffUtc(f), homeTeamId, awayTeamId },
      create: {
        homeTeamId,
        awayTeamId,
        kickoff: kickoffUtc(f),
        competition: "FIFA World Cup 2026",
        provider: PROVIDER,
        externalId: String(f.no),
      },
    });

    await client.templateMatch.upsert({
      where: { templateId_matchId: { templateId: template.id, matchId: match.id } },
      update: { groupName: `Group ${f.group}`, matchday: matchdayOf(f.no), position: f.no },
      create: {
        templateId: template.id,
        matchId: match.id,
        stage: "Group Stage",
        groupName: `Group ${f.group}`,
        matchday: matchdayOf(f.no),
        position: f.no,
        points: 1,
      },
    });
  }

  return {
    templateId: template.id,
    teams: Object.keys(TEAMS).length,
    matches: FIXTURES.length,
    groups: new Set(FIXTURES.map((f) => f.group)).size,
  };
}

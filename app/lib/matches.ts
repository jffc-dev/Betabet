import type { Match } from "./types";

/**
 * Hardcoded sample matches for the first frontend version.
 * Replace with real data fetching later without touching the components.
 */
export const matches: Match[] = [
  {
    id: "1",
    league: "Premier League",
    kickoff: "2026-06-13T19:00:00Z",
    home: { name: "Arsenal", shortName: "ARS", crestColor: "#EF0107" },
    away: { name: "Liverpool", shortName: "LIV", crestColor: "#00B2A9" },
  },
  {
    id: "2",
    league: "LaLiga",
    kickoff: "2026-06-14T19:00:00Z",
    home: { name: "Real Madrid", shortName: "RMA", crestColor: "#00529F" },
    away: { name: "Barcelona", shortName: "BAR", crestColor: "#A50044" },
  },
  {
    id: "3",
    league: "Bundesliga",
    kickoff: "2026-06-14T16:30:00Z",
    home: { name: "Bayern München", shortName: "BAY", crestColor: "#DC052D" },
    away: { name: "Borussia Dortmund", shortName: "BVB", crestColor: "#1A1A1A" },
  },
  {
    id: "4",
    league: "Ligue 1",
    kickoff: "2026-06-15T18:45:00Z",
    home: { name: "Paris Saint-Germain", shortName: "PSG", crestColor: "#004170" },
    away: { name: "Olympique de Marseille", shortName: "OM", crestColor: "#2FAEE0" },
  },
  {
    id: "5",
    league: "Serie A",
    kickoff: "2026-06-15T20:45:00Z",
    home: { name: "Inter", shortName: "INT", crestColor: "#0068A8" },
    away: { name: "Juventus", shortName: "JUV", crestColor: "#1A1A1A" },
  },
];

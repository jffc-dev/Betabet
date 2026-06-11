export type Outcome = "HOME" | "DRAW" | "AWAY";

export interface Team {
  name: string;
  shortName: string;
  /** Brand color used for the crest badge (until real logo images exist). */
  crestColor: string;
  /** Optional path/URL to a real logo image; falls back to the initials crest. */
  logo?: string;
}

export interface Match {
  id: string;
  league: string;
  /** ISO 8601 kickoff timestamp */
  kickoff: string;
  home: Team;
  away: Team;
}

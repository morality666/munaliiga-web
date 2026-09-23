import { load } from "js-yaml";
import { getObsidianAssetUrl } from "../obsidian/notes.ts";

const teamFiles = import.meta.glob<string>(
  ["../../notes/teams/*.md", "!../../notes/teams/README.md"],
  {
    eager: true,
    import: "default",
    query: "?raw",
  },
);

export const TEAM_ROLES = [
  "carry",
  "mid",
  "offlane",
  "soft-support",
  "hard-support",
] as const;

export type TeamRole = (typeof TEAM_ROLES)[number];

export type TeamPlayer = {
  name: string;
  role: TeamRole | null;
};

export type Team = {
  aliases: string[];
  captain: string;
  coach: string;
  color: string;
  logoUrl: string | null;
  name: string;
  players: TeamPlayer[];
  season: number | null;
  slug: string;
  tag: string;
};

const DEFAULT_COLOR = "#a95747";

/** Settings sit between the opening and closing `---` lines. */
const FENCE = /^---[ \t]*\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/;

const slugFor = (path: string) =>
  path.replace(/\\/g, "/").split("/").at(-1)?.replace(/\.md$/, "") ?? "team";

const str = (value: unknown) => (typeof value === "string" ? value.trim() : "");

const isRole = (value: string): value is TeamRole =>
  (TEAM_ROLES as readonly string[]).includes(value);

/**
 * Positions are not locked in this league, so a role is optional and the list
 * keeps the order it was written in rather than being sorted into lanes.
 */
const playersFrom = (value: unknown): TeamPlayer[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter(
      (entry): entry is Record<string, unknown> =>
        typeof entry === "object" && entry !== null && !Array.isArray(entry),
    )
    .map((entry) => {
      const role = str(entry.role).toLowerCase();

      return { name: str(entry.name), role: isRole(role) ? role : null };
    });
};

/**
 * Reads one file from `notes/teams/`, or returns null when it cannot be read.
 *
 * This module is pulled in by the top bar, so it loads on every page: throwing
 * here would blank the whole site over one mistyped team file. A broken file is
 * skipped instead, which drops that team from the list and says so in the
 * console.
 */
const toTeam = (path: string, source: string): Team | null => {
  const slug = slugFor(path);
  const fenced = FENCE.exec(source.replace(/^\uFEFF/, ""));

  if (!fenced) {
    console.warn(
      `${path} was skipped: no settings found. The file must start with a line containing only --- and the settings must end with another --- line.`,
    );

    return null;
  }

  let parsed: unknown;

  try {
    parsed = load(fenced[1]);
  } catch (error) {
    console.warn(
      `${path} was skipped: its settings could not be read.`,
      error,
    );

    return null;
  }

  const data = (
    typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)
      ? parsed
      : {}
  ) as Record<string, unknown>;

  const logo = str(data.logo);
  const season = typeof data.season === "number" ? data.season : Number.NaN;

  return {
    aliases: Array.isArray(data.aliases)
      ? data.aliases.map(str).filter(Boolean)
      : [],
    captain: str(data.captain),
    coach: str(data.coach),
    color: str(data.color) || DEFAULT_COLOR,
    logoUrl: logo ? getObsidianAssetUrl(logo) : null,
    name: str(data.name) || slug,
    players: playersFrom(data.players),
    season: Number.isInteger(season) ? season : null,
    slug,
    tag: str(data.tag).toUpperCase() || slug.slice(0, 3).toUpperCase(),
  };
};

export const TEAMS: Team[] = Object.entries(teamFiles)
  .map(([path, source]) => toTeam(path, source))
  .filter((team): team is Team => team !== null)
  .sort((first, second) => first.name.localeCompare(second.name, "fi"));

export const hasTeam = (slug: string) =>
  TEAMS.some((team) => team.slug === slug);

export const getTeam = (slug: string) =>
  TEAMS.find((team) => team.slug === slug);

/**
 * Valve reports a team by whatever name the ticket carries, so a played match
 * is matched back to a team through its `aliases` before falling back to the
 * raw string the API gave us.
 */
export const teamByReportedName = (reportedName: string) => {
  const needle = reportedName.trim().toLowerCase();

  if (!needle) {
    return undefined;
  }

  return TEAMS.find(
    (team) =>
      team.name.toLowerCase() === needle ||
      team.aliases.some((alias) => alias.toLowerCase() === needle),
  );
};

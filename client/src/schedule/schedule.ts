import Papa from "papaparse";
import { LEAGUE_MATCH_DATA, type LeagueMatch } from "../matches/matches.ts";
import { type Team, teamByReportedName, getTeam } from "../teams/teams.ts";

const fixtureFiles = import.meta.glob<string>(
  ["../../notes/schedule/season-*.csv"],
  { eager: true, import: "default", query: "?raw" },
);

const weekFiles = import.meta.glob<string>(["../../notes/schedule/weeks.csv"], {
  eager: true,
  import: "default",
  query: "?raw",
});

export const MATCH_STATUSES = [
  "scheduled",
  "live",
  "postponed",
  "cancelled",
] as const;

export type MatchStatus = (typeof MATCH_STATUSES)[number];

export type TeamRef = {
  name: string;
  slug: string;
  team: Team | undefined;
};

export type MatchResult = {
  awayScore: number;
  games: LeagueMatch[];
  homeScore: number;
  homeWon: boolean | null;
};

export type ScheduledMatch = {
  away: TeamRef;
  bestOf: number | null;
  casters: string[];
  date: string;
  home: TeamRef;
  /** False when only the week is known, which is the normal case until the teams agree a time. */
  isDated: boolean;
  isPast: boolean;
  key: string;
  note: string;
  result: MatchResult | null;
  status: MatchStatus;
  time: string;
  week: string;
};

export type ScheduleWeek = {
  bye: TeamRef[];
  ends: string;
  isCurrent: boolean;
  isPast: boolean;
  matches: ScheduledMatch[];
  starts: string;
  week: string;
};

const TIME_ZONE = "Europe/Helsinki";

/**
 * "now" and "today" as Helsinki wall clock, in the same shape the CSV uses.
 * Comparing those as strings avoids turning stored local times into instants,
 * and so avoids getting the October clock change wrong.
 */
const helsinkiNow = () => {
  const stamp = new Intl.DateTimeFormat("sv-SE", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "2-digit",
    timeZone: TIME_ZONE,
    year: "numeric",
  })
    .format(new Date())
    .replace(",", "");

  return { now: stamp, today: stamp.slice(0, 10) };
};

const { now: NOW, today: TODAY } = helsinkiNow();

const cell = (row: Record<string, string | undefined>, key: string) =>
  (row[key] ?? "").trim();

const semicolonList = (value: string) =>
  value
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean);

const isStatus = (value: string): value is MatchStatus =>
  (MATCH_STATUSES as readonly string[]).includes(value);

const teamRef = (slug: string): TeamRef => {
  const team = getTeam(slug);

  return { name: team?.name ?? slug, slug, team };
};

const readCsv = (source: string, path: string) => {
  const parsed = Papa.parse<Record<string, string | undefined>>(source, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim(),
  });

  for (const error of parsed.errors) {
    console.warn(
      `${path}: row ${(error.row ?? 0) + 2} could not be read — ${error.message}`,
    );
  }

  return parsed.data;
};

const resultFor = (
  matchIds: number[],
  home: TeamRef,
  away: TeamRef,
): MatchResult | null => {
  if (matchIds.length === 0) {
    return null;
  }

  const games = LEAGUE_MATCH_DATA.matches.filter((match) =>
    matchIds.includes(match.matchId),
  );

  if (games.length === 0) {
    return null;
  }

  let homeScore = 0;
  let awayScore = 0;

  for (const game of games) {
    const winner = teamByReportedName(
      game.radiantWin ? game.radiantName : game.direName,
    );

    if (winner && winner.slug === home.slug) {
      homeScore += 1;
    } else if (winner && winner.slug === away.slug) {
      awayScore += 1;
    }
  }

  return {
    awayScore,
    games,
    homeScore,
    homeWon: homeScore === awayScore ? null : homeScore > awayScore,
  };
};

const WEEKS: Map<string, { bye: TeamRef[]; ends: string; starts: string }> =
  new Map(
    Object.entries(weekFiles).flatMap(([path, source]) =>
      readCsv(source, path).flatMap((row) => {
        const week = cell(row, "week");

        return week
          ? ([
              [
                week,
                {
                  bye: semicolonList(cell(row, "bye")).map(teamRef),
                  ends: cell(row, "ends"),
                  starts: cell(row, "starts"),
                },
              ],
            ] as [string, { bye: TeamRef[]; ends: string; starts: string }][])
          : [];
      }),
    ),
  );

/**
 * A fixture whose time is not agreed yet is past once its week has ended —
 * there is no kickoff to compare against, only the window it belonged to.
 */
const toMatch = (
  row: Record<string, string | undefined>,
): ScheduledMatch | null => {
  const home = cell(row, "home");
  const away = cell(row, "away");

  if (!home || !away) {
    return null;
  }

  const week = cell(row, "week");
  const date = cell(row, "date");
  const time = cell(row, "time");
  const isDated = Boolean(date);
  const status = cell(row, "status").toLowerCase();
  const bestOf = Number.parseInt(cell(row, "bestOf"), 10);
  const homeRef = teamRef(home);
  const awayRef = teamRef(away);
  const matchIds = semicolonList(cell(row, "matchIds"))
    .map((id) => Number.parseInt(id, 10))
    .filter((id) => Number.isFinite(id));
  const weekEnd = WEEKS.get(week)?.ends ?? "";

  return {
    away: awayRef,
    bestOf: Number.isFinite(bestOf) ? bestOf : null,
    casters: semicolonList(cell(row, "casters")),
    date,
    home: homeRef,
    isDated,
    isPast: isDated
      ? `${date} ${time || "23:59"}` < NOW
      : Boolean(weekEnd) && weekEnd < TODAY,
    key: `${week}-${home}-${away}-${date}`,
    note: cell(row, "note"),
    result: resultFor(matchIds, homeRef, awayRef),
    status: isStatus(status) ? status : "scheduled",
    time,
    week,
  };
};

const ALL_MATCHES: ScheduledMatch[] = Object.entries(fixtureFiles).flatMap(
  ([path, source]) =>
    readCsv(source, path)
      .map(toMatch)
      .filter((match): match is ScheduledMatch => match !== null),
);

/** Dated fixtures first in time order, then the ones still being agreed. */
const byKickoff = (first: ScheduledMatch, second: ScheduledMatch) => {
  if (first.isDated !== second.isDated) {
    return first.isDated ? -1 : 1;
  }

  return `${first.date} ${first.time}`.localeCompare(
    `${second.date} ${second.time}`,
  );
};

const weekNumber = (week: string) => {
  const parsed = Number.parseInt(week, 10);

  return Number.isFinite(parsed) ? parsed : Number.MAX_SAFE_INTEGER;
};

const buildWeek = (week: string): ScheduleWeek => {
  const meta = WEEKS.get(week);
  const matches = ALL_MATCHES.filter((match) => match.week === week).sort(
    byKickoff,
  );
  const ends = meta?.ends ?? "";
  const starts = meta?.starts ?? "";

  return {
    bye: meta?.bye ?? [],
    ends,
    isCurrent: Boolean(starts && ends) && starts <= TODAY && TODAY <= ends,
    isPast: ends ? ends < TODAY : matches.every((match) => match.isPast),
    matches,
    starts,
    week,
  };
};

/**
 * Current and upcoming weeks in playing order, then finished weeks newest
 * first — so the week being played sits at the top of the page.
 */
export const SCHEDULE_WEEKS: ScheduleWeek[] = [
  ...new Set([...WEEKS.keys(), ...ALL_MATCHES.map((match) => match.week)]),
]
  .map(buildWeek)
  .sort((first, second) => {
    if (first.isPast !== second.isPast) {
      return first.isPast ? 1 : -1;
    }

    const order = weekNumber(first.week) - weekNumber(second.week);

    return first.isPast ? -order : order;
  });

export const SCHEDULE = [...ALL_MATCHES].sort(byKickoff);

export const UPCOMING = SCHEDULE_WEEKS.filter((week) => !week.isPast)
  .flatMap((week) => week.matches)
  .filter(
    (match) =>
      match.status !== "cancelled" && (!match.isPast || match.status === "live"),
  )
  .sort((first, second) => {
    if ((first.status === "live") !== (second.status === "live")) {
      return first.status === "live" ? -1 : 1;
    }

    return byKickoff(first, second);
  });

export const CURRENT_WEEK = SCHEDULE_WEEKS.find((week) => week.isCurrent);

export const formatDay = (date: string, language: string) => {
  const [year, month, day] = date.split("-").map(Number);

  if (!year || !month || !day) {
    return date;
  }

  return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString(
    language.startsWith("fi") ? "fi" : "en-GB",
    { day: "numeric", month: "numeric", timeZone: "UTC", weekday: "short" },
  );
};

const shortDay = (date: string, language: string) => {
  const [year, month, day] = date.split("-").map(Number);

  if (!year || !month || !day) {
    return date;
  }

  return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString(
    language.startsWith("fi") ? "fi" : "en-GB",
    { day: "numeric", month: "numeric", timeZone: "UTC" },
  );
};

export const formatWeekSpan = (week: ScheduleWeek, language: string) =>
  week.starts && week.ends
    ? `${shortDay(week.starts, language)} – ${shortDay(week.ends, language)}`
    : "";

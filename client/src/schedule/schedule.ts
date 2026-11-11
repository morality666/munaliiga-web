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
  /** True once `matchIds` is filled in. Neither the kickoff nor the week ending makes a match played. */
  isPlayed: boolean;
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
  matches: ScheduledMatch[];
  starts: string;
  week: string;
};

const TIME_ZONE = "Europe/Helsinki";

const helsinkiFormat = new Intl.DateTimeFormat("sv-SE", {
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  month: "2-digit",
  timeZone: TIME_ZONE,
  year: "numeric",
});

/**
 * A moment as Helsinki wall clock, in the same shape the CSV uses. Comparing
 * those as strings avoids turning stored local times into instants, and so
 * avoids getting the October clock change wrong.
 */
const helsinkiClock = (moment: number) =>
  helsinkiFormat.format(new Date(moment)).replace(",", "");

const TODAY = helsinkiClock(Date.now()).slice(0, 10);

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

  return {
    away: awayRef,
    bestOf: Number.isFinite(bestOf) ? bestOf : null,
    casters: semicolonList(cell(row, "casters")),
    date,
    home: homeRef,
    isDated,
    isPlayed: matchIds.length > 0,
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

const weekNumber = (week: string) => {
  const parsed = Number.parseInt(week, 10);

  return Number.isFinite(parsed) ? parsed : Number.MAX_SAFE_INTEGER;
};

/**
 * Dated fixtures first in time order, then the ones still being agreed, the
 * earliest week first.
 */
const byKickoff = (first: ScheduledMatch, second: ScheduledMatch) => {
  if (first.isDated !== second.isDated) {
    return first.isDated ? -1 : 1;
  }

  if (!first.isDated) {
    return weekNumber(first.week) - weekNumber(second.week);
  }

  return `${first.date} ${first.time}`.localeCompare(
    `${second.date} ${second.time}`,
  );
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
    matches,
    starts,
    week,
  };
};

/** Every week, in week-number order. */
export const SCHEDULE_WEEKS: ScheduleWeek[] = [
  ...new Set([...WEEKS.keys(), ...ALL_MATCHES.map((match) => match.week)]),
]
  .map(buildWeek)
  .sort((first, second) => weekNumber(first.week) - weekNumber(second.week));

export const SCHEDULE = [...ALL_MATCHES].sort(byKickoff);

/**
 * The homepage's next matches: every one not played yet, including those whose
 * kickoff or week has gone by. Postponed and cancelled ones are left to the
 * calendar: a postponed match returns here once its status is emptied.
 */
export const UPCOMING = ALL_MATCHES.filter(
  (match) =>
    match.status === "live" ||
    (match.status === "scheduled" && !match.isPlayed),
).sort((first, second) => {
  if ((first.status === "live") !== (second.status === "live")) {
    return first.status === "live" ? -1 : 1;
  }

  return byKickoff(first, second);
});

export const CURRENT_WEEK = SCHEDULE_WEEKS.find((week) => week.isCurrent);

const MINUTE = 60_000;

/**
 * Casters of the match being played now, for the homepage stream. A match is
 * on air from half an hour before kickoff until an hour per game plus one
 * more after it, and for as long as it is marked live. Read on every call
 * rather than at load, so a page left open moves on to the next match.
 * Shifting now, not the kickoff, keeps the comparison in wall clock.
 */
export const onAirCasters = () => {
  const moment = Date.now();
  const opensBy = helsinkiClock(moment + 30 * MINUTE);
  const isOnAir = (match: ScheduledMatch) => {
    if (match.status === "live") {
      return true;
    }

    if (match.status !== "scheduled" || !match.date || !match.time) {
      return false;
    }

    const kickoff = `${match.date} ${match.time}`;
    const hours = (match.bestOf ?? 2) + 1;

    return (
      kickoff <= opensBy &&
      helsinkiClock(moment - hours * 60 * MINUTE) <= kickoff
    );
  };

  return [
    ...new Set(
      SCHEDULE.filter(isOnAir)
        .sort(
          (first, second) =>
            Number(second.status === "live") - Number(first.status === "live"),
        )
        .flatMap((match) =>
          match.casters.map((caster) => caster.toLowerCase()),
        ),
    ),
  ];
};

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

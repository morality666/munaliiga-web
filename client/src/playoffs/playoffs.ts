import {
  cell,
  fixtureFrom,
  readCsv,
  teamRef,
  type ScheduledMatch,
  type TeamRef,
} from "../schedule/schedule.ts";

const playoffFiles = import.meta.glob<string>(
  ["../../notes/schedule/playoffs.csv"],
  { eager: true, import: "default", query: "?raw" },
);

/**
 * In the order they are played. Each match of a round is fed by two of the
 * round before, in file order: the first two semifinals feed the first final.
 */
export const PLAYOFF_ROUNDS = ["semifinal", "final"] as const;

export type PlayoffRound = (typeof PLAYOFF_ROUNDS)[number];

export type PlayoffMatch = ScheduledMatch & {
  /** The match whose winner takes the away place; null in the first round. */
  awayFrom: PlayoffMatch | null;
  /** The match whose winner takes the home place; null in the first round. */
  homeFrom: PlayoffMatch | null;
  /** Counted from 1 within the round, in file order. */
  number: number;
  round: PlayoffRound;
  winner: TeamRef | null;
};

/** A place in the bracket nobody has won yet. */
const OPEN_SIDE: TeamRef = { name: "", slug: "", team: undefined };

export const isOpenSide = (side: TeamRef) => side.slug === "";

const isRound = (value: string): value is PlayoffRound =>
  (PLAYOFF_ROUNDS as readonly string[]).includes(value);

/** Two games of a best of three, three of a best of five. Without a bestOf, any lead. */
const winsNeeded = (bestOf: number | null) =>
  bestOf && bestOf > 0 ? Math.floor(bestOf / 2) + 1 : 1;

const winnerOf = (match: ScheduledMatch): TeamRef | null => {
  const { result } = match;

  if (!result || isOpenSide(match.home) || isOpenSide(match.away)) {
    return null;
  }

  const needed = winsNeeded(match.bestOf);

  if (result.homeScore > result.awayScore && result.homeScore >= needed) {
    return match.home;
  }

  if (result.awayScore > result.homeScore && result.awayScore >= needed) {
    return match.away;
  }

  return null;
};

const rows = Object.entries(playoffFiles).flatMap(([path, source]) =>
  readCsv(source, path),
);

for (const row of rows) {
  const round = cell(row, "round").toLowerCase();

  if (!isRound(round)) {
    console.warn(
      `notes/schedule/playoffs.csv: "${round}" is not a round, so its row is left out. Use one of ${PLAYOFF_ROUNDS.join(", ")}.`,
    );
  }
}

/**
 * Every playoff match, round by round. A place the file leaves empty is taken
 * by the winner of the match feeding it, once that match is decided.
 */
export const PLAYOFF_MATCHES: PlayoffMatch[] = PLAYOFF_ROUNDS.reduce<
  PlayoffMatch[]
>((built, round, roundIndex) => {
  const previous = built.filter(
    (match) => match.round === PLAYOFF_ROUNDS[roundIndex - 1],
  );
  const matches = rows
    .filter((row) => cell(row, "round").toLowerCase() === round)
    .map((row, index): PlayoffMatch => {
      const homeFrom = previous[index * 2] ?? null;
      const awayFrom = previous[index * 2 + 1] ?? null;
      const home = cell(row, "home");
      const away = cell(row, "away");
      const fixture = fixtureFrom(row, {
        away: away ? teamRef(away) : (awayFrom?.winner ?? OPEN_SIDE),
        home: home ? teamRef(home) : (homeFrom?.winner ?? OPEN_SIDE),
        key: `playoffs-${round}-${index + 1}`,
        week: "",
      });

      return {
        ...fixture,
        awayFrom,
        homeFrom,
        number: index + 1,
        round,
        winner: winnerOf(fixture),
      };
    });

  return [...built, ...matches];
}, []);

export const PLAYOFF_FINAL = PLAYOFF_MATCHES.find(
  (match) => match.round === "final",
);

/** The playoff matches of each round that has any, in playing order. */
export const PLAYOFF_ROUND_GROUPS = PLAYOFF_ROUNDS.map((round) => ({
  matches: PLAYOFF_MATCHES.filter((match) => match.round === round),
  round,
})).filter((group) => group.matches.length > 0);

/**
 * The team to show in a place, or null for "winner of …". A place fed by an
 * earlier match stays unnamed while results are hidden, since naming it would
 * give that result away.
 */
export const shownSide = (
  match: PlayoffMatch,
  place: "away" | "home",
  spoilersHidden: boolean,
) => {
  const side = match[place];
  const from = place === "home" ? match.homeFrom : match.awayFrom;

  return isOpenSide(side) || (from && spoilersHidden) ? null : side;
};

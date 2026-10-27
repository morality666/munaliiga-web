import { SCHEDULE, type TeamRef } from "../schedule/schedule.ts";

export type StandingsRow = {
  diff: number;
  lost: number;
  played: number;
  points: number;
  rank: number;
  side: TeamRef;
  won: number;
};

type TeamRecord = Omit<StandingsRow, "rank">;

type Tally = { lost: number; matches: number; side: TeamRef; won: number };

const tallies = new Map<string, Tally>();

const tallyFor = (side: TeamRef) => {
  const existing = tallies.get(side.slug);

  if (existing) {
    return existing;
  }

  const tally = { lost: 0, matches: 0, side, won: 0 };
  tallies.set(side.slug, tally);

  return tally;
};

// Every team with a fixture is listed, including before its first game.
for (const match of SCHEDULE) {
  const home = tallyFor(match.home);
  const away = tallyFor(match.away);
  const { result } = match;

  if (!result) {
    continue;
  }

  home.matches += 1;
  away.matches += 1;
  home.won += result.homeScore;
  home.lost += result.awayScore;
  away.won += result.awayScore;
  away.lost += result.homeScore;

  const unmatched = result.games.length - result.homeScore - result.awayScore;

  if (unmatched > 0) {
    console.warn(
      `Week ${match.week}, ${match.home.name} vs ${match.away.name}: ${unmatched} game(s) left out of the standings because the winner's name matches neither team. Add that name to the team's aliases in notes/teams/.`,
    );
  }
}

/**
 * Played counts matches, so it tells how many opponents a team has faced. The
 * rest counts every game on its own, however the match ended: a point for each
 * game won, so a 2–0 is two points and a 1–1 one point each.
 */
const toRecord = ({ lost, matches, side, won }: Tally): TeamRecord => ({
  diff: won - lost,
  lost,
  played: matches,
  points: won,
  side,
  won,
});

const byName = (first: TeamRecord, second: TeamRecord) =>
  first.side.name.localeCompare(second.side.name, "fi");

const byRecord = (first: TeamRecord, second: TeamRecord) =>
  second.points - first.points || second.diff - first.diff;

/** Games each of the tied teams won in their matches against one another. */
const headToHead = (group: TeamRecord[]) => {
  const slugs = new Set(group.map((record) => record.side.slug));
  const won = new Map<string, number>();

  for (const match of SCHEDULE) {
    if (
      match.result &&
      slugs.has(match.home.slug) &&
      slugs.has(match.away.slug)
    ) {
      won.set(
        match.home.slug,
        (won.get(match.home.slug) ?? 0) + match.result.homeScore,
      );
      won.set(
        match.away.slug,
        (won.get(match.away.slug) ?? 0) + match.result.awayScore,
      );
    }
  }

  return (record: TeamRecord) => won.get(record.side.slug) ?? 0;
};

/**
 * Points, then games won minus games lost, then the games won between the
 * teams still level. Teams level on all three share the place.
 */
const rank = (records: TeamRecord[]) => {
  const sorted = [...records].sort(
    (first, second) => byRecord(first, second) || byName(first, second),
  );
  const rows: StandingsRow[] = [];

  for (let start = 0; start < sorted.length; ) {
    let end = start + 1;

    while (end < sorted.length && byRecord(sorted[start], sorted[end]) === 0) {
      end += 1;
    }

    const group = sorted.slice(start, end);
    const wonAgainstTied = headToHead(group);

    group
      .sort(
        (first, second) =>
          wonAgainstTied(second) - wonAgainstTied(first) ||
          byName(first, second),
      )
      .forEach((record, index) => {
        const sharesPlace =
          index > 0 &&
          wonAgainstTied(group[index - 1]) === wonAgainstTied(record);

        rows.push({
          ...record,
          rank: sharesPlace ? rows[rows.length - 1].rank : start + index + 1,
        });
      });

    start = end;
  }

  return rows;
};

export const STANDINGS = rank([...tallies.values()].map(toRecord));

/** The same teams in name order, for when results are hidden. */
export const STANDINGS_BY_NAME = [...STANDINGS].sort(byName);

/** A team's row once it has played, for its own page. */
export const standingFor = (slug: string) =>
  STANDINGS.find((row) => row.side.slug === slug && row.played > 0);

export const formatDiff = (diff: number) =>
  diff > 0 ? `+${diff}` : diff < 0 ? `−${-diff}` : "0";

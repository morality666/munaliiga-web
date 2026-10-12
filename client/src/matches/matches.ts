import leagueMatchData from "./matches.json";

export type HeroPick = {
  localizedName: string;
  name: string;
};

export type LeagueMatch = {
  direName: string;
  direPicks: HeroPick[];
  direScore: number;
  durationSeconds: number;
  matchId: number;
  radiantName: string;
  radiantPicks: HeroPick[];
  radiantScore: number;
  radiantWin: boolean;
  startTime: number;
};

export type LeagueMatchData = {
  leagueId: number;
  leagueName: string;
  matches: LeagueMatch[];
  updatedAt: string;
};

const RECENT_MATCH_LIMIT = 5;

export const LEAGUE_MATCH_DATA: LeagueMatchData = leagueMatchData;

export const RECENT_MATCHES = [...LEAGUE_MATCH_DATA.matches]
  .sort((first, second) => second.startTime - first.startTime)
  .slice(0, RECENT_MATCH_LIMIT);

/** Finnish time for every viewer, matching the kickoff times on the schedule. */
const TIME_ZONE = "Europe/Helsinki";

export const formatMatchDate = (startTime: number, language: string) => {
  const locale = language.startsWith("fi") ? "fi" : "en-GB";
  const playedAt = new Date(startTime * 1000);

  const date = playedAt.toLocaleDateString(locale, { day: "numeric", month: "short", timeZone: TIME_ZONE, year: "numeric" });
  const time = playedAt.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit", timeZone: TIME_ZONE });

  return `${date}, ${time}`;
};

export const formatMatchDuration = (durationSeconds: number) => {
  const minutes = Math.floor(durationSeconds / 60);
  const seconds = durationSeconds % 60;

  return `${minutes}:${String(seconds).padStart(2, "0")}`;
};

export const formatUpdatedAt = (updatedAt: string, language: string) => {
  const locale = language.startsWith("fi") ? "fi" : "en-GB";
  const generatedAt = new Date(updatedAt);

  return Number.isNaN(generatedAt.valueOf())
    ? ""
    : generatedAt.toLocaleDateString(locale, { day: "numeric", month: "short", year: "numeric" });
};

export const matchUrl = (matchId: number) =>
  `https://www.dotabuff.com/matches/${matchId}`;

export const heroIconUrl = (name: string) =>
  `https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes/${name}.png`;

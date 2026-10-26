#!/usr/bin/env node
/**
 * Refreshes src/matches/matches.json from OpenDota and links each new game to its fixture in
 * notes/schedule/season-<n>.csv, the way an admin would by pasting the id into `matchIds`.
 *
 * Run it with `npm run fetch:matches`. It is deliberately NOT part of `npm run build`, so a
 * build never needs network access. The fetch-matches workflow runs it on a schedule and
 * commits whatever it changed.
 *
 * Every failure path is soft: an unset league id or an API error logs a warning, leaves the
 * committed files untouched and exits 0. Local builds, forks and pull requests must never
 * break because OpenDota is having a bad day.
 *
 * Notes on the API, learned the hard way:
 * - OpenDota needs no key. Its scanner reads the same Valve match feed a Steam Web API key
 *   would, a few minutes behind, and indexes every league game it sees.
 * - /leagues/{id}/matchIds lists amateur tickets (tier "excluded"); /leagues/{id}/matches
 *   returns [] for them.
 * - Lobby games played without the ticket are not listed anywhere, OpenDota or Valve. They
 *   are entered by hand, and this script keeps them because it only adds games.
 * - picks_bans only exists in Captains Mode; All Pick and Turbo lobbies have none. An empty
 *   picks array is valid and the widget renders nothing for it.
 */
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { load } from "js-yaml";
import Papa from "papaparse";
import { loadEnv } from "vite";

const RADIANT_TEAM = 0;
const DIRE_TEAM = 1;

/** The whole season, not just the 5 the widget shows: /schedule looks results up by the
 * matchIds in the season CSV, so a pruned game loses its fixture's score. A season is
 * 21 fixtures x Bo2 = 42 games; the rest is headroom for remakes. ~1.2 kB each in the bundle. */
const MAX_STORED_MATCHES = 60;
/** Match lookups per run, so a first run against a finished season cannot spiral. */
const MAX_DETAIL_FETCHES = 12;
/** OpenDota allows 60 calls a minute without a key. */
const OPENDOTA_CALL_DELAY_MS = 1100;
const REQUEST_ATTEMPTS = 2;
const REQUEST_TIMEOUT_MS = 20000;
const RETRY_DELAY_MS = 1500;

const clientDirectory = resolve(fileURLToPath(new URL("..", import.meta.url)));
const outputPath = resolve(clientDirectory, "src", "matches", "matches.json");
const outputLabel = relative(clientDirectory, outputPath);
const teamsDirectory = resolve(clientDirectory, "notes", "teams");

// The fetched data feeds the production build, so read the production env chain:
// .env -> .env.local -> .env.production -> .env.production.local, with process.env on top.
const env = loadEnv("production", clientDirectory, "");

const leagueId = Number.parseInt(env.VITE_DOTA_LEAGUE_ID ?? "", 10);
const seasonNumber = Number.parseInt(env.VITE_SEASON_NUMBER ?? "", 10);
const schedulePath = resolve(
  clientDirectory,
  "notes",
  "schedule",
  `season-${seasonNumber}.csv`,
);
const scheduleLabel = relative(clientDirectory, schedulePath);

const log = (message) => console.log(`[fetch:matches] ${message}`);
// In GitHub Actions a warning also shows up on the run's summary page.
const warn = (message) =>
  console.warn(
    `${process.env.GITHUB_ACTIONS ? "::warning::" : ""}[fetch:matches] ${message}`,
  );

/** Soft failure: warn, leave the committed file alone, and let the process end normally with
 * exit code 0. Callers `return giveUp(...)`. */
const giveUp = (message) => {
  warn(`${message} Leaving ${outputLabel} unchanged.`);
};

const delay = (milliseconds) =>
  new Promise((resolveDelay) => setTimeout(resolveDelay, milliseconds));

const fetchJson = async (url, label) => {
  for (let attempt = 1; attempt <= REQUEST_ATTEMPTS; attempt += 1) {
    try {
      const response = await fetch(url, {
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });

      if (!response.ok) {
        throw new Error(`${label} returned HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      if (attempt === REQUEST_ATTEMPTS) {
        throw new Error(`${label} failed: ${error?.message ?? error}`);
      }

      await delay(RETRY_DELAY_MS * attempt);
    }
  }
};

const openDota = (path) => `https://api.opendota.com/api/${path}`;

const readStoredData = () => {
  try {
    const stored = JSON.parse(readFileSync(outputPath, "utf8"));
    const matches = Array.isArray(stored?.matches) ? stored.matches : [];

    return {
      leagueId: Number(stored?.leagueId) || 0,
      leagueName:
        typeof stored?.leagueName === "string" ? stored.leagueName : "",
      matches: matches.filter(
        (match) =>
          Number.isFinite(match?.matchId) && Number.isFinite(match?.startTime),
      ),
    };
  } catch (error) {
    warn(
      `Could not read ${outputLabel} (${error.message}), starting from scratch.`,
    );

    return { leagueId: 0, leagueName: "", matches: [] };
  }
};

const fetchHeroesById = async () => {
  const heroes = await fetchJson(
    openDota("constants/heroes"),
    "OpenDota hero constants",
  );
  const heroesById = new Map();

  for (const hero of Object.values(heroes ?? {})) {
    if (!Number.isFinite(hero?.id) || typeof hero?.name !== "string") {
      continue;
    }

    heroesById.set(hero.id, {
      localizedName: hero.localized_name ?? hero.name,
      // The CDN slug is the hero key without the prefix: Zeus -> zuus, Io -> wisp.
      name: hero.name.replace(/^npc_dota_hero_/, ""),
    });
  }

  return heroesById;
};

const fetchLeagueName = async () => {
  try {
    const league = await fetchJson(
      openDota(`leagues/${leagueId}`),
      "OpenDota league",
    );

    return typeof league?.name === "string" ? league.name.trim() : "";
  } catch (error) {
    warn(`Could not resolve the league name: ${error.message}`);

    return "";
  }
};

const teamName = (name, fallback) =>
  typeof name === "string" && name.trim() ? name.trim() : fallback;

const picksFor = (picksBans, team, heroesById) =>
  (Array.isArray(picksBans) ? picksBans : [])
    .filter((entry) => entry?.is_pick && entry?.team === team)
    .sort((first, second) => first.order - second.order)
    .map((entry) => heroesById.get(entry.hero_id))
    .filter(Boolean);

const toLeagueMatch = (record, heroesById) => ({
  direName: teamName(record.dire_name, "Dire"),
  direPicks: picksFor(record.picks_bans, DIRE_TEAM, heroesById),
  direScore: Number(record.dire_score) || 0,
  durationSeconds: Number(record.duration) || 0,
  matchId: record.match_id,
  radiantName: teamName(record.radiant_name, "Radiant"),
  radiantPicks: picksFor(record.picks_bans, RADIANT_TEAM, heroesById),
  radiantScore: Number(record.radiant_score) || 0,
  radiantWin: Boolean(record.radiant_win),
  startTime: record.start_time,
});

/** One game's record, or null to try it again on the next run. */
const fetchMatchRecord = async (matchId) => {
  let record;

  try {
    record = await fetchJson(
      openDota(`matches/${matchId}`),
      `OpenDota match ${matchId}`,
    );
  } catch (error) {
    warn(`${error.message}, skipping it.`);

    return null;
  }

  if (record?.match_id !== matchId || !Number.isFinite(record?.start_time)) {
    warn(`Match ${matchId} came back incomplete, skipping it.`);

    return null;
  }

  if (record.leagueid !== leagueId) {
    warn(`Match ${matchId} belongs to league ${record.leagueid}, skipping it.`);

    return null;
  }

  return record;
};

/** Settings sit between the opening and closing `---` lines, as in src/teams/teams.ts. */
const FENCE = /^---[ \t]*\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/;

/** Team slug by lower-cased name and alias, matching teamByReportedName in teams.ts. */
const readTeamSlugs = () => {
  const slugs = new Map();

  for (const file of readdirSync(teamsDirectory)) {
    if (!file.endsWith(".md") || file === "README.md") {
      continue;
    }

    try {
      const source = readFileSync(resolve(teamsDirectory, file), "utf8");
      const data = load(FENCE.exec(source.replace(/^﻿/, ""))?.[1] ?? "") ?? {};
      const slug = file.replace(/\.md$/, "");
      const names = [
        data.name,
        ...(Array.isArray(data.aliases) ? data.aliases : []),
      ];

      for (const name of names) {
        const key = typeof name === "string" ? name.trim().toLowerCase() : "";

        if (key && !slugs.has(key)) {
          slugs.set(key, slug);
        }
      }
    } catch (error) {
      warn(
        `Could not read notes/teams/${file} (${error.message}), skipping it.`,
      );
    }
  }

  return slugs;
};

const semicolonList = (value) =>
  value
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean);

/**
 * Adds each new game's id to `matchIds` on the one fixture between its two teams. Only games
 * fetched in this run are linked, so an id an admin removes stays removed. Anything that
 * cannot be placed with certainty is left for the admin with a warning.
 *
 * Rows are edited one line at a time, so every other line keeps its exact bytes.
 */
const linkToSchedule = (newMatches) => {
  let source;

  try {
    source = readFileSync(schedulePath, "utf8");
  } catch (error) {
    warn(
      `Could not read ${scheduleLabel} (${error.message}), no games linked to fixtures.`,
    );

    return;
  }

  const lines = source.split("\n");
  const parseLine = (line) => Papa.parse(line.replace(/\r$/, "")).data[0] ?? [];
  const header = parseLine(lines[0]).map((column) => column.trim());
  const [home, away, matchIds] = ["home", "away", "matchIds"].map((column) =>
    header.indexOf(column),
  );

  if ([home, away, matchIds].includes(-1)) {
    warn(
      `${scheduleLabel} has no home, away or matchIds column, no games linked to fixtures.`,
    );

    return;
  }

  const fixtures = lines.flatMap((line, index) => {
    const cells = index > 0 && line.trim() ? parseLine(line) : [];

    return cells.length === header.length ? [{ cells, index }] : [];
  });
  const teamSlugs = readTeamSlugs();
  const slugFor = (name) => teamSlugs.get(name.trim().toLowerCase());
  let linked = 0;

  // Oldest first, so a series reads game 1;game 2.
  const oldestFirst = [...newMatches].sort(
    (first, second) => first.startTime - second.startTime,
  );

  for (const match of oldestFirst) {
    const label = `match ${match.matchId} (${match.radiantName} vs ${match.direName})`;
    const pair = [slugFor(match.radiantName), slugFor(match.direName)];

    if (!pair[0] || !pair[1]) {
      warn(
        `No team in notes/teams has the name of every side in ${label}. Add the name to that team's aliases, then the id to ${scheduleLabel} by hand.`,
      );

      continue;
    }

    const candidates = fixtures.filter(
      ({ cells }) =>
        [cells[home].trim(), cells[away].trim()].sort().join() ===
        [...pair].sort().join(),
    );

    if (candidates.length !== 1) {
      warn(
        `${scheduleLabel} has ${candidates.length} fixtures between ${pair.join(" and ")}, so ${label} needs its id added by hand.`,
      );

      continue;
    }

    const [fixture] = candidates;
    const ids = semicolonList(fixture.cells[matchIds]);

    if (ids.includes(String(match.matchId))) {
      continue;
    }

    const lineEnd = lines[fixture.index].endsWith("\r") ? "\r" : "";

    fixture.cells[matchIds] = [...ids, match.matchId].join(";");
    lines[fixture.index] =
      Papa.unparse([fixture.cells], { newline: "" }) + lineEnd;
    linked += 1;
  }

  if (linked > 0) {
    writeFileSync(schedulePath, lines.join("\n"));
    log(`Linked ${linked} game(s) to their fixtures in ${scheduleLabel}.`);
  }
};

const main = async () => {
  if (!Number.isInteger(leagueId) || leagueId <= 0) {
    return giveUp("VITE_DOTA_LEAGUE_ID is not set to a league id.");
  }

  const stored = readStoredData();
  // A league switch (e.g. to next season's ticket) must not merge two leagues, and must not
  // inherit the old league's name either.
  const sameLeague = stored.leagueId === leagueId;
  const previousMatches = sameLeague ? stored.matches : [];

  if (!sameLeague) {
    log(
      `League changed from ${stored.leagueId} to ${leagueId}, dropping stored matches.`,
    );
  }

  const listed = await fetchJson(
    openDota(`leagues/${leagueId}/matchIds`),
    "OpenDota league match ids",
  );

  if (!Array.isArray(listed)) {
    return giveUp(`OpenDota returned no match list for league ${leagueId}.`);
  }

  const knownIds = new Set(previousMatches.map((match) => match.matchId));
  // Once the store is full, anything older than its oldest entry has either been pruned
  // already or would be pruned again — fetching it would burn a call on every run. Match ids
  // grow with time, so the id stands in for the start time OpenDota does not list here.
  const oldestStored =
    previousMatches.length >= MAX_STORED_MATCHES
      ? Math.min(...previousMatches.map((match) => match.matchId))
      : 0;

  const candidates = listed
    .map(Number)
    .filter(
      (matchId) => Number.isSafeInteger(matchId) && matchId > oldestStored,
    )
    .filter((matchId) => !knownIds.has(matchId))
    .sort((first, second) => second - first)
    .slice(0, MAX_DETAIL_FETCHES);

  if (candidates.length === 0) {
    log(
      `League ${leagueId}: ${listed.length} matches listed, none new. ${outputLabel} is already up to date.`,
    );

    return;
  }

  log(
    `League ${leagueId}: ${listed.length} matches listed, fetching ${candidates.length} new.`,
  );

  const heroesById = await fetchHeroesById();
  const fetched = [];

  for (const matchId of candidates) {
    await delay(OPENDOTA_CALL_DELAY_MS);

    const record = await fetchMatchRecord(matchId);

    if (record) {
      fetched.push(toLeagueMatch(record, heroesById));
    }
  }

  if (fetched.length === 0) {
    return giveUp("No usable match records came back.");
  }

  const matches = [
    ...new Map(
      [...previousMatches, ...fetched].map((match) => [match.matchId, match]),
    ).values(),
  ]
    .sort((first, second) => second.startTime - first.startTime)
    .slice(0, MAX_STORED_MATCHES);

  writeFileSync(
    outputPath,
    `${JSON.stringify(
      {
        leagueId,
        leagueName:
          (await fetchLeagueName()) || (sameLeague ? stored.leagueName : ""),
        matches,
        updatedAt: new Date().toISOString().replace(/\.\d+Z$/, "Z"),
      },
      null,
      2,
    )}\n`,
  );

  log(
    `Wrote ${matches.length} matches (${fetched.length} new) to ${outputLabel}.`,
  );

  linkToSchedule(fetched);
};

try {
  await main();
} catch (error) {
  giveUp(`${error?.message ?? error}.`);
}

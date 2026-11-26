import clsx from "clsx";
import { Trophy } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { siteConfig } from "../config.ts";
import { formatDay, type TeamRef } from "../schedule/schedule.ts";
import { TwitchMark } from "../schedule/TwitchMark.tsx";
import { useSpoilersHidden } from "../spoilers/spoilers.ts";
import { STANDINGS } from "../standings/standings.ts";
import { TeamBadge } from "../teams/TeamBadge.tsx";
import { usePlayoffLabels } from "./labels.ts";
import {
  PLAYOFF_FINAL,
  PLAYOFF_MATCHES,
  shownSide,
  type PlayoffMatch,
} from "./playoffs.ts";

const leaguePlace = (slug: string) =>
  STANDINGS.find((row) => row.side.slug === slug && row.played > 0)?.rank;

type TeamLineProps = {
  from: PlayoffMatch | null;
  outcome: "lost" | "won" | null;
  score: number | null;
  side: TeamRef | null;
};

function TeamLine({ from, outcome, score, side }: TeamLineProps) {
  const { t } = useTranslation();
  const { placeName } = usePlayoffLabels();
  const spoilersHidden = useSpoilersHidden();
  // The league table is a result too, so the place goes with the scores.
  const place = side && !spoilersHidden ? leaguePlace(side.slug) : undefined;

  return (
    <div
      className={clsx(
        "flex min-h-[3.75rem] items-center gap-3 px-3.5 py-2.5",
        outcome === "won" && "bg-[#dcae47]/18",
      )}
    >
      {side?.team ? (
        <TeamBadge team={side.team} />
      ) : (
        <span
          aria-hidden
          className="grid h-[2.125rem] w-[2.125rem] shrink-0 place-items-center rounded-[3px] border border-dashed border-stone-900/35 bg-stone-900/10 font-mono text-[0.6rem] font-black text-[#5f5747]"
        >
          ?
        </span>
      )}

      <span className="flex min-w-0 flex-grow flex-col">
        {side ? (
          <span
            className={clsx(
              "truncate text-[1.05rem] font-extrabold leading-tight",
              outcome === "lost" && "text-[#6b624f]",
            )}
          >
            {side.team ? (
              <Link
                className="underline-offset-2 hover:underline"
                params={{ slug: side.slug }}
                to="/teams/$slug"
              >
                {side.name}
              </Link>
            ) : (
              side.name
            )}
          </span>
        ) : (
          <span className="truncate text-[0.95rem] font-bold text-[#7a6f5a]">
            {placeName(from)}
          </span>
        )}

        {place ? (
          <span className="mt-0.5 font-mono text-[0.6rem] font-black uppercase tracking-[0.14em] text-[#7a6f5a]">
            {t("playoffs.leaguePlace", {
              place: t("standings.place", { count: place, ordinal: true }),
            })}
          </span>
        ) : null}
      </span>

      {outcome === "won" ? (
        <span className="shrink-0 border border-[#dcae47] bg-[#dcae47]/20 px-1.5 py-0.5 font-mono text-[0.6rem] font-black uppercase tracking-[0.12em] text-[#7a5a12]">
          {t("matches.win")}
        </span>
      ) : null}

      {score !== null ? (
        <span
          className={clsx(
            "w-5 shrink-0 text-right font-mono text-xl font-black tabular-nums",
            outcome === "lost" ? "text-[#8a8071]" : "text-[#1c1d19]",
          )}
        >
          {score}
        </span>
      ) : null}
    </div>
  );
}

const outcomeFor = (side: TeamRef | null, winner: TeamRef | null) =>
  side && winner ? (side.slug === winner.slug ? "won" : "lost") : null;

function PlayoffCard({
  className,
  match,
}: {
  className?: string;
  match: PlayoffMatch;
}) {
  const { i18n, t } = useTranslation();
  const language = i18n.resolvedLanguage ?? i18n.language;
  const { matchName } = usePlayoffLabels();
  const spoilersHidden = useSpoilersHidden();
  const home = shownSide(match, "home", spoilersHidden);
  const away = shownSide(match, "away", spoilersHidden);
  const result = spoilersHidden ? null : match.result;
  const winner = spoilersHidden ? null : match.winner;
  const isLive = match.status === "live";
  const isOff = match.status === "postponed" || match.status === "cancelled";
  const isFinal = match.round === "final";

  return (
    <article
      className={clsx(
        "flex flex-col overflow-hidden rounded-md border",
        isLive
          ? "border-[#a95747]/60 bg-[linear-gradient(135deg,rgba(220,174,71,0.22),transparent_46%)] bg-[#f1eadc] shadow-[6px_7px_0_rgba(169,87,71,0.32)]"
          : isFinal
            ? "border-stone-900/30 bg-[#f1eadc] shadow-[6px_7px_0_rgba(28,29,25,0.16)]"
            : "border-stone-900/22 bg-[linear-gradient(180deg,rgba(255,252,244,0.7),rgba(255,252,244,0))] bg-[#eee7d7] shadow-[4px_5px_0_rgba(28,29,25,0.11)]",
        className,
      )}
    >
      {isLive || isFinal ? (
        <div
          className={clsx(
            "h-[5px]",
            isLive
              ? "bg-[linear-gradient(90deg,#a95747,#dcae47,#789469)]"
              : "bg-[#dcae47]",
          )}
        />
      ) : null}

      <div className="flex items-center justify-between gap-2.5 border-b border-stone-900/13 px-3.5 py-2.5 font-mono text-[0.68rem] font-black uppercase tracking-[0.14em]">
        <span className={isFinal ? "text-[#7f473d]" : "text-[#1c1d19]"}>
          {matchName(match)}
        </span>

        <span
          className={clsx(
            "flex items-center gap-1.5 text-right",
            isLive ? "text-[#8e2f22]" : "text-[#5f5747]",
          )}
        >
          {isLive ? (
            <>
              <span className="h-[7px] w-[7px] rounded-full bg-[#a94435]" />
              {t("schedule.live")}
            </>
          ) : isOff ? (
            t(
              match.status === "postponed"
                ? "schedule.postponed"
                : "schedule.cancelled",
            )
          ) : match.isDated ? (
            <>
              {formatDay(match.date, language)} ·{" "}
              {match.time || (
                <span className="text-[#8a8071]">
                  {t("playoffs.timeOpen")}
                </span>
              )}
            </>
          ) : (
            <span className="text-[#8a8071]">{t("schedule.timeOpen")}</span>
          )}
        </span>
      </div>

      <div className="divide-y divide-stone-900/10">
        <TeamLine
          from={match.homeFrom}
          outcome={outcomeFor(home, winner)}
          score={result ? result.homeScore : null}
          side={home}
        />
        <TeamLine
          from={match.awayFrom}
          outcome={outcomeFor(away, winner)}
          score={result ? result.awayScore : null}
          side={away}
        />
      </div>

      <div className="mt-auto flex items-center justify-between gap-3 border-t border-stone-900/13 bg-stone-900/4 px-3.5 py-2.5 font-mono text-[0.68rem] font-black uppercase tracking-[0.14em] text-[#645b4b]">
        {match.casters[0] ? (
          <a
            className="flex min-w-0 items-center gap-2 transition-colors hover:text-[#a95747]"
            href={`https://www.twitch.tv/${match.casters[0]}`}
            rel="noreferrer"
            target="_blank"
          >
            <TwitchMark />
            <span className="truncate">{match.casters.join(", ")}</span>
          </a>
        ) : (
          <span className="text-[#7a6f5a]">{t("schedule.casterOpen")}</span>
        )}

        {match.bestOf ? (
          <span className="shrink-0">
            {t("schedule.bestOf", { count: match.bestOf })}
          </span>
        ) : null}
      </div>
    </article>
  );
}

function Champion({ className }: { className?: string }) {
  const { t } = useTranslation();
  const spoilersHidden = useSpoilersHidden();
  const champion = PLAYOFF_FINAL?.winner ?? null;

  if (champion && !spoilersHidden) {
    return (
      <div
        className={clsx(
          "flex flex-col items-center rounded-md border-2 border-[#dcae47] bg-[#191b16] px-5 py-6 text-center text-[#f1eadc] shadow-[6px_7px_0_#0d0e0c]",
          className,
        )}
      >
        <Trophy aria-hidden className="h-7 w-7 text-[#dcae47]" />
        <p className="mt-2 font-mono text-[0.68rem] font-black uppercase tracking-[0.16em] text-[#dcae47]">
          {t("playoffs.champion", { season: siteConfig.signup.season })}
        </p>
        {champion.team ? (
          <TeamBadge className="mt-4" size="large" team={champion.team} />
        ) : null}
        <p className="mt-3 text-2xl font-black leading-tight tracking-[-0.03em]">
          {champion.team ? (
            <Link
              className="underline-offset-2 hover:underline"
              params={{ slug: champion.slug }}
              to="/teams/$slug"
            >
              {champion.name}
            </Link>
          ) : (
            champion.name
          )}
        </p>
      </div>
    );
  }

  return (
    <div
      className={clsx(
        "flex flex-col items-center justify-center rounded-md border-2 border-dashed border-stone-900/28 px-5 py-6 text-center text-[#7a6f5a]",
        className,
      )}
    >
      <Trophy aria-hidden className="h-7 w-7" />
      <p className="mt-2 font-mono text-[0.68rem] font-black uppercase tracking-[0.16em]">
        {t("playoffs.champion", { season: siteConfig.signup.season })}
      </p>
      <p className="mt-2 text-sm font-bold">
        {champion
          ? t("spoilers.resultHidden")
          : t("playoffs.championPending")}
      </p>
    </div>
  );
}

/** The bracket's arm from the two semifinals to the final, on wide screens only. */
function BracketArm({ className }: { className: string }) {
  return (
    <div aria-hidden className={clsx("relative", className)}>
      {/* The grid's row gap is 1.25rem, so each semifinal's middle sits a quarter of the rest in. */}
      <span className="absolute bottom-[calc((100%_-_1.25rem)/4)] left-0 right-1/2 top-[calc((100%_-_1.25rem)/4)] rounded-r-sm border-y-2 border-r-2 border-stone-900/35" />
      <span className="absolute left-1/2 right-0 top-1/2 -translate-y-px border-t-2 border-stone-900/35" />
    </div>
  );
}

/**
 * The homepage band for the playoffs. Renders nothing while
 * notes/schedule/playoffs.csv has no matches.
 */
export function PlayoffBracket() {
  const { t } = useTranslation();

  if (PLAYOFF_MATCHES.length === 0) {
    return null;
  }

  const semifinals = PLAYOFF_MATCHES.filter(
    (match) => match.round === "semifinal",
  );
  const final = PLAYOFF_FINAL;

  return (
    <section className="px-5 py-12 md:px-8 md:py-14">
      <div className="mx-auto max-w-6xl">
        <div className="mb-7 flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
          <div>
            <p className="mb-2 flex items-center gap-2 font-mono text-[0.7rem] font-extrabold uppercase tracking-[0.16em] text-[#7f473d]">
              <span className="dota-mark" aria-hidden />
              {t("season", { season: siteConfig.signup.season })}
            </p>

            <h2 className="text-4xl font-black leading-[0.92] tracking-[-0.035em]">
              {t("playoffs.title")}
            </h2>

            <p className="mt-3 max-w-xl leading-7 text-stone-700">
              {t("playoffs.intro")}
            </p>
          </div>

          <Link
            className="border-b-2 border-[#a95747] pb-1 font-mono text-[0.7rem] font-extrabold uppercase tracking-[0.16em] text-[#7f473d]"
            hash="playoffs"
            to="/schedule"
          >
            {t("schedule.seeAll")} →
          </Link>
        </div>

        {semifinals.length === 2 && final ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_2.5rem_minmax(0,1fr)_2.5rem_minmax(0,0.78fr)] lg:grid-rows-2 lg:gap-x-0">
            <PlayoffCard
              className="lg:col-start-1 lg:row-start-1"
              match={semifinals[0]}
            />
            <PlayoffCard
              className="lg:col-start-1 lg:row-start-2"
              match={semifinals[1]}
            />
            <BracketArm className="hidden lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:block" />
            <PlayoffCard
              className="lg:col-start-3 lg:row-span-2 lg:row-start-1 lg:self-center"
              match={final}
            />
            <div
              aria-hidden
              className="relative hidden lg:col-start-4 lg:row-span-2 lg:row-start-1 lg:block"
            >
              <span className="absolute inset-x-0 top-1/2 -translate-y-px border-t-2 border-stone-900/35" />
            </div>
            <Champion className="lg:col-start-5 lg:row-span-2 lg:row-start-1 lg:self-center" />
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {PLAYOFF_MATCHES.map((match) => (
              <PlayoffCard key={match.key} match={match} />
            ))}
            <Champion />
          </div>
        )}
      </div>
    </section>
  );
}

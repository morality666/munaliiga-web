import clsx from "clsx";
import { useTranslation } from "react-i18next";

import {
  type HeroPick,
  type LeagueMatch,
  formatMatchDate,
  formatMatchDuration,
  formatUpdatedAt,
  heroIconUrl,
  matchUrl,
  LEAGUE_MATCH_DATA,
  RECENT_MATCHES,
} from "./matches.ts";

type HeroPicksProps = {
  isDire: boolean;
  picks: HeroPick[];
  teamName: string;
};

type MatchCardProps = {
  language: string;
  match: LeagueMatch;
};

type TeamSideProps = {
  isDire: boolean;
  isWinner: boolean;
  name: string;
  picks: HeroPick[];
};

function WinBadge() {
  const { t } = useTranslation();

  return (
    <span className="shrink-0 border border-[#dcae47] bg-[#dcae47]/20 px-1.5 py-0.5 font-mono text-xs font-bold uppercase tracking-[0.12em] text-[#7a5a12]">
      {t("matches.win")}
    </span>
  );
}

function HeroPicks({ isDire, picks, teamName }: HeroPicksProps) {
  const { t } = useTranslation();

  return (
    <span
      aria-label={t("matches.picksLabel", {
        heroes: picks.map((pick) => pick.localizedName).join(", "),
        team: teamName,
      })}
      className={clsx(
        "flex min-w-0 shrink-0 flex-wrap items-center gap-[0.18rem]",
        isDire ? "justify-end" : "justify-start",
      )}
    >
      {picks.map((pick) => (
        <img
          key={pick.name}
          alt={pick.localizedName}
          className="block size-[1.12rem] rounded-[3px] border border-[rgba(28,29,25,0.36)] bg-[#191b16] object-cover shadow-[1px_1px_0_rgba(28,29,25,0.18)] sm:size-[1.45rem]"
          loading="lazy"
          src={heroIconUrl(pick.name)}
          title={pick.localizedName}
        />
      ))}
    </span>
  );
}

function TeamSide({ isDire, isWinner, name, picks }: TeamSideProps) {
  return (
    <span
      className={clsx(
        "flex min-w-0 items-center justify-between gap-3 sm:flex-col sm:gap-1",
        isDire ? "sm:items-end" : "sm:items-start",
      )}
    >
      <span
        className={clsx(
          "flex min-w-0 flex-wrap items-center gap-2",
          isDire ? "sm:flex-row-reverse" : null,
        )}
      >
        <span
          className={clsx(
            "min-w-0 break-words text-base",
            isDire ? "sm:text-right" : null,
            isWinner ? "font-black text-[#1c1d19]" : "font-bold text-stone-500",
          )}
        >
          {name}
        </span>

        {isWinner ? <WinBadge /> : null}
      </span>

      <HeroPicks isDire={isDire} picks={picks} teamName={name} />
    </span>
  );
}

function MatchCard({ language, match }: MatchCardProps) {
  const { t } = useTranslation();

  return (
    <article className="group relative border border-stone-900/25 bg-(--band-raised) shadow-[4px_5px_0_rgba(28,29,25,0.14)] transition-colors focus-within:border-[#a95747] hover:border-[#a95747]">
      <div className="flex flex-col gap-2 px-4 py-3 sm:grid sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] sm:items-center sm:gap-x-4">
        <TeamSide
          isDire={false}
          isWinner={match.radiantWin}
          name={match.radiantName}
          picks={match.radiantPicks}
        />

        <span className="flex flex-col items-center">
          <span className="whitespace-nowrap font-mono text-xs font-bold uppercase tracking-[0.14em] text-stone-600 sm:text-[10px]">
            {formatMatchDate(match.startTime, language)}
          </span>

          <span
            className="font-mono text-xl font-black tabular-nums text-[#1c1d19]"
            title={t("matches.score")}
          >
            {match.radiantScore}
            <span className="px-1.5 text-stone-500">–</span>
            {match.direScore}
          </span>

          <span className="flex items-center gap-1.5 whitespace-nowrap font-mono text-xs font-bold uppercase tracking-[0.14em] text-stone-600 sm:text-[10px]">
            <span title={t("matches.duration")}>
              {formatMatchDuration(match.durationSeconds)}
            </span>

            <a
              aria-label={t("matches.linkLabel", {
                dire: match.direName,
                radiant: match.radiantName,
              })}
              className="text-sm leading-none transition-colors after:absolute after:inset-0 group-hover:text-[#a95747]"
              href={matchUrl(match.matchId)}
              rel="noreferrer"
              target="_blank"
              title={t("matches.link")}
            >
              →
            </a>
          </span>
        </span>

        <TeamSide
          isDire
          isWinner={!match.radiantWin}
          name={match.direName}
          picks={match.direPicks}
        />
      </div>
    </article>
  );
}

export function RecentMatches() {
  const { i18n, t } = useTranslation();
  const language = i18n.resolvedLanguage ?? i18n.language;
  const updatedAt = formatUpdatedAt(LEAGUE_MATCH_DATA.updatedAt, language);

  return (
    <section className="px-5 py-14 md:px-8 md:py-16">
      <div className="mx-auto grid max-w-6xl gap-9 lg:grid-cols-[0.48fr_1fr] lg:items-center">
        <div>
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-stone-500">
            {t("matches.kicker")}
          </p>

          <h2 className="mt-3 text-3xl font-black tracking-[-0.035em]">
            {t("matches.title")}
          </h2>

          {LEAGUE_MATCH_DATA.leagueName ? (
            <p className="mt-4 max-w-sm leading-7 text-stone-700">
              {t("matches.body", { league: LEAGUE_MATCH_DATA.leagueName })}
            </p>
          ) : null}

          {updatedAt ? (
            <p className="mt-5 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-stone-500">
              {t("matches.updated", { date: updatedAt })}
            </p>
          ) : null}
        </div>

        {RECENT_MATCHES.length > 0 ? (
          <ol className="grid gap-4">
            {RECENT_MATCHES.map((match) => (
              <li key={match.matchId}>
                <MatchCard language={language} match={match} />
              </li>
            ))}
          </ol>
        ) : (
          <p className="border border-dashed border-stone-900/30 bg-(--band-raised) px-4 py-6 text-stone-600">
            {t("matches.empty")}
          </p>
        )}
      </div>
    </section>
  );
}

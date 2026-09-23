import clsx from "clsx";
import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { siteConfig } from "../config.ts";
import { TeamBadge } from "../teams/TeamBadge.tsx";
import {
  SCHEDULE_WEEKS,
  UPCOMING,
  formatDay,
  formatWeekSpan,
  type ScheduledMatch,
  type TeamRef,
} from "./schedule.ts";
import { TwitchMark } from "./TwitchMark.tsx";

const CARD_LIMIT = 3;

function CardSide({ side }: { side: TeamRef }) {
  return (
    <span className="flex items-center gap-3">
      {side.team ? (
        <TeamBadge team={side.team} />
      ) : (
        <span
          aria-hidden
          className="grid h-[2.125rem] w-[2.125rem] shrink-0 place-items-center rounded-[3px] border border-dashed border-stone-900/35 bg-stone-900/10 font-mono text-[0.6rem] font-black text-[#5f5747]"
        >
          ?
        </span>
      )}
      <span className="min-w-0 flex-grow truncate text-[1.05rem] font-extrabold leading-tight">
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
    </span>
  );
}

function NextUpCard({ match }: { match: ScheduledMatch }) {
  const { i18n, t } = useTranslation();
  const language = i18n.resolvedLanguage ?? i18n.language;
  const isLive = match.status === "live";
  const week = SCHEDULE_WEEKS.find((entry) => entry.week === match.week);
  // Until a kickoff is agreed, the week's date range is the best "when" there is.
  const weekSpan = week ? formatWeekSpan(week, language) : "";

  return (
    <article
      className={clsx(
        "overflow-hidden rounded-md border",
        isLive
          ? "border-[#a95747]/60 bg-[linear-gradient(135deg,rgba(220,174,71,0.22),transparent_46%)] bg-[#f1eadc] shadow-[6px_7px_0_rgba(169,87,71,0.32)]"
          : "border-stone-900/22 bg-[linear-gradient(180deg,rgba(255,252,244,0.7),rgba(255,252,244,0))] bg-[#eee7d7] shadow-[4px_5px_0_rgba(28,29,25,0.11)]",
      )}
    >
      {isLive ? (
        <div className="h-[5px] bg-[linear-gradient(90deg,#a95747,#dcae47,#789469)]" />
      ) : null}

      <div className="flex items-center justify-between gap-2.5 border-b border-stone-900/13 px-3.5 py-2.5">
        <span
          className={clsx(
            "flex items-center gap-1.5 font-mono text-[0.68rem] font-black uppercase tracking-[0.14em]",
            isLive ? "text-[#8e2f22]" : "text-[#1c1d19]",
          )}
        >
          {isLive ? (
            <>
              <span className="h-[7px] w-[7px] rounded-full bg-[#a94435]" />
              {t("schedule.live")}
            </>
          ) : match.isDated ? (
            [formatDay(match.date, language), match.time]
              .filter(Boolean)
              .join(" · ")
          ) : weekSpan ? (
            weekSpan
          ) : (
            <span className="text-[#7a6f5a]">{t("schedule.timeOpen")}</span>
          )}
        </span>

        {match.week ? (
          <span className="font-mono text-[0.68rem] font-black uppercase tracking-[0.14em] text-[#5f5747]">
            {t("schedule.week", { week: match.week })}
          </span>
        ) : null}
      </div>

      <div className="flex flex-col gap-2.5 px-3.5 py-3.5">
        <CardSide side={match.home} />

        <span className="flex items-center gap-2.5">
          <span className="h-px flex-grow bg-stone-900/16" />
          <span className="font-mono text-[0.68rem] font-black uppercase tracking-[0.14em] text-[#7a6f5a]">
            {match.bestOf ? t("schedule.bestOf", { count: match.bestOf }) : t("schedule.versus")}
          </span>
          <span className="h-px flex-grow bg-stone-900/16" />
        </span>

        <CardSide side={match.away} />
      </div>

      <div className="border-t border-stone-900/13 bg-stone-900/4 px-3.5 py-2.5">
        {match.casters[0] ? (
          <a
            className={clsx(
              "flex items-center gap-2 font-mono text-[0.68rem] font-black uppercase tracking-[0.14em] transition-colors hover:text-[#a95747]",
              isLive ? "text-[#7f473d]" : "text-[#645b4b]",
            )}
            href={`https://www.twitch.tv/${match.casters[0]}`}
            rel="noreferrer"
            target="_blank"
          >
            <TwitchMark />
            {match.casters.join(", ")}
          </a>
        ) : (
          <span className="font-mono text-[0.68rem] font-black uppercase tracking-[0.14em] text-[#7a6f5a]">
            {t("schedule.casterOpen")}
          </span>
        )}
      </div>
    </article>
  );
}

/**
 * The homepage band. Renders nothing at all when no match is coming up, so the
 * page does not carry an empty section through the off-season.
 */
export function NextUp() {
  const { t } = useTranslation();
  const matches = UPCOMING.slice(0, CARD_LIMIT);

  if (matches.length === 0) {
    return null;
  }

  return (
    <section className="px-5 py-9 md:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
          <div>
            <p className="mb-2 flex items-center gap-2 font-mono text-[0.7rem] font-extrabold uppercase tracking-[0.16em] text-[#7f473d]">
              <span className="dota-mark" aria-hidden />
              {t("season", { season: siteConfig.signup.season })}
            </p>

            <h2 className="text-4xl font-black leading-[0.92] tracking-[-0.035em]">
              {t("schedule.nextUp")}
            </h2>
          </div>

          <Link
            className="border-b-2 border-[#a95747] pb-1 font-mono text-[0.7rem] font-extrabold uppercase tracking-[0.16em] text-[#7f473d]"
            to="/schedule"
          >
            {t("schedule.seeAll")} →
          </Link>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {matches.map((match) => (
            <NextUpCard key={match.key} match={match} />
          ))}
        </div>
      </div>
    </section>
  );
}

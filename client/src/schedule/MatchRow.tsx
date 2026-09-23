import clsx from "clsx";
import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { matchUrl } from "../matches/matches.ts";
import { TeamBadge } from "../teams/TeamBadge.tsx";
import { formatDay, type ScheduledMatch, type TeamRef } from "./schedule.ts";

type SideProps = {
  align?: "end";
  dimmed: boolean;
  side: TeamRef;
  won: boolean | null;
};

function Side({ align, dimmed, side, won }: SideProps) {
  const { t } = useTranslation();

  const badge = side.team ? (
    <TeamBadge team={side.team} />
  ) : (
    <span
      aria-hidden
      className="grid h-[2.125rem] w-[2.125rem] shrink-0 place-items-center rounded-[3px] border border-dashed border-stone-900/35 bg-stone-900/10 font-mono text-[0.6rem] font-black text-[#5f5747]"
    >
      ?
    </span>
  );

  const name = (
    <span
      className={clsx(
        "min-w-0 truncate text-[0.95rem] font-extrabold",
        dimmed && "text-[#6b624f] line-through decoration-stone-900/35",
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
  );

  return (
    <span
      className={clsx(
        "flex min-w-0 flex-grow items-center gap-2.5",
        align === "end" && "md:flex-row-reverse md:text-right",
      )}
    >
      {badge}
      {name}
      {won ? (
        <span className="shrink-0 border border-[#dcae47] bg-[#dcae47]/20 px-1.5 py-0.5 font-mono text-[0.6rem] font-black uppercase tracking-[0.12em] text-[#7a5a12]">
          {t("matches.win")}
        </span>
      ) : null}
    </span>
  );
}

type MatchRowProps = {
  match: ScheduledMatch;
};

export function MatchRow({ match }: MatchRowProps) {
  const { i18n, t } = useTranslation();
  const language = i18n.resolvedLanguage ?? i18n.language;

  const isLive = match.status === "live";
  const isOff = match.status === "postponed" || match.status === "cancelled";
  const { result } = match;

  return (
    <div
      className={clsx(
        "rounded-md border px-4 py-3",
        isLive &&
          "border-[#a95747]/60 border-l-[5px] border-l-[#a94435] bg-[linear-gradient(135deg,rgba(220,174,71,0.2),transparent_40%)] bg-[#f1eadc] shadow-[6px_7px_0_rgba(169,87,71,0.3)]",
        isOff &&
          "border-stone-900/22 bg-[repeating-linear-gradient(135deg,rgba(28,29,25,0.05)_0_8px,transparent_8px_16px)] bg-[#eae2d0] shadow-[3px_4px_0_rgba(28,29,25,0.09)]",
        !isLive && !isOff && result && "border-stone-900/22 bg-[#e7dfcd] shadow-[3px_4px_0_rgba(28,29,25,0.09)]",
        !isLive && !isOff && !result && "border-stone-900/22 bg-[#eee7d7] shadow-[4px_5px_0_rgba(28,29,25,0.11)]",
      )}
    >
      <div className="flex flex-col gap-2.5 md:grid md:grid-cols-[6.5rem_minmax(0,1fr)_auto_minmax(0,1fr)_6.5rem] md:items-center md:gap-3.5 lg:grid-cols-[11rem_minmax(0,1fr)_auto_minmax(0,1fr)_11rem]">
        <span
          className={clsx(
            "flex shrink-0 items-center gap-1.5 font-mono text-[0.68rem] font-black uppercase tracking-[0.14em]",
            isLive ? "text-[#8e2f22]" : isOff ? "text-[#7a6f5a]" : "text-[#5f5747]",
          )}
        >
          {isLive ? (
            <>
              <span className="h-[7px] w-[7px] rounded-full bg-[#a94435]" />
              {t("schedule.live")}
            </>
          ) : match.isDated ? (
            `${formatDay(match.date, language)} ${match.time}`.trim()
          ) : (
            <span className="text-[#8a8071]">{t("schedule.timeOpen")}</span>
          )}
        </span>

        <Side dimmed={isOff} side={match.home} won={result?.homeWon === true} />

        <span className="shrink-0 self-start font-mono text-[0.95rem] font-black text-[#7a6f5a] md:self-auto md:justify-self-center">
          {result ? (
            <span className="text-[1.05rem] text-[#1c1d19]">
              {result.homeScore} — {result.awayScore}
            </span>
          ) : (
            t("schedule.versus")
          )}
        </span>

        <Side
          align="end"
          dimmed={isOff}
          side={match.away}
          won={result?.homeWon === false}
        />

        <span className="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[0.68rem] font-black uppercase tracking-[0.14em] text-[#5f5747] md:justify-end">
          {match.bestOf ? <span>{t("schedule.bestOf", { count: match.bestOf })}</span> : null}

          {match.note ? (
            <span className="text-[#8e2f22] normal-case tracking-normal">
              {match.note}
            </span>
          ) : null}

          {result?.games[0] ? (
            <a
              href={matchUrl(result.games[0].matchId)}
              rel="noreferrer"
              target="_blank"
            >
              Dotabuff →
            </a>
          ) : match.casters[0] ? (
            <a
              href={`https://www.twitch.tv/${match.casters[0]}`}
              rel="noreferrer"
              target="_blank"
            >
              {match.casters.join(", ")}
            </a>
          ) : null}
        </span>
      </div>
    </div>
  );
}

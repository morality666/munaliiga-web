import clsx from "clsx";
import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { formatUpdatedAt, LEAGUE_MATCH_DATA } from "../matches/matches.ts";
import type { TeamRef } from "../schedule/schedule.ts";
import { useSpoilersHidden } from "../spoilers/spoilers.ts";
import { TeamBadge } from "../teams/TeamBadge.tsx";
import {
  STANDINGS,
  STANDINGS_BY_NAME,
  formatDiff,
  type StandingsRow,
} from "./standings.ts";

const FULL_COLUMNS = ["played", "won", "lost", "diff", "points"] as const;
const COMPACT_COLUMNS = ["played", "diff", "points"] as const;

type Column = (typeof FULL_COLUMNS)[number];

type TeamCellProps = {
  compact: boolean;
  side: TeamRef;
};

/**
 * On a phone the full table has no room for badges as well as five number
 * columns, so it drops them there and lets long names wrap instead.
 */
function TeamCell({ compact, side }: TeamCellProps) {
  return (
    <span className="flex min-w-0 items-center gap-2.5">
      <span className={clsx("shrink-0", compact ? "flex" : "hidden sm:flex")}>
        {side.team ? (
          <TeamBadge team={side.team} />
        ) : (
          <span
            aria-hidden
            className="grid h-[2.125rem] w-[2.125rem] place-items-center rounded-[3px] border border-dashed border-stone-900/35 bg-stone-900/10 font-mono text-[0.6rem] font-black text-[#5f5747]"
          >
            ?
          </span>
        )}
      </span>

      <span className="min-w-0 font-sans text-[0.85rem] font-extrabold leading-tight [overflow-wrap:anywhere] sm:truncate sm:text-[0.95rem]">
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

function Value({ column, row }: { column: Column; row: StandingsRow }) {
  if (column !== "diff") {
    return row[column];
  }

  return (
    <span
      className={clsx(
        row.diff > 0 && "text-[#4d6b3c]",
        row.diff < 0 && "text-[#8e2f22]",
      )}
    >
      {formatDiff(row.diff)}
    </span>
  );
}

type StandingsTableProps = {
  compact?: boolean;
};

/**
 * The league table. With spoilers hidden it keeps the teams, in name order,
 * and leaves out every number that would give a result away.
 */
export function StandingsTable({ compact = false }: StandingsTableProps) {
  const { i18n, t } = useTranslation();
  const language = i18n.resolvedLanguage ?? i18n.language;
  const spoilersHidden = useSpoilersHidden();
  const rows = spoilersHidden ? STANDINGS_BY_NAME : STANDINGS;
  const columns = compact ? COMPACT_COLUMNS : FULL_COLUMNS;
  const updatedAt = formatUpdatedAt(LEAGUE_MATCH_DATA.updatedAt, language);

  return (
    <div className="flex min-w-0 flex-col gap-3">
      <div
        className={clsx(
          "overflow-x-auto rounded-md border border-stone-900/22",
          compact
            ? "bg-(--band-raised) shadow-[4px_5px_0_rgba(28,29,25,0.14)]"
            : "bg-[#eee7d7] shadow-[4px_5px_0_rgba(28,29,25,0.11)]",
        )}
      >
        <table className="w-full border-collapse font-mono tabular-nums">
          <thead>
            <tr className="border-b-2 border-stone-900/28 text-[0.62rem] font-black uppercase tracking-[0.14em] text-[#7a6f5a]">
              <th className="py-2.5 pl-3 pr-1 text-left sm:pl-4" scope="col">
                <abbr className="no-underline" title={t("standings.rank")}>
                  #
                </abbr>
              </th>

              <th className="px-1.5 py-2.5 text-left" scope="col">
                {t("standings.team")}
              </th>

              {columns.map((column) => (
                <th
                  className={clsx(
                    "whitespace-nowrap px-1.5 py-2.5 text-center last:pr-4 sm:px-3.5",
                    column === "points" && "bg-[#dcae47]/16 text-[#1c1d19]",
                  )}
                  key={column}
                  scope="col"
                >
                  <abbr
                    className="no-underline"
                    title={t(`standings.columnsLong.${column}`)}
                  >
                    {t(`standings.columns.${column}`)}
                  </abbr>
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {rows.map((row) => (
              <tr
                className="border-t border-stone-900/12 first:border-t-0"
                key={row.side.slug}
              >
                <td className="py-2 pl-3 pr-1 text-[0.9rem] font-black text-[#5f5747] sm:pl-4">
                  {spoilersHidden ? (
                    <span className="text-[#8a8071]">–</span>
                  ) : (
                    row.rank
                  )}
                </td>

                <td className="w-full max-w-0 px-1.5 py-2">
                  <TeamCell compact={compact} side={row.side} />
                </td>

                {columns.map((column) => (
                  <td
                    className={clsx(
                      "px-1.5 py-2 text-center text-[0.9rem] font-extrabold last:pr-4 sm:px-3.5",
                      column === "points" &&
                        "bg-[#dcae47]/16 text-[1.02rem] font-black",
                      spoilersHidden && "text-[#8a8071]",
                    )}
                    key={column}
                  >
                    {spoilersHidden ? "–" : <Value column={column} row={row} />}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {compact ? null : (
        <p className="flex flex-wrap gap-x-4 gap-y-1 font-mono text-[0.62rem] font-black uppercase tracking-[0.14em] text-[#7a6f5a]">
          {columns.map((column) => (
            <span key={column}>
              <span className="text-[#1c1d19]">
                {t(`standings.columns.${column}`)}
              </span>{" "}
              {t(`standings.columnsLong.${column}`)}
            </span>
          ))}

          {updatedAt ? (
            <span>{t("matches.updated", { date: updatedAt })}</span>
          ) : null}
        </p>
      )}
    </div>
  );
}

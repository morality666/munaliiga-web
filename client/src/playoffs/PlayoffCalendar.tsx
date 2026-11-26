import { useTranslation } from "react-i18next";
import { MatchRow } from "../schedule/MatchRow.tsx";
import { formatDaySpan, type ScheduledMatch } from "../schedule/schedule.ts";
import { useSpoilersHidden } from "../spoilers/spoilers.ts";
import { usePlayoffLabels } from "./labels.ts";
import {
  PLAYOFF_MATCHES,
  PLAYOFF_ROUND_GROUPS,
  shownSide,
  type PlayoffMatch,
} from "./playoffs.ts";

const dates = PLAYOFF_MATCHES.map((match) => match.date)
  .filter(Boolean)
  .sort();

/** The playoffs on /schedule, after the league weeks. Renders nothing without playoff matches. */
export function PlayoffCalendar() {
  const { i18n, t } = useTranslation();
  const language = i18n.resolvedLanguage ?? i18n.language;
  const { placeName } = usePlayoffLabels();
  const spoilersHidden = useSpoilersHidden();

  if (PLAYOFF_MATCHES.length === 0) {
    return null;
  }

  // An undecided place, or one a hidden result would give away, reads "winner of …".
  const asFixture = (match: PlayoffMatch): ScheduledMatch => {
    const sideFor = (place: "away" | "home") =>
      shownSide(match, place, spoilersHidden) ?? {
        name: placeName(place === "home" ? match.homeFrom : match.awayFrom),
        slug: "",
        team: undefined,
      };

    return { ...match, away: sideFor("away"), home: sideFor("home") };
  };

  return (
    <div className="scroll-mt-24" id="playoffs">
      <div className="mb-3.5 border-b-2 border-stone-900/28 pb-2.5">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h2 className="text-2xl font-black tracking-[-0.03em]">
            {t("playoffs.title")}
          </h2>

          <span className="font-mono text-[0.68rem] font-black uppercase tracking-[0.14em] text-[#7a6f5a]">
            {formatDaySpan(dates[0] ?? "", dates.at(-1) ?? "", language)}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-5">
        {PLAYOFF_ROUND_GROUPS.map((group) => (
          <div key={group.round}>
            <h3 className="mb-2 font-mono text-[0.68rem] font-black uppercase tracking-[0.14em] text-[#7f473d]">
              {t(`playoffs.rounds.${group.round}`)}
            </h3>

            <div className="flex flex-col gap-2.5">
              {group.matches.map((match) => (
                <MatchRow key={match.key} match={asFixture(match)} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

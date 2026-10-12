import { useTranslation } from "react-i18next";

import { MatchCard } from "./MatchCard.tsx";
import {
  formatUpdatedAt,
  LEAGUE_MATCH_DATA,
  RECENT_MATCHES,
} from "./matches.ts";

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

import clsx from "clsx";
import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { siteConfig } from "../config.ts";
import { MatchRow } from "./MatchRow.tsx";
import { SCHEDULE_WEEKS, formatWeekSpan, type ScheduleWeek } from "./schedule.ts";

function ByeBanner({ week }: { week: ScheduleWeek }) {
  const { t } = useTranslation();

  if (week.bye.length === 0) {
    return null;
  }

  return (
    <p className="mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-1 rounded-md border border-[#7a2f24] bg-[#a03a3a] px-4 py-2.5 text-center font-mono text-[0.72rem] font-black uppercase tracking-[0.14em] text-[#f6ece2] shadow-[4px_5px_0_rgba(28,29,25,0.18)]">
      <span className="text-[#f0c9a8]">{t("schedule.bye")}</span>
      <span>
        {week.bye.map((side) =>
          side.team ? (
            <Link
              className="underline underline-offset-2"
              key={side.slug}
              params={{ slug: side.slug }}
              to="/teams/$slug"
            >
              {side.name}
            </Link>
          ) : (
            <span key={side.slug}>{side.name}</span>
          ),
        )}
      </span>
    </p>
  );
}

export function SchedulePage() {
  const { i18n, t } = useTranslation();
  const language = i18n.resolvedLanguage ?? i18n.language;

  return (
    <main className="obsidian-page paper-field min-h-[calc(100svh-var(--spacing-card-height))] bg-[#e8e0ce] text-[#1c1d19]">
      <section className="relative bg-[#191b16] text-stone-100">
        <div className="dota-lanes pointer-events-none absolute inset-0 opacity-30" />

        <div className="relative mx-auto max-w-7xl px-5 pb-9 pt-10 md:px-8">
          <p className="mb-3 flex items-center gap-2 font-mono text-[0.7rem] font-extrabold uppercase tracking-[0.16em] text-[#dcae47]">
            <span className="dota-mark" aria-hidden />
            {t("season", { season: siteConfig.signup.season })}
          </p>

          <h1 className="text-5xl font-black leading-[0.9] tracking-[-0.045em] text-[#f1eadc] sm:text-6xl">
            {t("schedule.title")}
          </h1>

          <p className="mt-4 max-w-xl text-[0.95rem] leading-7 text-stone-300">
            {t("schedule.intro")}
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-8 md:px-8">
        {SCHEDULE_WEEKS.length === 0 ? (
          <p className="rounded-md border border-dashed border-stone-900/30 bg-[#eee7d7] px-5 py-8 text-center text-[0.95rem] text-[#645b4b]">
            {t("schedule.empty")}
          </p>
        ) : (
          <div className="flex flex-col gap-9">
            {SCHEDULE_WEEKS.map((week) => (
              <div key={week.week}>
                <div className="mb-3.5 border-b-2 border-stone-900/28 pb-2.5">
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <h2
                      className={clsx(
                        "text-2xl font-black tracking-[-0.03em]",
                        week.isPast && "text-[#5f5747]",
                      )}
                    >
                      {t("schedule.week", { week: week.week })}
                    </h2>

                    <span className="font-mono text-[0.68rem] font-black uppercase tracking-[0.14em] text-[#7a6f5a]">
                      {formatWeekSpan(week, language)}
                    </span>

                    <span className="flex-grow" />

                    {week.isCurrent ? (
                      <span className="font-mono text-[0.68rem] font-black uppercase tracking-[0.14em] text-[#8e2f22]">
                        {t("schedule.weekCurrent")}
                      </span>
                    ) : week.isPast ? (
                      <span className="font-mono text-[0.68rem] font-black uppercase tracking-[0.14em] text-[#7a6f5a]">
                        {t("schedule.roundPlayed")}
                      </span>
                    ) : null}
                  </div>

                  <ByeBanner week={week} />
                </div>

                <div className="flex flex-col gap-2.5">
                  {week.matches.map((match) => (
                    <MatchRow key={match.key} match={match} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

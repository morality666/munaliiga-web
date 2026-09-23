import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { siteConfig } from "../config.ts";
import { TeamBadge } from "./TeamBadge.tsx";
import { TeamRoster } from "./TeamRoster.tsx";
import { TEAMS } from "./teams.ts";

export function TeamsIndex() {
  const { t } = useTranslation();

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
            {t("teams.title")}
          </h1>

          <p className="mt-4 max-w-xl text-[0.95rem] leading-7 text-stone-300">
            {t("teams.intro")}
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-8 md:px-8">
        {TEAMS.length === 0 ? (
          <p className="rounded-md border border-dashed border-stone-900/30 bg-[#eee7d7] px-5 py-8 text-center text-[0.95rem] text-[#645b4b]">
            {t("teams.empty")}
          </p>
        ) : (
          <div className="team-grid">
            {TEAMS.map((team) => (
              <Link
                className="team-card team-card-link"
                key={team.slug}
                params={{ slug: team.slug }}
                to="/teams/$slug"
              >
                <header className="team-card-header">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2.5">
                      <TeamBadge team={team} />
                      <h2 className="min-w-0 text-xl font-black leading-tight tracking-[-0.02em]">
                        {team.name}
                      </h2>
                    </div>

                    {team.coach ? (
                      <p className="team-coach">
                        {t("teams.coach")} · {team.coach}
                      </p>
                    ) : null}
                  </div>
                </header>

                <TeamRoster players={team.players} />
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

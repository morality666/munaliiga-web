import { Link } from "@tanstack/react-router";
import clsx from "clsx";
import { useTranslation } from "react-i18next";
import { siteConfig } from "../config.ts";
import { TeamBadge } from "./TeamBadge.tsx";
import { TeamRoster } from "./TeamRoster.tsx";
import type { Team } from "./teams.ts";

type TeamPageProps = {
  team: Team;
};

export function TeamPage({ team }: TeamPageProps) {
  const { t } = useTranslation();

  return (
    <main className="obsidian-page paper-field min-h-[calc(100svh-var(--spacing-card-height))] bg-[#e8e0ce] text-[#1c1d19]">
      <section className="relative bg-[#191b16] text-stone-100">
        <div className="dota-lanes pointer-events-none absolute inset-0 opacity-30" />

        <div className="relative mx-auto max-w-7xl px-5 pb-8 pt-8 md:px-8">
          <Link
            className="mb-5 inline-block font-mono text-[0.7rem] font-extrabold uppercase tracking-[0.16em] text-stone-400 hover:text-[#dcae47]"
            to="/teams"
          >
            ← {t("teams.allTeams")}
          </Link>

          <div className="flex flex-wrap items-end gap-6">
            {/* A logo gets its own card beside the roster instead. */}
            {team.logoUrl ? null : (
              <TeamBadge
                className="-rotate-[1.5deg] shadow-[6px_7px_0_rgba(169,87,71,0.45)]"
                size="large"
                team={team}
              />
            )}

            <div className="min-w-0 flex-grow">
              <p className="mb-2.5 flex items-center gap-2 font-mono text-[0.7rem] font-extrabold uppercase tracking-[0.16em] text-[#dcae47]">
                <span className="dota-mark" aria-hidden />
                {t("season", { season: team.season ?? siteConfig.signup.season })}
              </p>

              <h1 className="text-5xl font-black leading-[0.88] tracking-[-0.045em] text-[#f1eadc] [text-shadow:0.07em_0.07em_0_#0d0e0c] sm:text-6xl">
                {team.name}
              </h1>

              {team.coach ? (
                <p className="mt-4 flex items-baseline gap-2.5">
                  <span className="font-mono text-[0.68rem] font-extrabold uppercase tracking-[0.16em] text-stone-400">
                    {t("teams.coach")}
                  </span>
                  <span className="text-lg font-bold text-[#f1eadc]">
                    {team.coach}
                  </span>
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <section
        className={clsx(
          "mx-auto px-5 py-8 md:px-8",
          team.logoUrl
            ? "grid max-w-4xl items-start gap-6 md:grid-cols-[18rem_minmax(0,1fr)]"
            : "max-w-2xl",
        )}
      >
        {team.logoUrl ? (
          <figure className="w-full max-w-72 overflow-hidden rounded-md border border-stone-900/22 bg-[#eee7d7] shadow-[5px_6px_0_rgba(28,29,25,0.11)]">
            <figcaption className="border-b border-stone-900/16 bg-stone-900/5 px-4 py-3">
              <span className="font-mono text-[0.7rem] font-extrabold uppercase tracking-[0.16em] text-[#5f5747]">
                {t("teams.logo")}
              </span>
            </figcaption>
            <img
              alt={t("teams.logoAlt", { team: team.name })}
              className="block h-auto w-full"
              src={team.logoUrl}
            />
          </figure>
        ) : null}

        <div className="overflow-hidden rounded-md border border-stone-900/22 bg-[#eee7d7] shadow-[5px_6px_0_rgba(28,29,25,0.11)]">
          <div className="border-b border-stone-900/16 bg-stone-900/5 px-4 py-3">
            <span className="font-mono text-[0.7rem] font-extrabold uppercase tracking-[0.16em] text-[#5f5747]">
              {t("teams.roster")}
            </span>
          </div>

          <TeamRoster captain={team.captain} players={team.players} />
        </div>
      </section>
    </main>
  );
}

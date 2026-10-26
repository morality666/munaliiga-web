import { useTranslation } from "react-i18next";
import { siteConfig } from "../config.ts";
import { useSpoilersHidden } from "../spoilers/spoilers.ts";
import { STANDINGS } from "./standings.ts";
import { StandingsTable } from "./StandingsTable.tsx";

export function StandingsPage() {
  const { t } = useTranslation();
  const spoilersHidden = useSpoilersHidden();

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
            {t("standings.title")}
          </h1>
        </div>
      </section>

      <section className="mx-auto flex max-w-3xl flex-col gap-3 px-5 py-8 md:px-8">
        {STANDINGS.length === 0 ? (
          <p className="rounded-md border border-dashed border-stone-900/30 bg-[#eee7d7] px-5 py-8 text-center text-[0.95rem] text-[#645b4b]">
            {t("standings.empty")}
          </p>
        ) : (
          <>
            {spoilersHidden ? (
              <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1 rounded-md border border-[#7a2f24] bg-[#a03a3a] px-4 py-2.5 text-[#f6ece2] shadow-[4px_5px_0_rgba(28,29,25,0.18)]">
                <span className="font-mono text-[0.72rem] font-black uppercase tracking-[0.14em] text-[#f0c9a8]">
                  {t("standings.hiddenTitle")}
                </span>
                <span className="text-[0.9rem]">
                  {t("standings.hiddenBody")}
                </span>
              </p>
            ) : null}

            <StandingsTable />
          </>
        )}
      </section>
    </main>
  );
}

import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { STANDINGS } from "./standings.ts";
import { StandingsTable } from "./StandingsTable.tsx";

/** The homepage band. Renders nothing until the season's fixtures are published. */
export function StandingsSummary() {
  const { t } = useTranslation();

  if (STANDINGS.length === 0) {
    return null;
  }

  return (
    <section className="px-5 py-14 md:px-8 md:py-16">
      <div className="mx-auto grid max-w-6xl gap-9 lg:grid-cols-[0.48fr_1fr] lg:items-center">
        <div>
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-stone-500">
            {t("standings.title")}
          </p>

          <h2 className="mt-3 text-3xl font-black tracking-[-0.035em]">
            {t("standings.homeTitle")}
          </h2>

          <Link
            className="mt-5 inline-block border-b border-stone-500 pb-1 text-sm font-bold hover:border-stone-950"
            to="/standings"
          >
            {t("standings.seeAll")} →
          </Link>
        </div>

        <StandingsTable compact />
      </div>
    </section>
  );
}

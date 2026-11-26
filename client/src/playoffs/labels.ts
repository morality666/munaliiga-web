import { useTranslation } from "react-i18next";
import type { PlayoffMatch } from "./playoffs.ts";

/** Names for playoff matches and for the places their winners go on to. */
export const usePlayoffLabels = () => {
  const { t } = useTranslation();

  return {
    matchName: (match: PlayoffMatch) =>
      t(`playoffs.match.${match.round}`, { number: match.number }),
    /** "Winner of semifinal 1", or a plain "to be decided" for a place nothing feeds. */
    placeName: (from: PlayoffMatch | null) =>
      from
        ? t(`playoffs.winnerOf.${from.round}`, { number: from.number })
        : t("playoffs.teamOpen"),
  };
};

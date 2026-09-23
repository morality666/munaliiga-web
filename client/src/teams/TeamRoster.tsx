import { useTranslation } from "react-i18next";
import type { TeamPlayer, TeamRole } from "./teams.ts";

const ROLE_KEYS: Record<TeamRole, string> = {
  carry: "teams.roles.carry",
  mid: "teams.roles.mid",
  offlane: "teams.roles.offlane",
  "soft-support": "teams.roles.softSupport",
  "hard-support": "teams.roles.hardSupport",
};

type TeamRosterProps = {
  /** Marked with a badge on their own row rather than listed separately. */
  captain?: string;
  players: TeamPlayer[];
};

export function TeamRoster({ captain, players }: TeamRosterProps) {
  const { t } = useTranslation();

  if (players.length === 0) {
    return (
      <p className="px-4 py-6 text-center text-[0.9rem] text-[#645b4b]">
        {t("teams.rosterPending")}
      </p>
    );
  }

  // Positions are not locked, so a role is left out when unknown rather than
  // guessed at. The column is kept while anyone has one, so names still align.
  const showPositions = players.some((player) => player.role);

  return (
    <ol className="roster-list [grid-auto-rows:minmax(2.55rem,1fr)] [grid-template-rows:none]">
      {players.map((player) => (
        <li
          className={showPositions ? undefined : "roster-row-plain"}
          key={`${player.role ?? "player"}-${player.name}`}
        >
          {showPositions ? (
            <span className="roster-position">
              {player.role ? t(ROLE_KEYS[player.role]) : ""}
            </span>
          ) : null}
          <span className="player-name">{player.name}</span>
          <span>
            {captain && player.name === captain ? (
              <span className="rounded-[3px] border border-stone-900/30 px-1.5 py-0.5 font-mono text-[0.56rem] font-black uppercase tracking-[0.12em] text-[#7f473d]">
                {t("teams.captain")}
              </span>
            ) : null}
          </span>
        </li>
      ))}
    </ol>
  );
}

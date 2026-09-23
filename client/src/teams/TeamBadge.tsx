import clsx from "clsx";
import type { Team } from "./teams.ts";

type TeamBadgeProps = {
  className?: string;
  size?: "large" | "small";
  team: Team;
};

/**
 * A team's logo when it has one, otherwise its tag on an ink tile underlined in
 * the team colour. Most teams never get a logo, so the tile is the normal case
 * rather than a fallback.
 */
export function TeamBadge({ className, size = "small", team }: TeamBadgeProps) {
  const isLarge = size === "large";

  if (team.logoUrl) {
    return (
      <img
        alt=""
        className={clsx(
          "shrink-0 rounded-[3px] border border-stone-900/35 object-cover shadow-[1px_1px_0_rgba(28,29,25,0.18)]",
          isLarge ? "h-23 w-23" : "h-[2.125rem] w-[2.125rem]",
          className,
        )}
        loading="lazy"
        src={team.logoUrl}
      />
    );
  }

  return (
    <span
      aria-hidden
      className={clsx(
        "grid shrink-0 place-items-center rounded-[3px] border border-stone-900/35 bg-[#191b16] font-mono font-black text-[#f1eadc] shadow-[1px_1px_0_rgba(28,29,25,0.18)]",
        isLarge
          ? "h-23 w-23 border-2 border-[#f1eadc]/30 bg-[#0d0e0c] text-2xl"
          : "h-[2.125rem] w-[2.125rem] text-xs",
        className,
      )}
      style={{
        borderBottomColor: team.color,
        borderBottomWidth: isLarge ? "6px" : "3px",
      }}
    >
      {team.tag}
    </span>
  );
}

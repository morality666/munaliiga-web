const uniqueChannels = (import.meta.env.VITE_TWITCH_CHANNELS ?? "morality666")
  .split(",")
  .map((channel: string) => channel.trim().toLowerCase())
  .filter(Boolean);

const normalizeDomain = (domain: string) => {
  const trimmed = domain.trim();

  if (!trimmed) {
    return "";
  }

  try {
    return new URL(trimmed.includes("://") ? trimmed : `https://${trimmed}`)
      .hostname;
  } catch {
    return trimmed.split("/")[0]?.split(":")[0] ?? "";
  }
};

const twitchParentDomains = (
  import.meta.env.VITE_TWITCH_PARENT_DOMAINS ??
  "munaliiga.fi,www.munaliiga.fi,localhost,127.0.0.1"
)
  .split(",")
  .map((domain: string) => normalizeDomain(domain).toLowerCase())
  .filter(Boolean);

const signupOpensAt =
  import.meta.env.VITE_SIGNUP_OPENS_AT?.trim() || null;
const signupClosesAt =
  import.meta.env.VITE_SIGNUP_CLOSES_AT?.trim() || null;
const signupOpenOverride =
  import.meta.env.VITE_SIGNUPS_OPEN?.trim().toLowerCase() || null;
const playerSignupUrl =
  import.meta.env.VITE_PLAYER_SIGNUP_URL?.trim() ||
  import.meta.env.VITE_SIGNUP_URL?.trim() ||
  "";
const coachSignupUrl = import.meta.env.VITE_COACH_SIGNUP_URL?.trim() || "";
const offseasonFiUrl =
  import.meta.env.VITE_OFFSEASON_FORM_URL_FI?.trim() || "";
const offseasonEnUrl =
  import.meta.env.VITE_OFFSEASON_FORM_URL_EN?.trim() || "";

export const siteConfig = {
  discordUrl:
    import.meta.env.VITE_DISCORD_URL ?? "https://discord.gg/Nd75KFMAQt",
  signup: {
    closesAt: signupClosesAt,
    coachUrl: coachSignupUrl,
    offseasonUrls: {
      en: offseasonEnUrl || offseasonFiUrl,
      fi: offseasonFiUrl || offseasonEnUrl,
    },
    opensAt: signupOpensAt,
    playerUrl: playerSignupUrl,
    season: import.meta.env.VITE_SEASON_NUMBER?.trim() || "3",
    url: import.meta.env.VITE_SIGNUP_URL ?? "https://forms.google.com",
  },
  twitchChannels: [...new Set(["morality666", ...uniqueChannels])],
  twitchParentDomains: [...new Set(twitchParentDomains)],
  youtubeUrl:
    import.meta.env.VITE_YOUTUBE_URL ??
    "https://www.youtube.com/@morality666",
} as const;

const hasPassed = (isoDate: string | null) => {
  const timestamp = isoDate ? Date.parse(isoDate) : Number.NaN;

  return Number.isFinite(timestamp) && Date.now() >= timestamp;
};

/**
 * "closed" means the season is underway and only the off-season form is
 * offered. The override wins over both dates, except that a "false" override
 * still reads as closed once the closing date has passed.
 */
type SignupStatus = "soon" | "open" | "closed";

const getSignupStatus = (): SignupStatus => {
  if (signupOpenOverride === "true") {
    return "open";
  }

  if (hasPassed(siteConfig.signup.closesAt)) {
    return "closed";
  }

  if (signupOpenOverride === "false") {
    return "soon";
  }

  return hasPassed(siteConfig.signup.opensAt) ? "open" : "soon";
};

export const signupStatus = getSignupStatus();

/** The off-season form in the reader's language. */
export const getOffseasonUrl = (language: string) =>
  language.startsWith("fi")
    ? siteConfig.signup.offseasonUrls.fi
    : siteConfig.signup.offseasonUrls.en;
